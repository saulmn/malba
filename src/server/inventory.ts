import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { products, inventory, suppliers, categories } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getAuthenticatedUserWithActiveStore } from './auth'
import { productSchema } from '@/utils/validations'

export const getInventoryFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { activeStoreId } = await getAuthenticatedUserWithActiveStore()
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        imageUrl: products.imageUrl,
        price: products.price,
        cost: products.cost,
        unit: products.unit,
        margin: products.margin,
        minStock: products.minStock,
        notes: products.notes,
        quantity: inventory.quantity,
        supplierId: products.supplierId,
        supplierName: suppliers.name,
      })
      .from(products)
      .where(eq(products.workspaceId, activeStoreId))
      .leftJoin(inventory, and(
        eq(products.id, inventory.productId),
        eq(inventory.workspaceId, activeStoreId)
      ))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    
    return results.map(row => ({
      ...row,
      quantity: row.quantity || '0'
    }))
  })

export const createProductFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof productSchema> & { workspaceId?: number }) => data)
  .handler(async ({ data }) => {
    const { activeStoreId } = await getAuthenticatedUserWithActiveStore()
    const targetWorkspaceId = data.workspaceId || activeStoreId

    // Reusable category registration
    if (data.category && data.category.trim().length > 0) {
      const cleanCat = data.category.trim()
      const existingCat = await db.query.categories.findFirst({
        where: and(
          eq(categories.workspaceId, targetWorkspaceId),
          eq(categories.name, cleanCat)
        )
      })
      if (!existingCat) {
        await db.insert(categories).values({
          workspaceId: targetWorkspaceId,
          name: cleanCat,
        })
      }
    }

    // 1. Insert product
    const [newProduct] = await db.insert(products).values({
      name: data.name,
      category: data.category?.trim() || null,
      price: data.price.toString(),
      cost: data.cost.toString(),
      unit: data.unit,
      imageUrl: data.imageUrl || null,
      workspaceId: targetWorkspaceId,
      supplierId: data.supplierId || null,
      margin: data.margin?.toString() || null,
      minStock: data.minStock?.toString() || '1',
      notes: data.notes || null,
    }).returning()
    
    // 2. Initialize inventory for product with provided quantity
    const initialQty = data.quantity !== undefined ? data.quantity : 0
    await db.insert(inventory).values({
      workspaceId: targetWorkspaceId,
      productId: newProduct.id,
      quantity: initialQty.toString(),
    })
    
    return newProduct
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof productSchema> & { id: number }) => data)
  .handler(async ({ data }) => {
    const { activeStoreId } = await getAuthenticatedUserWithActiveStore()

    // Reusable category registration
    if (data.category && data.category.trim().length > 0) {
      const cleanCat = data.category.trim()
      const existingCat = await db.query.categories.findFirst({
        where: and(
          eq(categories.workspaceId, activeStoreId),
          eq(categories.name, cleanCat)
        )
      })
      if (!existingCat) {
        await db.insert(categories).values({
          workspaceId: activeStoreId,
          name: cleanCat,
        })
      }
    }

    const [updated] = await db.update(products).set({
      name: data.name,
      category: data.category?.trim() || null,
      price: data.price.toString(),
      cost: data.cost.toString(),
      margin: data.margin?.toString() || null,
      minStock: data.minStock?.toString() || '1',
      notes: data.notes || null,
      unit: data.unit,
      supplierId: data.supplierId !== undefined ? data.supplierId : undefined,
      ...(data.imageUrl && { imageUrl: data.imageUrl })
    }).where(eq(products.id, data.id)).returning()

    // Update quantity in inventory if provided
    if (data.quantity !== undefined) {
      const existingInv = await db.query.inventory.findFirst({
        where: and(
          eq(inventory.productId, data.id),
          eq(inventory.workspaceId, activeStoreId)
        )
      })
      if (existingInv) {
        await db.update(inventory)
          .set({ quantity: data.quantity.toString() })
          .where(eq(inventory.id, existingInv.id))
      } else {
        await db.insert(inventory).values({
          workspaceId: activeStoreId,
          productId: data.id,
          quantity: data.quantity.toString()
        })
      }
    }

    return updated
  })

