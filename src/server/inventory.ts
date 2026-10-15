import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { products, inventory, suppliers } from '@/db/schema'
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

    // 1. Insert product
    const [newProduct] = await db.insert(products).values({
      name: data.name,
      category: data.category,
      price: data.price.toString(),
      cost: data.cost.toString(),
      unit: data.unit,
      imageUrl: data.imageUrl || null,
      workspaceId: targetWorkspaceId,
      supplierId: data.supplierId || null,
      margin: data.margin?.toString() || null,
      minStock: data.minStock?.toString() || '5',
      notes: data.notes || null,
    }).returning()
    
    // 2. Initialize inventory for product
    await db.insert(inventory).values({
      workspaceId: targetWorkspaceId,
      productId: newProduct.id,
      quantity: '0'
    })
    
    return newProduct
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof productSchema> & { id: number }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db.update(products).set({
      name: data.name,
      category: data.category,
      price: data.price.toString(),
      cost: data.cost.toString(),
      margin: data.margin?.toString() || null,
      minStock: data.minStock?.toString() || '5',
      notes: data.notes || null,
      unit: data.unit,
      supplierId: data.supplierId !== undefined ? data.supplierId : undefined,
      ...(data.imageUrl && { imageUrl: data.imageUrl })
    }).where(eq(products.id, data.id)).returning()
    return updated
  })

