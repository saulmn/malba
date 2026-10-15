import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users, authSessions } from '@/db/schema'
import { eq, or } from 'drizzle-orm'
import { setCookie, getCookie, deleteCookie } from '@tanstack/react-start/server'
// Using simple random token for demonstration
import { randomBytes } from 'crypto'

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: { identifier: string, password: string }) => data)
  .handler(async ({ data }) => {
    // 1. Find user by email OR username
    const user = await db.query.users.findFirst({
      where: or(
        eq(users.email, data.identifier),
        eq(users.username, data.identifier)
      )
    })

    if (!user) {
      throw new Error("Usuario no encontrado")
    }

    if (user.passwordHash !== `hashed_${data.password}`) {
      throw new Error("Contraseña incorrecta")
    }

    // 2. Create session
    const sessionId = randomBytes(16).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await db.insert(authSessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    })

    // 3. Set cookie
    setCookie('auth_session', sessionId, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
    })

    return { success: true, user: { id: user.id, name: user.name, email: user.email } }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const sessionId = getCookie('auth_session')
    if (sessionId) {
      await db.delete(authSessions).where(eq(authSessions.id, sessionId))
    }
    deleteCookie('auth_session')
    return { success: true }
  })

export const getSessionFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const sessionId = getCookie('auth_session')
    if (!sessionId) return null

    const session = await db.query.authSessions.findFirst({
      where: eq(authSessions.id, sessionId),
      with: {
        user: true
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session.user
  })
