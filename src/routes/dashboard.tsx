import { createFileRoute } from '@tanstack/react-router'
import { DashboardScreen } from '@/features/dashboard/dashboard-screen'
import { getDashboardStatsFn } from '@/server/dashboard'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  loader: async () => {
    return await getDashboardStatsFn()
  },
})

function RouteComponent() {
  const data = Route.useLoaderData()
  return <DashboardScreen data={data} />
}
