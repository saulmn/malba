import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/utils/format'

export const checkoutSchema = z.object({
  received: z.coerce.number().min(0, 'La cantidad recibida debe ser positiva'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export function CheckoutForm({ total, onSubmit, onCancel }: { total: number, onSubmit: (data: CheckoutFormValues) => void, onCancel?: () => void }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CheckoutFormValues>({
    // @ts-expect-error Zod resolver typing mismatch
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      received: total
    }
  })

  const received = useWatch({ control, name: 'received' }) || 0
  const change = Math.max(0, received - total)
  const isEnough = received >= total

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
        <span className="text-lg">Total a cobrar:</span>
        <span className="text-3xl font-bold text-primary">{formatCurrency(total)}</span>
      </div>

      <div className="space-y-2 pt-2">
        <Label htmlFor="received" className="text-lg">Efectivo Recibido</Label>
        <Input 
          id="received" 
          type="number" 
          step="0.01" 
          className="text-2xl h-14" 
          autoFocus
          {...register('received')} 
        />
        {errors.received && <p className="text-sm text-red-500">{errors.received.message}</p>}
        {!isEnough && received > 0 && <p className="text-sm text-orange-500">Falta {formatCurrency(total - received)}</p>}
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-lg text-muted-foreground">Cambio a regresar:</span>
        <span className={`text-2xl font-bold ${change > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          {formatCurrency(change)}
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-6">
        <Button type="submit" size="lg" className="h-14 text-lg" disabled={!isEnough}>
          Completar Venta
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
