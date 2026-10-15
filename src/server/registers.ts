import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { registerSessions, transactions } from '@/db/schema'
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

    return { income, outcome }
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
