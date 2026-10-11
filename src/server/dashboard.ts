import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { transactions, inventory } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // We would usually filter by workspace and date range.
    // For now, we pull global stats.
    
    // Total income and outcome
    const statsResult = await db.select({
      type: transactions.type,
      total: sql<string>`sum(cast(${transactions.total} as numeric))`,
    }).from(transactions).groupBy(transactions.type)

    let income = 0
    let outcome = 0

    for (const stat of statsResult) {
      if (stat.type === 'income') income = Number(stat.total || 0)
      if (stat.type === 'outcome') outcome = Number(stat.total || 0)
    }

    // Recent transactions (last 5)
    const recentTransactions = await db.select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(5)

    // Total products in stock
    const stockResult = await db.select({
      total: sql<string>`count(*)`,
      lowStock: sql<string>`count(case when cast(${inventory.quantity} as numeric) <= 5 then 1 end)`
    }).from(inventory)
    
    const totalProducts = Number(stockResult[0]?.total || 0)
    const lowStockProducts = Number(stockResult[0]?.lowStock || 0)

    return {
      income,
      outcome,
      recentTransactions,
      totalProducts,
      lowStockProducts
    }
  })
