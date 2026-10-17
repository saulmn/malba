import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
	transactions,
	transactionItems,
	products,
	users,
	customers,
	registerSessions,
	workspaceUsers,
} from "@/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { getAuthenticatedUserWithActiveStore } from "./auth";

type CheckoutPayload = {
	items: Array<{ productId: number; quantity: number; price: number }>;
	total: number;
	workspaceId?: number;
	registerSessionId: number;
	customerId?: number | null;
};

export const createSaleFn = createServerFn({ method: "POST" })
	.validator((data: CheckoutPayload) => data)
	.handler(async ({ data }) => {
		const auth = await getAuthenticatedUserWithActiveStore();
		const workspaceId = data.workspaceId || auth.activeStoreId;

		// 1. Fetch product names to create a descriptive item summary
		const productIds = data.items.map((i) => i.productId);
		const productRows =
			productIds.length > 0
				? await db
						.select({ id: products.id, name: products.name })
						.from(products)
						.where(inArray(products.id, productIds))
				: [];
		const prodMap = new Map(productRows.map((p) => [p.id, p.name]));

		const itemsSummary =
			data.items
				.map(
					(item) =>
						`${item.quantity}x ${prodMap.get(item.productId) || "Producto"}`,
				)
				.join(", ")
				.slice(0, 3000) || "Venta POS";

		// 2. Create transaction record
		const [transaction] = await db
			.insert(transactions)
			.values({
				registerSessionId: data.registerSessionId,
				customerId: data.customerId || null,
				type: "income",
				total: data.total.toString(),
				description: itemsSummary,
			})
			.returning();

		// 3. Create transaction items & deduct inventory
		for (const item of data.items) {
			await db.insert(transactionItems).values({
				transactionId: transaction.id,
				productId: item.productId,
				quantity: item.quantity.toString(),
				price: item.price.toString(),
			});

			// Deduct inventory for active store
			await db.execute(sql`
        UPDATE inventory 
        SET quantity = quantity - ${item.quantity} 
        WHERE product_id = ${item.productId} AND workspace_id = ${workspaceId}
      `);
		}

		return transaction;
	});

