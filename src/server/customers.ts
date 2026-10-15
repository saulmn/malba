import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { customers, transactions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { customerSchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";
import { z } from "zod";

export const getCustomersFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const results = await db
			.select({
				id: customers.id,
				name: customers.name,
				notes: customers.notes,
				phone1: customers.phone1,
				phone2: customers.phone2,
				email: customers.email,
				web: customers.web,
				address: customers.address,
				createdAt: customers.createdAt,
				purchasesCount: sql<number>`count(${transactions.id})::int`,
				totalSpent: sql<string>`coalesce(sum(cast(${transactions.total} as numeric)), 0)`,
			})
			.from(customers)
			.where(eq(customers.workspaceId, activeStoreId))
			.leftJoin(transactions, eq(transactions.customerId, customers.id))
			.groupBy(customers.id)
			.orderBy(desc(customers.createdAt));

		return results;
	},
);

export const createCustomerFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof customerSchema>) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const [newCustomer] = await db
			.insert(customers)
			.values({
				workspaceId: activeStoreId,
				name: data.name,
				notes: data.notes || null,
				phone1: data.phone1 || null,
				phone2: data.phone2 || null,
				email: data.email || null,
				web: data.web || null,
				address: data.address || null,
			})
			.returning();

		return newCustomer;
	});

export const updateCustomerFn = createServerFn({ method: "POST" })
	.validator(
		(
			data: z.infer<typeof customerSchema> & {
				id: number;
			},
		) => data,
	)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const [updated] = await db
			.update(customers)
			.set({
				name: data.name,
				notes: data.notes || null,
				phone1: data.phone1 || null,
				phone2: data.phone2 || null,
				email: data.email || null,
				web: data.web || null,
				address: data.address || null,
			})
			.where(
				and(
					eq(customers.id, data.id),
					eq(customers.workspaceId, activeStoreId),
				),
			)
			.returning();

		return updated;
	});

export const deleteCustomerFn = createServerFn({ method: "POST" })
	.validator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		await db
			.delete(customers)
			.where(
				and(
					eq(customers.id, data.id),
					eq(customers.workspaceId, activeStoreId),
				),
			);

		return { success: true };
	});
