import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
	transactions,
	inventory,
	registerSessions,
	expenses,
	suppliers,
	customers,
} from "@/db/schema";
import { desc, eq, sql, and, gte, lt } from "drizzle-orm";
import { getAuthenticatedUserWithActiveStore } from "./auth";

export const getDashboardStatsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		// 1. Total income and cash register outcomes for active store
		const statsResult = await db
			.select({
				type: transactions.type,
				total: sql<string>`sum(cast(${transactions.total} as numeric))`,
			})
			.from(transactions)
			.innerJoin(
				registerSessions,
				eq(transactions.registerSessionId, registerSessions.id),
			)
			.where(eq(registerSessions.workspaceId, activeStoreId))
			.groupBy(transactions.type);

		let income = 0;
		let registerOutcome = 0;

		for (const stat of statsResult) {
			if (stat.type === "income") income = Number(stat.total || 0);
			if (stat.type === "outcome") registerOutcome = Number(stat.total || 0);
		}

		// 2. Total expenses from expenses table
		const totalExpensesResult = await db
			.select({
				total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
			})
			.from(expenses)
			.where(eq(expenses.workspaceId, activeStoreId));

		const totalExpenses = Number(totalExpensesResult[0]?.total || 0);
		const netIncome = income - totalExpenses;

		// 3. Expenses by period (week, month, last month)
		const now = new Date();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - 7);

		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

		const [weekExp] = await db
			.select({
				total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
			})
			.from(expenses)
			.where(
				and(
					eq(expenses.workspaceId, activeStoreId),
					gte(expenses.date, startOfWeek),
				),
			);

		const [monthExp] = await db
			.select({
				total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
			})
			.from(expenses)
			.where(
				and(
					eq(expenses.workspaceId, activeStoreId),
					gte(expenses.date, startOfMonth),
				),
			);

		const [lastMonthExp] = await db
			.select({
				total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
			})
			.from(expenses)
			.where(
				and(
					eq(expenses.workspaceId, activeStoreId),
					gte(expenses.date, startOfLastMonth),
					lt(expenses.date, startOfMonth),
				),
			);

		// 4. Top Suppliers (suppliers a los que más compramos)
		const topSuppliers = await db
			.select({
				id: suppliers.id,
				name: suppliers.name,
				total: sql<string>`sum(cast(${expenses.amount} as numeric))`,
				count: sql<number>`count(${expenses.id})::int`,
			})
			.from(expenses)
			.innerJoin(suppliers, eq(expenses.supplierId, suppliers.id))
			.where(eq(expenses.workspaceId, activeStoreId))
			.groupBy(suppliers.id)
			.orderBy(desc(sql`sum(cast(${expenses.amount} as numeric))`))
			.limit(5);

		// 5. Top Customers (clientes con más compras)
		const topCustomers = await db
			.select({
				id: customers.id,
				name: customers.name,
				total: sql<string>`sum(cast(${transactions.total} as numeric))`,
				count: sql<number>`count(${transactions.id})::int`,
			})
			.from(transactions)
			.innerJoin(customers, eq(transactions.customerId, customers.id))
			.innerJoin(
				registerSessions,
				eq(transactions.registerSessionId, registerSessions.id),
			)
			.where(
				and(
					eq(registerSessions.workspaceId, activeStoreId),
					eq(transactions.type, "income"),
				),
			)
			.groupBy(customers.id)
			.orderBy(desc(sql`sum(cast(${transactions.total} as numeric))`))
			.limit(5);

		// 6. Recent transactions (last 5)
		const recentTransactions = await db
			.select({
				id: transactions.id,
				registerSessionId: transactions.registerSessionId,
				type: transactions.type,
				total: transactions.total,
				description: transactions.description,
				createdAt: transactions.createdAt,
				customerName: customers.name,
			})
			.from(transactions)
			.innerJoin(
				registerSessions,
				eq(transactions.registerSessionId, registerSessions.id),
			)
			.leftJoin(customers, eq(transactions.customerId, customers.id))
			.where(eq(registerSessions.workspaceId, activeStoreId))
			.orderBy(desc(transactions.createdAt))
			.limit(5);

		// 7. Recent expenses (last 5)
		const recentExpenses = await db
			.select({
				id: expenses.id,
				title: expenses.title,
				amount: expenses.amount,
				paymentMethod: expenses.paymentMethod,
				date: expenses.date,
				supplierName: suppliers.name,
			})
			.from(expenses)
			.leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
			.where(eq(expenses.workspaceId, activeStoreId))
			.orderBy(desc(expenses.date))
			.limit(5);

		// 8. Stock metrics
		const stockResult = await db
			.select({
				total: sql<string>`count(*)`,
				lowStock: sql<string>`count(case when cast(${inventory.quantity} as numeric) <= 5 then 1 end)`,
			})
			.from(inventory)
			.where(eq(inventory.workspaceId, activeStoreId));

		return {
			income,
			registerOutcome,
			totalExpenses,
			netIncome,
			expensesByPeriod: {
				week: Number(weekExp?.total || 0),
				month: Number(monthExp?.total || 0),
				lastMonth: Number(lastMonthExp?.total || 0),
				allTime: totalExpenses,
			},
			topSuppliers: topSuppliers.map((s) => ({
				...s,
				total: Number(s.total || 0),
			})),
			topCustomers: topCustomers.map((c) => ({
				...c,
				total: Number(c.total || 0),
			})),
			recentTransactions,
			recentExpenses,
			totalProducts: Number(stockResult[0]?.total || 0),
			lowStockProducts: Number(stockResult[0]?.lowStock || 0),
		};
	},
);
