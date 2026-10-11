import { createFileRoute } from '@tanstack/react-router'
import { MySalesScreen } from '@/features/sales/my-sales-screen'
import { getSessionFn } from '@/server/auth'
import { getMySalesFn } from '@/server/sales'

export const Route = createFileRoute('/mis-ventas')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      period: (search.period as 'today' | 'week' | 'month' | 'all') || 'today'
    }
  },
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: async ({ deps: { period } }) => {
    const user = await getSessionFn()
    if (!user) {
      throw new Error("No autenticado")
    }
    
    const sales = await getMySalesFn({ data: { userId: user.id, period } })
    return { user, sales }
  },
  component: MisVentasRoute,
})

function MisVentasRoute() {
  const { user, sales } = Route.useLoaderData()
  const { period } = Route.useSearch()
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <MySalesScreen userId={user.id} sales={sales} currentPeriod={period} />
    </div>
  )
}