export const getSalesHistoryFn = createServerFn({ method: "GET" })
	.validator(
		(data?: {
			userId?: number | "all";
			period?: "today" | "yesterday" | "week" | "month" | "year" | "all";
		}) => data,
	)
	.handler(async ({ data }) => {
		const auth = await getAuthenticatedUserWithActiveStore();
		const workspaceId = auth.activeStoreId;
		const period = data?.period || "all";
		const targetUserId = data?.userId;

		// 1. Calculate date filters
		let dateFilter = undefined;
		const now = new Date();

		if (period === "today") {
			const startOfDay = new Date(now);
			startOfDay.setHours(0, 0, 0, 0);
			dateFilter = sql`${transactions.createdAt} >= ${startOfDay.toISOString()}`;
		} else if (period === "yesterday") {
			const startOfYesterday = new Date(now);
			startOfYesterday.setDate(now.getDate() - 1);
			startOfYesterday.setHours(0, 0, 0, 0);
			const endOfYesterday = new Date(now);
			endOfYesterday.setDate(now.getDate() - 1);
			endOfYesterday.setHours(23, 59, 59, 999);
			dateFilter = and(
				sql`${transactions.createdAt} >= ${startOfYesterday.toISOString()}`,
				sql`${transactions.createdAt} <= ${endOfYesterday.toISOString()}`,
			);
		} else if (period === "week") {
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() - 7);
			startOfWeek.setHours(0, 0, 0, 0);
			dateFilter = sql`${transactions.createdAt} >= ${startOfWeek.toISOString()}`;
		} else if (period === "month") {
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			dateFilter = sql`${transactions.createdAt} >= ${startOfMonth.toISOString()}`;
		} else if (period === "year") {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			dateFilter = sql`${transactions.createdAt} >= ${startOfYear.toISOString()}`;
		}

		// 2. Base conditions for active store
		const conditions = [
			eq(transactions.type, "income"),
			eq(registerSessions.workspaceId, workspaceId),
		];

		if (dateFilter) {
			conditions.push(dateFilter);
		}

		if (targetUserId && targetUserId !== "all") {
			conditions.push(eq(registerSessions.userId, Number(targetUserId)));
		}

		// 3. Query sales across all cashiers of this active workspace
		const salesRows = await db
			.select({
				id: transactions.id,
				total: transactions.total,
				description: transactions.description,
				createdAt: transactions.createdAt,
				registerSessionId: transactions.registerSessionId,
				customerId: transactions.customerId,
				customerName: customers.name,
				userId: users.id,
				userName: users.name,
				userUsername: users.username,
			})
			.from(transactions)
			.innerJoin(
				registerSessions,
				eq(transactions.registerSessionId, registerSessions.id),
			)
			.leftJoin(users, eq(registerSessions.userId, users.id))
			.leftJoin(customers, eq(transactions.customerId, customers.id))
			.where(and(...conditions))
			.orderBy(desc(transactions.createdAt));

		// 4. Query items for these sales
		const transactionIds = salesRows.map((s) => s.id);
		const itemsRows =
			transactionIds.length > 0
				? await db
						.select({
							id: transactionItems.id,
							transactionId: transactionItems.transactionId,
							productId: transactionItems.productId,
							quantity: transactionItems.quantity,
							price: transactionItems.price,
							productName: products.name,
							unit: products.unit,
						})
						.from(transactionItems)
						.leftJoin(products, eq(transactionItems.productId, products.id))
						.where(inArray(transactionItems.transactionId, transactionIds))
				: [];

		const itemsByTx = new Map<number, typeof itemsRows>();
		for (const it of itemsRows) {
			const list = itemsByTx.get(it.transactionId) || [];
			list.push(it);
			itemsByTx.set(it.transactionId, list);
		}

		const sales = salesRows.map((s) => {
			const itms = itemsByTx.get(s.id) || [];
			const itemsSummary =
				itms.length > 0
					? itms
							.map(
								(i) =>
									`${Number(i.quantity)}x ${i.productName || "Producto"}`,
							)
							.join(", ")
					: s.description || "Venta POS";

			return {
				id: s.id,
				total: s.total,
				description: s.description,
				createdAt: s.createdAt,
				registerSessionId: s.registerSessionId,
				customerId: s.customerId,
				customerName: s.customerName,
				userId: s.userId,
				userName: s.userName || "Cajero",
				userUsername: s.userUsername,
				items: itms,
				itemsSummary,
			};
		});

		// 5. Query cashiers of this workspace for filter dropdown
		const workspaceUsersList = await db
			.select({
				id: users.id,
				name: users.name,
				username: users.username,
			})
			.from(workspaceUsers)
			.innerJoin(users, eq(workspaceUsers.userId, users.id))
			.where(eq(workspaceUsers.workspaceId, workspaceId));

		const cashiersMap = new Map<
			number,
			{ id: number; name: string; username: string | null }
		>();
		for (const u of workspaceUsersList) {
			cashiersMap.set(u.id, u);
		}
		for (const s of salesRows) {
			if (s.userId && !cashiersMap.has(s.userId)) {
				cashiersMap.set(s.userId, {
					id: s.userId,
					name: s.userName || "Usuario",
					username: s.userUsername || null,
				});
			}
		}
		const cashiers = Array.from(cashiersMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name),
		);

		return {
			sales,
			cashiers,
			activeWorkspaceName:
				auth.user.activeWorkspace?.name || "Sucursal Activa",
		};
	});

export const getMySalesFn = createServerFn({ method: "GET" })
	.validator(
		(data?: {
			userId?: number | "all";
			period?: "today" | "yesterday" | "week" | "month" | "year" | "all";
		}) => data,
	)
	.handler(async ({ data }) => {
		const result = await getSalesHistoryFn({ data });
		return result.sales;
	});
