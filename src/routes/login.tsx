import { createFileRoute } from '@tanstack/react-router'
import { LoginScreen } from '@/features/auth/auth-screen'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LoginScreen />
}
