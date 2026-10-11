import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { transactions, transactionItems } from '@/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { registerSessions } from '@/db/schema'

type CheckoutPayload = {
  items: Array<{ productId: number; quantity: number; price: number }>
  total: number
  workspaceId: number
  registerSessionId: number
}

export const createSaleFn = createServerFn({ method: 'POST' })
  .validator((data: CheckoutPayload) => data)
  .handler(async ({ data }) => {
    // 1. Create transaction
    const [transaction] = await db.insert(transactions).values({
      registerSessionId: data.registerSessionId,
      type: 'income',
      total: data.total.toString(),
      description: 'Venta POS',
    }).returning()

    // 2. Create transaction items & deduct inventory
    for (const item of data.items) {
      await db.insert(transactionItems).values({
        transactionId: transaction.id,
        productId: item.productId,
        quantity: item.quantity.toString(),
        price: item.price.toString(),
      })

      // Deduct inventory
      // Simple raw sql deduction
      await db.execute(sql`
        UPDATE inventory 
        SET quantity = quantity - ${item.quantity} 
        WHERE product_id = ${item.productId} AND workspace_id = ${data.workspaceId}
      `)
    }

    return transaction
  })

export const getMySalesFn = createServerFn({ method: 'GET' })
  .validator((data: { userId: number, period: 'today' | 'week' | 'month' | 'all' }) => data)
  .handler(async ({ data }) => {
    let dateFilter;
    const now = new Date();
    if (data.period === 'today') {
      const startOfDay = new Date(now.setHours(0,0,0,0));
      dateFilter = sql`${transactions.createdAt} >= ${startOfDay.toISOString()}`;
    } else if (data.period === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0,0,0,0);
      dateFilter = sql`${transactions.createdAt} >= ${startOfWeek.toISOString()}`;
    } else if (data.period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = sql`${transactions.createdAt} >= ${startOfMonth.toISOString()}`;
    }

    const conditions = [
      eq(transactions.type, 'income'),
      eq(registerSessions.userId, data.userId)
    ];
    if (dateFilter) conditions.push(dateFilter);

    const sales = await db.select({
      id: transactions.id,
      total: transactions.total,
      description: transactions.description,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(registerSessions, eq(transactions.registerSessionId, registerSessions.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt));

    return sales;
  })
