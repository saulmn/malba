import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/config')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones de la Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Opciones y preferencias del sistema.</p>
        </CardContent>
      </Card>
    </div>
  )
}
