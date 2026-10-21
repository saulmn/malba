import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { registerSessions, transactions, cashWithdrawals, expenses, users } from '@/db/schema'
import { eq, desc, and, sum, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getAuthenticatedUserWithActiveStore } from './auth'

export const getCurrentRegisterFn = createServerFn({ method: 'GET' })
  .validator((data?: { workspaceId?: number }) => data || {})
  .handler(async ({ data }) => {
    let workspaceId = data.workspaceId
    if (!workspaceId) {
      const auth = await getAuthenticatedUserWithActiveStore()
      workspaceId = auth.activeStoreId
    }

    const [session] = await db.select()
      .from(registerSessions)
      .where(
        and(
          eq(registerSessions.workspaceId, workspaceId),
          eq(registerSessions.status, 'open')
        )
      )
      .orderBy(desc(registerSessions.startTime))
      .limit(1)
    
    return session || null
  })

export const openRegisterFn = createServerFn({ method: 'POST' })
  .validator((data: { workspaceId?: number; userId?: number; startingBalance: number }) => data)
  .handler(async ({ data }) => {
    const auth = await getAuthenticatedUserWithActiveStore()
    const workspaceId = data.workspaceId || auth.activeStoreId
    const userId = data.userId || auth.user.id

    const [newSession] = await db.insert(registerSessions).values({
      workspaceId,
      userId,
      startingBalance: data.startingBalance.toString(),
      status: 'open',
    }).returning()
    
    return newSession
  })

export const getRegisterTotalsFn = createServerFn({ method: 'GET' })
  .validator((data: { registerSessionId: number }) => data)
  .handler(async ({ data }) => {
    // Calculamos ingresos y egresos
    const stats = await db.select({
      type: transactions.type,
      total: sql<string>`sum(cast(${transactions.total} as numeric))`,
    })
    .from(transactions)
    .where(eq(transactions.registerSessionId, data.registerSessionId))
    .groupBy(transactions.type)

    let income = 0
    let outcome = 0

    for (const stat of stats) {
      if (stat.type === 'income') income = Number(stat.total || 0)
      if (stat.type === 'outcome') outcome = Number(stat.total || 0)
    }

    // Desglose de retiros
    let withdrawals = 0
    let withdrawalsCount = 0
    let withdrawalsList: Array<{
      id: number
      amount: string
      reason: string
      description: string | null
      balanceBefore: string
      balanceAfter: string
      createdAt: Date
      userName: string | null
    }> = []

    try {
      const [wStat] = await db
        .select({
          total: sql<string>`coalesce(sum(cast(${cashWithdrawals.amount} as numeric)), 0)`,
          count: sql<string>`count(*)`,
        })
        .from(cashWithdrawals)
        .where(eq(cashWithdrawals.registerSessionId, data.registerSessionId))

      withdrawals = Number(wStat?.total || 0)
      withdrawalsCount = Number(wStat?.count || 0)

      withdrawalsList = await db
        .select({
          id: cashWithdrawals.id,
          amount: cashWithdrawals.amount,
          reason: cashWithdrawals.reason,
          description: cashWithdrawals.description,
          balanceBefore: cashWithdrawals.balanceBefore,
          balanceAfter: cashWithdrawals.balanceAfter,
          createdAt: cashWithdrawals.createdAt,
          userName: users.name,
        })
        .from(cashWithdrawals)
        .leftJoin(users, eq(cashWithdrawals.userId, users.id))
        .where(eq(cashWithdrawals.registerSessionId, data.registerSessionId))
        .orderBy(desc(cashWithdrawals.createdAt))
    } catch (e) {
      console.error('Error fetching register withdrawals in getRegisterTotalsFn:', e)
    }

    // Desglose de gastos en efectivo de caja
    let registerExpenses = 0
    try {
      const [eStat] = await db
        .select({
          total: sql<string>`coalesce(sum(cast(${expenses.amount} as numeric)), 0)`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.registerSessionId, data.registerSessionId),
            eq(expenses.paymentMethod, 'cash_register')
          )
        )
      registerExpenses = Number(eStat?.total || 0)
    } catch (e) {
      console.error('Error fetching register expenses in getRegisterTotalsFn:', e)
    }

    return { 
      income, 
      outcome, 
      withdrawals, 
      withdrawalsCount, 
      expenses: registerExpenses,
      withdrawalsList 
    }
  })

export const closeRegisterFn = createServerFn({ method: 'POST' })
  .validator((data: { 
    registerSessionId: number; 
    closingBalance: number; 
    expectedBalance: number;
    difference: number;
  }) => data)
  .handler(async ({ data }) => {
    await db.update(registerSessions)
      .set({
        status: 'closed',
        endTime: new Date(),
        closingBalance: data.closingBalance.toString(),
        expectedBalance: data.expectedBalance.toString(),
        difference: data.difference.toString(),
      })
      .where(eq(registerSessions.id, data.registerSessionId))
      
    return { success: true }
  })
