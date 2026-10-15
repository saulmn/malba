import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { expenses, suppliers, users, registerSessions, transactions } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { expenseSchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";
import { z } from "zod";

export const getExpensesFn = createServerFn({ method: "GET" })
	.validator((data?: { period?: "week" | "month" | "year" | "all" }) => data || {})
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const conditions = [eq(expenses.workspaceId, activeStoreId)];

		if (data.period && data.period !== "all") {
			const now = new Date();
			if (data.period === "week") {
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - 7);
				conditions.push(gte(expenses.date, startOfWeek));
			} else if (data.period === "month") {
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				conditions.push(gte(expenses.date, startOfMonth));
			} else if (data.period === "year") {
				const startOfYear = new Date(now.getFullYear(), 0, 1);
				conditions.push(gte(expenses.date, startOfYear));
			}
		}

		const results = await db
			.select({
				id: expenses.id,
				title: expenses.title,
				description: expenses.description,
				amount: expenses.amount,
				paymentMethod: expenses.paymentMethod,
				date: expenses.date,
				createdAt: expenses.createdAt,
				supplierId: expenses.supplierId,
				supplierName: suppliers.name,
				userId: expenses.userId,
				userName: users.name,
				registerSessionId: expenses.registerSessionId,
			})
			.from(expenses)
			.where(and(...conditions))
			.leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
			.leftJoin(users, eq(expenses.userId, users.id))
			.orderBy(desc(expenses.date));

		return results;
	});

export const createExpenseFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof expenseSchema>) => data)
	.handler(async ({ data }) => {
		const { user, activeStoreId } = await getAuthenticatedUserWithActiveStore();

		let registerSessionId: number | null = null;

		// Si el pago es en efectivo de caja, vinculamos al turno activo y descontamos de caja
		if (data.paymentMethod === "cash_register") {
			const [activeRegister] = await db
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

			if (!activeRegister) {
				throw new Error(
					"No hay una caja abierta en esta sucursal para registrar salida de efectivo. Abre caja primero o selecciona otro método de pago (transferencia o tarjeta).",
				);
			}

			registerSessionId = activeRegister.id;

			// Registramos salida en transacciones de caja para que el balance y corte cuadren
			await db.insert(transactions).values({
				registerSessionId: activeRegister.id,
				type: "outcome",
				total: data.amount.toString(),
				description: `Gasto: ${data.title}${data.description ? ` (${data.description})` : ""}`,
			});
		}

		const expenseDate = data.date ? new Date(data.date) : new Date();

		const [newExpense] = await db
			.insert(expenses)
			.values({
				workspaceId: activeStoreId,
				supplierId: data.supplierId || null,
				registerSessionId,
				userId: user.id,
				title: data.title,
				description: data.description || null,
				amount: data.amount.toString(),
				paymentMethod: data.paymentMethod,
				date: expenseDate,
			})
			.returning();

		return newExpense;
	});

export const deleteExpenseFn = createServerFn({ method: "POST" })
	.validator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		await db
			.delete(expenses)
			.where(
				and(
					eq(expenses.id, data.id),
					eq(expenses.workspaceId, activeStoreId),
				),
			);

		return { success: true };
	});
