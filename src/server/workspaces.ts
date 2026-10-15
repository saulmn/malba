import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { workspaces, workspaceUsers, users } from '@/db/schema'
import { workspaceSchema } from '@/utils/validations'
import { getSessionFn } from './auth'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export const getWorkspacesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const results = await db.select().from(workspaces)
    return results
  })

export const getUserWorkspacesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getSessionFn()
    if (!user) {
      return []
    }

    if (user.role === 'master') {
      const all = await db.select().from(workspaces).orderBy(workspaces.name)
      return all
    }

    const userStores = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        location: workspaces.location,
        createdAt: workspaces.createdAt,
      })
      .from(workspaces)
      .innerJoin(workspaceUsers, and(
        eq(workspaceUsers.workspaceId, workspaces.id),
        eq(workspaceUsers.userId, user.id)
      ))
      .orderBy(workspaces.name)

    return userStores
  })

export const switchActiveStoreFn = createServerFn({ method: 'POST' })
  .validator((data: { workspaceId: number }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionFn()
    if (!user) {
      throw new Error("No autenticado")
    }

    // Check authorization: master can switch to any store, others only to their assigned stores
    if (user.role !== 'master') {
      const allowed = await db.query.workspaceUsers.findFirst({
        where: and(
          eq(workspaceUsers.userId, user.id),
          eq(workspaceUsers.workspaceId, data.workspaceId)
        )
      })

      if (!allowed) {
        throw new Error("No tienes permiso para acceder a esta sucursal")
      }
    }

    // Verify workspace exists
    const targetWs = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, data.workspaceId)
    })

    if (!targetWs) {
      throw new Error("La sucursal no existe")
    }

    // Update active store in users table
    await db
      .update(users)
      .set({ activeStore: data.workspaceId })
      .where(eq(users.id, user.id))

    return {
      success: true,
      workspace: targetWs
    }
  })

export const createWorkspaceFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof workspaceSchema>) => data)
  .handler(async ({ data }) => {
    const [newWorkspace] = await db.insert(workspaces).values({
      name: data.name,
      location: data.location || null,
    }).returning()
    
    return newWorkspace
  })
