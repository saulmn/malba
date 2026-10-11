import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { products, inventory } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const getLowStockNotificationsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Ideally filter by workspaceId
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        quantity: inventory.quantity,
        minStock: products.minStock,
      })
      .from(products)
      .innerJoin(inventory, eq(products.id, inventory.productId))
      .where(sql`CAST(${inventory.quantity} AS DECIMAL) <= CAST(COALESCE(${products.minStock}, '5') AS DECIMAL)`)
      .limit(10)

    return results
  })
