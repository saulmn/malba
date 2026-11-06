import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { categorySchema } from "@/utils/validations";
import { getAuthenticatedUserWithActiveStore } from "./auth";
import { z } from "zod";

export interface CategoryItem {
	id: number;
	name: string;
	productCount: number;
	createdAt?: Date;
}

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<CategoryItem[]> => {
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

		// 3. Sincronizar automáticamente categorías de productos que no estén en la tabla categories
		const savedSet = new Set(
			savedCategories.map((c) => c.name.trim().toLowerCase()),
		);

		for (const p of existingProductCategories) {
			if (p.category) {
				const cleanName = p.category.trim();
				const lower = cleanName.toLowerCase();
				if (!savedSet.has(lower) && cleanName.length > 0) {
					savedSet.add(lower);
					const [newCat] = await db
						.insert(categories)
						.values({
							workspaceId: activeStoreId,
							name: cleanName,
						})
						.returning();
					savedCategories.push(newCat);
				}
			}
		}

		// 4. Conteo de productos asociados por categoría
		const counts = await db
			.select({
				category: products.category,
				count: sql<number>`count(${products.id})::int`,
			})
			.from(products)
			.where(
				and(
					eq(products.workspaceId, activeStoreId),
					isNotNull(products.category),
				),
			)
			.groupBy(products.category);

		const countMap = new Map<string, number>();
		for (const item of counts) {
			if (item.category) {
				countMap.set(item.category.trim().toLowerCase(), item.count || 0);
			}
		}

		// 5. Mapear y ordenar alfabéticamente
		const result: CategoryItem[] = savedCategories.map((c) => ({
			id: c.id,
			name: c.name.trim(),
			productCount: countMap.get(c.name.trim().toLowerCase()) || 0,
			createdAt: c.createdAt,
		}));

		return result.sort((a, b) => a.name.localeCompare(b.name));
	},
);

export const createCategoryFn = createServerFn({ method: "POST" })
	.validator((data: z.infer<typeof categorySchema>) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const cleanName = data.name.trim();
		if (!cleanName) {
			throw new Error("El nombre de la categoría es requerido");
		}

		// Check if already exists (case-insensitive)
		const existingCategories = await db
			.select()
			.from(categories)
			.where(eq(categories.workspaceId, activeStoreId));

		const existing = existingCategories.find(
			(c) => c.name.trim().toLowerCase() === cleanName.toLowerCase(),
		);

		if (existing) {
			return { ...existing, productCount: 0 };
		}

		const [newCategory] = await db
			.insert(categories)
			.values({
				workspaceId: activeStoreId,
				name: cleanName,
			})
			.returning();

		return { ...newCategory, productCount: 0 };
	});

export const updateCategoryFn = createServerFn({ method: "POST" })
	.validator(
		(data: { id: number; name: string }) => data,
	)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const cleanName = data.name.trim();
		if (!cleanName || cleanName.length < 2) {
			throw new Error("El nombre de la categoría debe tener al menos 2 caracteres");
		}

		// Verificar que exista
		const existing = await db.query.categories.findFirst({
			where: and(
				eq(categories.id, data.id),
				eq(categories.workspaceId, activeStoreId),
			),
		});

		if (!existing) {
			throw new Error("Categoría no encontrada");
		}

		// Verificar que no haya otra con el mismo nombre
		const allWorkspaceCats = await db
			.select()
			.from(categories)
			.where(eq(categories.workspaceId, activeStoreId));

		const duplicate = allWorkspaceCats.find(
			(c) =>
				c.id !== data.id &&
				c.name.trim().toLowerCase() === cleanName.toLowerCase(),
		);

		if (duplicate) {
			throw new Error("Ya existe otra categoría con ese nombre");
		}

		const oldName = existing.name.trim();

		// Actualizar la categoría
		const [updated] = await db
			.update(categories)
			.set({ name: cleanName })
			.where(
				and(
					eq(categories.id, data.id),
					eq(categories.workspaceId, activeStoreId),
				),
			)
			.returning();

		// Actualizar productos asociados al nombre viejo
		await db
			.update(products)
			.set({ category: cleanName })
			.where(
				and(
					eq(products.workspaceId, activeStoreId),
					eq(products.category, oldName),
				),
			);

		return updated;
	});

export const deleteCategoryFn = createServerFn({ method: "POST" })
	.validator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const { activeStoreId } = await getAuthenticatedUserWithActiveStore();

		const existing = await db.query.categories.findFirst({
			where: and(
				eq(categories.id, data.id),
				eq(categories.workspaceId, activeStoreId),
			),
		});

		if (!existing) {
			throw new Error("Categoría no encontrada");
		}

		const catName = existing.name.trim();

		// Eliminar de categories
		await db
			.delete(categories)
			.where(
				and(
					eq(categories.id, data.id),
					eq(categories.workspaceId, activeStoreId),
				),
			);

		// Desvincular productos asociados (quedan sin categoría)
		await db
			.update(products)
			.set({ category: null })
			.where(
				and(
					eq(products.workspaceId, activeStoreId),
					eq(products.category, catName),
				),
			);

		return { success: true };
	});
