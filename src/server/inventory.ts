import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { products, inventory } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const getInventoryFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Left join products with inventory to get the full list
    // In a real app we would filter by workspaceId from session
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
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
    
    return results.map(row => ({
      ...row,
      quantity: row.quantity || '0'
    }))
  })

import { productSchema } from '@/utils/validations'

export const createProductFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof productSchema> & { workspaceId: number }) => data)
  .handler(async ({ data }) => {
    // 1. Insert product
    const [newProduct] = await db.insert(products).values({
      name: data.name,
      category: data.category,
      price: data.price.toString(),
      cost: data.cost.toString(),
      unit: data.unit,
      imageUrl: data.imageUrl || null, // Handle real file upload in a separate step or bucket
      workspaceId: data.workspaceId,
      margin: data.margin?.toString() || null,
      minStock: data.minStock?.toString() || '5',
      notes: data.notes || null,
    }).returning()
    
    // 2. Initialize inventory for product
    await db.insert(inventory).values({
      workspaceId: data.workspaceId,
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
      ...(data.imageUrl && { imageUrl: data.imageUrl })
    }).where(eq(products.id, data.id)).returning()
    return updated
  })

