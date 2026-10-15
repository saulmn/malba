import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { transactions, inventory, registerSessions } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { getAuthenticatedUserWithActiveStore } from './auth'

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { activeStoreId } = await getAuthenticatedUserWithActiveStore()

    // Total income and outcome for active store
    const statsResult = await db.select({
      type: transactions.type,
      total: sql<string>`sum(cast(${transactions.total} as numeric))`,
    })
    .from(transactions)
    .innerJoin(registerSessions, eq(transactions.registerSessionId, registerSessions.id))
    .where(eq(registerSessions.workspaceId, activeStoreId))
    .groupBy(transactions.type)

    let income = 0
    let outcome = 0

    for (const stat of statsResult) {
      if (stat.type === 'income') income = Number(stat.total || 0)
      if (stat.type === 'outcome') outcome = Number(stat.total || 0)
    }

    // Recent transactions for active store (last 5)
    const recentTransactions = await db.select({
      id: transactions.id,
      registerSessionId: transactions.registerSessionId,
      type: transactions.type,
      total: transactions.total,
      description: transactions.description,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(registerSessions, eq(transactions.registerSessionId, registerSessions.id))
    .where(eq(registerSessions.workspaceId, activeStoreId))
    .orderBy(desc(transactions.createdAt))
    .limit(5)

    // Total products in stock for active store
    const stockResult = await db.select({
      total: sql<string>`count(*)`,
      lowStock: sql<string>`count(case when cast(${inventory.quantity} as numeric) <= 5 then 1 end)`
    })
    .from(inventory)
    .where(eq(inventory.workspaceId, activeStoreId))
    
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
