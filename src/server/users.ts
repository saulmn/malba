import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users } from '@/db/schema'
import { userSchema } from '@/utils/validations'

export const getUsersFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const results = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users)
    return results
  })

export const createUserFn = createServerFn({ method: 'POST' })
  .validator((data: import('zod').infer<typeof userSchema> & { workspaceIds?: number[] }) => data)
  .handler(async ({ data }) => {
    // Note: In production, hash the password using bcrypt or argon2
    const passwordHash = `hashed_${data.password}`
    
    const [newUser] = await db.insert(users).values({
      name: data.name,
      username: data.username || null,
      email: data.email,
      passwordHash: passwordHash,
      role: data.role,
    }).returning()
    
    // Assign workspaces if any
    if (data.workspaceIds && data.workspaceIds.length > 0) {
      const { workspaceUsers } = await import('@/db/schema')
      const workspaceUsersData = data.workspaceIds.map(wId => ({
        userId: newUser.id,
        workspaceId: wId,
      }))
      await db.insert(workspaceUsers).values(workspaceUsersData)
    }
    
    return newUser
  })
