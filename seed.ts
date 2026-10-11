import { db } from './src/db'
import { users } from './src/db/schema'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('Seeding initial master account...')
  
  // Check if master already exists
  const existingMaster = await db.query.users.findFirst({
    where: eq(users.username, 'master')
  })

  if (existingMaster) {
    console.log('Master account already exists.')
    process.exit(0)
  }

  await db.insert(users).values({
    name: 'Cuenta Maestra',
    username: 'master',
    email: 'master@puntodeventa.com',
    passwordHash: 'hashed_admin123', // In a real app, this would be properly hashed
    role: 'master',
  })

  console.log('Master account created successfully!')
  console.log('Username: master')
  console.log('Password: admin123')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
