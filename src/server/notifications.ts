import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { products, inventory } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { getAuthenticatedUserWithActiveStore } from './auth'

export const getLowStockNotificationsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const { activeStoreId } = await getAuthenticatedUserWithActiveStore()
      const results = await db
        .select({
          id: products.id,
          name: products.name,
          quantity: inventory.quantity,
          minStock: products.minStock,
        })
        .from(products)
        .innerJoin(inventory, and(
          eq(products.id, inventory.productId),
          eq(inventory.workspaceId, activeStoreId)
        ))
        .where(
          and(
            eq(products.workspaceId, activeStoreId),
            sql`CAST(${inventory.quantity} AS DECIMAL) <= CAST(COALESCE(${products.minStock}, '5') AS DECIMAL)`
          )
        )
        .limit(10)

      return results
    } catch {
      return []
    }
  })
