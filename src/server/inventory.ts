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

export const importProductsBatchFn = createServerFn({ method: 'POST' })
  .validator((data: {
    products: Array<{
      name: string;
      category?: string | null;
      supplierName?: string | null;
      cost: number;
      price: number;
      margin?: number | null;
      quantity: number;
      unit?: 'piece' | 'liter' | 'kilo' | 'package';
      minStock?: number | null;
      notes?: string | null;
    }>;
    duplicateAction?: 'update' | 'skip' | 'create_always';
  }) => data)
  .handler(async ({ data }) => {
    const { activeStoreId } = await getAuthenticatedUserWithActiveStore()
    const { products: items, duplicateAction = 'update' } = data

    // 1. Process distinct suppliers
    const distinctSupplierNames = Array.from(
      new Set(
        items
          .map(i => i.supplierName?.trim())
          .filter((name): name is string => !!name && name.length > 0)
      )
    )

    const existingSuppliers = await db.query.suppliers.findMany({
      where: eq(suppliers.workspaceId, activeStoreId)
    })

    const supplierMap = new Map<string, number>()
    for (const s of existingSuppliers) {
      supplierMap.set(s.name.trim().toLowerCase(), s.id)
    }

    let suppliersCreated = 0
    for (const sName of distinctSupplierNames) {
      const lower = sName.toLowerCase()
      if (!supplierMap.has(lower)) {
        const [newSupplier] = await db.insert(suppliers).values({
          workspaceId: activeStoreId,
          name: sName,
        }).returning()
        supplierMap.set(lower, newSupplier.id)
        suppliersCreated++
      }
    }

    // 2. Process distinct categories
    const distinctCategoryNames = Array.from(
      new Set(
        items
          .map(i => i.category?.trim())
          .filter((name): name is string => !!name && name.length > 0)
      )
    )

    const existingCategories = await db.query.categories.findMany({
      where: eq(categories.workspaceId, activeStoreId)
    })
    const categorySet = new Set(existingCategories.map(c => c.name.trim().toLowerCase()))

    let categoriesCreated = 0
    for (const cName of distinctCategoryNames) {
      const lower = cName.toLowerCase()
      if (!categorySet.has(lower)) {
        await db.insert(categories).values({
          workspaceId: activeStoreId,
          name: cName,
        })
        categorySet.add(lower)
        categoriesCreated++
      }
    }

    // 3. Process products and inventory
    const existingProducts = await db.query.products.findMany({
      where: eq(products.workspaceId, activeStoreId)
    })
    const productMapByName = new Map<string, typeof existingProducts[0]>()
    for (const p of existingProducts) {
      productMapByName.set(p.name.trim().toLowerCase(), p)
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (const item of items) {
      const cleanName = item.name.trim()
      const lowerName = cleanName.toLowerCase()
      const supplierId = item.supplierName?.trim()
        ? supplierMap.get(item.supplierName.trim().toLowerCase()) || null
        : null

      const existingProd = productMapByName.get(lowerName)

      if (existingProd && duplicateAction === 'skip') {
        skippedCount++
        continue
      }

      if (existingProd && duplicateAction === 'update') {
        // Update product record
        await db.update(products).set({
          category: item.category?.trim() || existingProd.category,
          price: item.price.toString(),
          cost: item.cost.toString(),
          margin: item.margin !== undefined && item.margin !== null ? item.margin.toString() : existingProd.margin,
          unit: item.unit || existingProd.unit,
          supplierId: supplierId || existingProd.supplierId,
          minStock: item.minStock?.toString() || existingProd.minStock || '1',
          notes: item.notes || existingProd.notes,
        }).where(eq(products.id, existingProd.id))

        // Update inventory record
        const existingInv = await db.query.inventory.findFirst({
          where: and(
            eq(inventory.productId, existingProd.id),
            eq(inventory.workspaceId, activeStoreId)
          )
        })

        if (existingInv) {
          await db.update(inventory)
            .set({ quantity: (item.quantity !== undefined ? item.quantity : 0).toString() })
            .where(eq(inventory.id, existingInv.id))
        } else {
          await db.insert(inventory).values({
            workspaceId: activeStoreId,
            productId: existingProd.id,
            quantity: (item.quantity !== undefined ? item.quantity : 0).toString()
          })
        }

        updatedCount++
      } else {
        // Create new product
        const [newProd] = await db.insert(products).values({
          workspaceId: activeStoreId,
          name: cleanName,
          category: item.category?.trim() || null,
          price: item.price.toString(),
          cost: item.cost.toString(),
          margin: item.margin !== undefined && item.margin !== null ? item.margin.toString() : null,
          unit: item.unit || 'piece',
          supplierId: supplierId,
          minStock: item.minStock?.toString() || '1',
          notes: item.notes || null,
        }).returning()

        await db.insert(inventory).values({
          workspaceId: activeStoreId,
          productId: newProd.id,
          quantity: (item.quantity !== undefined ? item.quantity : 0).toString(),
        })

        productMapByName.set(lowerName, newProd)
        createdCount++
      }
    }

    return {
      success: true,
      total: items.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      categoriesCreated,
      suppliersCreated,
    }
  })


