import { createFileRoute } from '@tanstack/react-router'
import { PosScreen } from '@/features/pos/pos-screen'

export const Route = createFileRoute('/ventas')({
  component: RouteComponent,
  loader: async () => {
    const { getInventoryFn } = await import('@/server/inventory')
    const { getCurrentRegisterFn } = await import('@/server/registers')
    const { getCustomersFn } = await import('@/server/customers')
    
    const [products, currentRegister, customers] = await Promise.all([
      getInventoryFn(),
      getCurrentRegisterFn(),
      getCustomersFn()
    ])
    
    return { products, currentRegister, customers }
  },
})

function RouteComponent() {
  return <PosScreen />
}

