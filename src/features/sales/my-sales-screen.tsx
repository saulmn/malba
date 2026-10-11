import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/utils/format'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from '@tanstack/react-router'

type Period = 'today' | 'week' | 'month' | 'all'

export function MySalesScreen({ 
  userId, 
  sales, 
  currentPeriod 
}: { 
  userId: number; 
  sales: any[]; 
  currentPeriod: Period 
}) {
  const navigate = useNavigate({ from: '/mis-ventas' })

  const handlePeriodChange = (val: Period) => {
    navigate({
      search: { period: val }
    })
  }

  const totalSales = sales.reduce((acc, sale) => acc + Number(sale.total), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Ventas</h1>
          <p className="text-muted-foreground">Historial de ventas que has realizado</p>
        </div>
        <div className="w-48">
          <Select value={currentPeriod} onValueChange={(v) => handlePeriodChange(v as Period)}>
            <SelectTrigger>
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="all">Todo el historial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Tickets cobrados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>
            Mostrando {sales.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No hay ventas en este periodo</div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-3 md:grid-cols-4 p-4 border-b font-medium text-muted-foreground bg-muted/50">
                <div className="col-span-2 md:col-span-2">Fecha y Hora</div>
                <div className="hidden md:block">Concepto</div>
                <div className="text-right">Monto</div>
              </div>
              <div className="divide-y max-h-[60vh] overflow-y-auto">
                {sales.map((sale) => (
                  <div key={sale.id} className="grid grid-cols-3 md:grid-cols-4 p-4 items-center">
                    <div className="col-span-2 md:col-span-2">
                      <p className="font-medium">{format(new Date(sale.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(sale.createdAt), "hh:mm a")}</p>
                    </div>
                    <div className="hidden md:block text-muted-foreground text-sm">
                      {sale.description}
                    </div>
                    <div className="text-right font-medium text-green-600">
                      +{formatCurrency(Number(sale.total))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



