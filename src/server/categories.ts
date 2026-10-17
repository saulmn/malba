import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { categorySchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";
import { z } from "zod";

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		// 1. Categorías guardadas en tabla categories
		const savedCategories = await db
			.select()
			.from(categories)
			.where(eq(categories.workspaceId, activeStoreId))
			.orderBy(desc(categories.createdAt));

		// 2. Extraer categorías únicas de productos existentes
		const existingProductCategories = await db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(
				and(
					eq(products.workspaceId, activeStoreId),
					isNotNull(products.category),
				),
			);

		// Combinar y deduplicar por nombre (case-insensitive)
		const categorySet = new Set<string>();
		const result: Array<{ id: number | string; name: string }> = [];

		for (const c of savedCategories) {
			const cleanName = c.name.trim();
			const lower = cleanName.toLowerCase();
			if (!categorySet.has(lower)) {
				categorySet.add(lower);
				result.push({ id: c.id, name: cleanName });
			}
		}

		for (const p of existingProductCategories) {
			if (p.category) {
				const cleanName = p.category.trim();
				const lower = cleanName.toLowerCase();
				if (!categorySet.has(lower) && cleanName.length > 0) {
					categorySet.add(lower);
					result.push({ id: `prod-${cleanName}`, name: cleanName });
				}
			}
		}

		return result.sort((a, b) => a.name.localeCompare(b.name));
	},
);

export const createCategoryFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof categorySchema>) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const cleanName = data.name.trim();

		// Check if already exists
		const existing = await db.query.categories.findFirst({
			where: and(
				eq(categories.workspaceId, activeStoreId),
				eq(categories.name, cleanName),
			),
		});

		if (existing) {
			return existing;
		}

		const [newCategory] = await db
			.insert(categories)
			.values({
				workspaceId: activeStoreId,
				name: cleanName,
			})
			.returning();

		return newCategory;
	});
