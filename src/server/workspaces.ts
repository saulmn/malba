import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { workspaces } from '@/db/schema'
import { workspaceSchema } from '@/utils/validations'

export const getWorkspacesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const results = await db.select().from(workspaces)
    return results
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
