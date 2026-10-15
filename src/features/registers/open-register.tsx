import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { openRegisterFn } from '@/server/registers'
import { useRouter } from '@tanstack/react-router'
import { formatCurrency } from '@/utils/format'

export function OpenRegisterScreen() {
  const [balance, setBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await openRegisterFn({
        data: {
          startingBalance: parseFloat(balance) || 0
        }
      })
      toast.success("Caja abierta exitosamente")
      router.invalidate() // Recarga la ruta para obtener el nuevo register
    } catch (error) {
      console.error(error)
      toast.error("Error al abrir caja")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Abrir Caja</CardTitle>
          <CardDescription>
            Ingresa el saldo inicial (fondo de caja) con el que comienzas este turno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOpen} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Saldo Inicial ($)</Label>
              <Input 
                id="balance"
                type="number" 
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Abrir Turno
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
