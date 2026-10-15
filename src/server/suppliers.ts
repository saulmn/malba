import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { suppliers, products, expenses } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { supplierSchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";
import { z } from "zod";

export const getSuppliersFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const results = await db
			.select({
				id: suppliers.id,
				name: suppliers.name,
				description: suppliers.description,
				phone1: suppliers.phone1,
				phone2: suppliers.phone2,
				phone3: suppliers.phone3,
				email: suppliers.email,
				web: suppliers.web,
				address: suppliers.address,
				createdAt: suppliers.createdAt,
				productsCount: sql<number>`count(distinct ${products.id})::int`,
				totalExpenses: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
			})
			.from(suppliers)
			.where(eq(suppliers.workspaceId, activeStoreId))
			.leftJoin(products, eq(products.supplierId, suppliers.id))
			.leftJoin(expenses, eq(expenses.supplierId, suppliers.id))
			.groupBy(suppliers.id)
			.orderBy(desc(suppliers.createdAt));

		return results;
	},
);

export const createSupplierFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof supplierSchema>) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const [newSupplier] = await db
			.insert(suppliers)
			.values({
				workspaceId: activeStoreId,
				name: data.name,
				description: data.description || null,
				phone1: data.phone1 || null,
				phone2: data.phone2 || null,
				phone3: data.phone3 || null,
				email: data.email || null,
				web: data.web || null,
				address: data.address || null,
			})
			.returning();

		return newSupplier;
	});

export const updateSupplierFn = createServerFn({ method: "POST" })
	.validator(
		(
			data: z.infer<typeof supplierSchema> & {
				id: number;
			},
		) => data,
	)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const [updated] = await db
			.update(suppliers)
			.set({
				name: data.name,
				description: data.description || null,
				phone1: data.phone1 || null,
				phone2: data.phone2 || null,
				phone3: data.phone3 || null,
				email: data.email || null,
				web: data.web || null,
				address: data.address || null,
			})
			.where(
				and(
					eq(suppliers.id, data.id),
					eq(suppliers.workspaceId, activeStoreId),
				),
			)
			.returning();

		return updated;
	});

export const deleteSupplierFn = createServerFn({ method: "POST" })
	.validator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		await db
			.delete(suppliers)
			.where(
				and(
					eq(suppliers.id, data.id),
					eq(suppliers.workspaceId, activeStoreId),
				),
			);

		return { success: true };
	});
