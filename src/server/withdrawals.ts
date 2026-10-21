import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import {
	cashWithdrawals,
	expenses,
	registerSessions,
	transactions,
	users,
} from "@/db/schema";
import type { cashWithdrawalSchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";

let schemaEnsured = false;
export async function ensureWithdrawalsSchema() {
	if (schemaEnsured) return;
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "cash_withdrawals" (
				"id" serial PRIMARY KEY NOT NULL,
				"workspace_id" integer NOT NULL,
				"register_session_id" integer NOT NULL,
				"user_id" integer NOT NULL,
				"amount" numeric(12, 2) NOT NULL,
				"reason" text NOT NULL,
				"description" text,
				"balance_before" numeric(12, 2) NOT NULL,
				"balance_after" numeric(12, 2) NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL
			);
		`);
		schemaEnsured = true;
	} catch (error) {
		console.error("Auto-schema check for cash_withdrawals:", error);
	}
}

export const getDrawerCashStatusFn = createServerFn({ method: "GET" })
	.validator((data?: { registerSessionId?: number }) => data || {})
	.handler(async ({ data }) => {
		await ensureWithdrawalsSchema();
		const { user, activeStoreId } = await getAuthenticatedUserWithActiveStore();

		let activeRegister = null;

		if (data.registerSessionId) {
			const [reg] = await db
				.select()
				.from(registerSessions)
				.where(eq(registerSessions.id, data.registerSessionId));
			activeRegister = reg || null;
		} else {
			const [reg] = await db
				.select()
				.from(registerSessions)
				.where(
					and(
						eq(registerSessions.workspaceId, activeStoreId),
						eq(registerSessions.status, "open"),
					),
				)
				.orderBy(desc(registerSessions.startTime))
				.limit(1);
			activeRegister = reg || null;
		}

		if (!activeRegister) {
			return {
				hasOpenRegister: false,
				currentRegister: null,
				startingBalance: 0,
				salesCash: 0,
				expensesCash: 0,
				withdrawalsCash: 0,
				withdrawalsCount: 0,
				currentCashInDrawer: 0,
				user,
			};
		}

		const startingBalance = Number(activeRegister.startingBalance || 0);

		// Estadísticas en transactions de la sesión
		const stats = await db
			.select({
				type: transactions.type,
				total: sql<string>`coalesce(sum(cast(${transactions.total} as numeric)), 0)`,
			})
			.from(transactions)
			.where(eq(transactions.registerSessionId, activeRegister.id))
			.groupBy(transactions.type);

		let salesCash = 0;
		let totalOutcome = 0;

		for (const stat of stats) {
			if (stat.type === "income") salesCash = Number(stat.total || 0);
			if (stat.type === "outcome") totalOutcome = Number(stat.total || 0);
		}

		// Retiros registrados específicamente
		let withdrawalsCash = 0;
		let withdrawalsCount = 0;
		try {
			const [wStat] = await db
				.select({
					total: sql<string>`coalesce(sum(cast(${cashWithdrawals.amount} as numeric)), 0)`,
					count: sql<string>`count(*)`,
				})
				.from(cashWithdrawals)
				.where(eq(cashWithdrawals.registerSessionId, activeRegister.id));

			withdrawalsCash = Number(wStat?.total || 0);
			withdrawalsCount = Number(wStat?.count || 0);
		} catch (e) {
			console.error("Error reading withdrawals stat:", e);
		}

		// Gastos registrados específicamente en caja
		let expensesCash = 0;
		try {
			const [eStat] = await db
				.select({
					total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
				})
				.from(expenses)
				.where(
					and(
						eq(expenses.registerSessionId, activeRegister.id),
						eq(expenses.paymentMethod, "cash_register"),
					),
				);

			expensesCash = Number(eStat?.total || 0);
		} catch (e) {
			console.error("Error reading expenses stat:", e);
		}

		const currentCashInDrawer = startingBalance + salesCash - totalOutcome;

		return {
			hasOpenRegister: true,
			currentRegister: activeRegister,
			startingBalance,
			salesCash,
			expensesCash,
			withdrawalsCash,
			withdrawalsCount,
			currentCashInDrawer,
			user,
		};
	});

export const getCashWithdrawalsFn = createServerFn({ method: "GET" })
	.validator(
		(data?: {
			registerSessionId?: number;
			period?: "today" | "yesterday" | "week" | "month" | "year" | "all";
			userId?: number;
		}) => data || {},
	)
	.handler(async ({ data }) => {
		await ensureWithdrawalsSchema();
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const conditions = [eq(cashWithdrawals.workspaceId, activeStoreId)];

		if (data.registerSessionId) {
			conditions.push(
				eq(cashWithdrawals.registerSessionId, data.registerSessionId),
			);
		}

		if (data.userId) {
			conditions.push(eq(cashWithdrawals.userId, data.userId));
		}

		if (data.period && data.period !== "all") {
			const now = new Date();
			if (data.period === "today") {
				const startOfToday = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate(),
				);
				conditions.push(gte(cashWithdrawals.createdAt, startOfToday));
			} else if (data.period === "yesterday") {
				const startOfYesterday = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() - 1,
				);
				const endOfYesterday = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate(),
				);
				conditions.push(
					and(
						gte(cashWithdrawals.createdAt, startOfYesterday),
						lt(cashWithdrawals.createdAt, endOfYesterday),
					)!,
				);
			} else if (data.period === "week") {
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - 7);
				conditions.push(gte(cashWithdrawals.createdAt, startOfWeek));
			} else if (data.period === "month") {
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				conditions.push(gte(cashWithdrawals.createdAt, startOfMonth));
			} else if (data.period === "year") {
				const startOfYear = new Date(now.getFullYear(), 0, 1);
				conditions.push(gte(cashWithdrawals.createdAt, startOfYear));
			}
		}

		const results = await db
			.select({
				id: cashWithdrawals.id,
				workspaceId: cashWithdrawals.workspaceId,
				registerSessionId: cashWithdrawals.registerSessionId,
				userId: cashWithdrawals.userId,
				userName: users.name,
				userEmail: users.email,
				amount: cashWithdrawals.amount,
				reason: cashWithdrawals.reason,
				description: cashWithdrawals.description,
				balanceBefore: cashWithdrawals.balanceBefore,
				balanceAfter: cashWithdrawals.balanceAfter,
				createdAt: cashWithdrawals.createdAt,
			})
			.from(cashWithdrawals)
			.leftJoin(users, eq(cashWithdrawals.userId, users.id))
			.where(and(...conditions))
			.orderBy(desc(cashWithdrawals.createdAt));

		return results;
	});

export const createCashWithdrawalFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof cashWithdrawalSchema>) => data)
	.handler(async ({ data }) => {
		await ensureWithdrawalsSchema();
		const { user, activeStoreId } = await getAuthenticatedUserWithActiveStore();

		let activeRegister = null;

		if (data.registerSessionId) {
			const [reg] = await db
				.select()
				.from(registerSessions)
				.where(eq(registerSessions.id, data.registerSessionId));
			activeRegister = reg || null;
		} else {
			const [reg] = await db
				.select()
				.from(registerSessions)
				.where(
					and(
						eq(registerSessions.workspaceId, activeStoreId),
						eq(registerSessions.status, "open"),
					),
				)
				.orderBy(desc(registerSessions.startTime))
				.limit(1);
			activeRegister = reg || null;
		}

		if (!activeRegister || activeRegister.status !== "open") {
			throw new Error(
				"No hay una caja abierta en esta sucursal para realizar retiros de efectivo.",
			);
		}

		const startingBalance = Number(activeRegister.startingBalance || 0);

		// Estadísticas en transactions de la sesión
		const stats = await db
			.select({
				type: transactions.type,
				total: sql<string>`coalesce(sum(cast(${transactions.total} as numeric)), 0)`,
			})
			.from(transactions)
			.where(eq(transactions.registerSessionId, activeRegister.id))
			.groupBy(transactions.type);

		let salesCash = 0;
		let totalOutcome = 0;

		for (const stat of stats) {
			if (stat.type === "income") salesCash = Number(stat.total || 0);
			if (stat.type === "outcome") totalOutcome = Number(stat.total || 0);
		}

		const currentBalance = startingBalance + salesCash - totalOutcome;

		if (data.amount <= 0) {
			throw new Error("El monto a retirar debe ser mayor a $0.00");
		}

		if (data.amount > currentBalance) {
			throw new Error(
				`El monto a retirar ($${data.amount.toFixed(2)}) supera el efectivo disponible en caja ($${currentBalance.toFixed(2)}).`,
			);
		}

		const balanceBefore = currentBalance;
		const balanceAfter = currentBalance - data.amount;

		// 1. Guardar el retiro en cash_withdrawals con todos los datos de auditoría
		const [withdrawal] = await db
			.insert(cashWithdrawals)
			.values({
				workspaceId: activeStoreId,
				registerSessionId: activeRegister.id,
				userId: user.id,
				amount: data.amount.toFixed(2),
				reason: data.reason,
				description: data.description?.trim() || null,
				balanceBefore: balanceBefore.toFixed(2),
				balanceAfter: balanceAfter.toFixed(2),
			})
			.returning();

		// 2. Registrar egreso en transactions para reflejar la salida en los cortes y arqueo
		await db.insert(transactions).values({
			registerSessionId: activeRegister.id,
			userId: user.id,
			type: "outcome",
			total: data.amount.toFixed(2),
			description: `Retiro de caja: ${data.reason}${data.description ? ` (${data.description})` : ""}`,
		});

		return {
			...withdrawal,
			userName: user.name,
			userEmail: user.email,
		};
	});
