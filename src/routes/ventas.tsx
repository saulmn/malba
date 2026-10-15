import { createFileRoute } from '@tanstack/react-router'
import { PosScreen } from '@/features/pos/pos-screen'

export const Route = createFileRoute('/ventas')({
  component: RouteComponent,
  loader: async () => {
    const { getInventoryFn } = await import('@/server/inventory')
    const { getCurrentRegisterFn } = await import('@/server/registers')
    
    const [products, currentRegister] = await Promise.all([
      getInventoryFn(),
      getCurrentRegisterFn()
    ])
    
    return { products, currentRegister }
  },
})

function RouteComponent() {
  return <PosScreen />
}

