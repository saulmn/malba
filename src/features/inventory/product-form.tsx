import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormValues } from '@/utils/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ProductForm({ onSubmit, onCancel, defaultValues }: { onSubmit: (data: ProductFormValues) => void, onCancel?: () => void, defaultValues?: Partial<ProductFormValues> }) {
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<ProductFormValues>({
    // @ts-expect-error Zod resolver typing mismatch
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {
      unit: 'piece',
      minStock: 5,
      margin: 0,
      cost: 0,
      price: 0
    }
  })

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cost = parseFloat(e.target.value) || 0
    const margin = parseFloat(getValues('margin')?.toString() || '0')
    if (margin > 0) {
      const price = cost * (1 + margin / 100)
      setValue('price', Number(price.toFixed(2)))
    }
  }

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const margin = parseFloat(e.target.value) || 0
    const cost = parseFloat(getValues('cost').toString() || '0')
    const price = cost * (1 + margin / 100)
    setValue('price', Number(price.toFixed(2)))
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0
    const cost = parseFloat(getValues('cost').toString() || '0')
    if (cost > 0) {
      const margin = ((price / cost) - 1) * 100
      setValue('margin', Number(margin.toFixed(2)))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Producto</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Input id="category" {...register('category')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Costo ($)</Label>
          <Input 
            id="cost" 
            type="number" 
            step="0.01" 
            {...register('cost')} 
            onChange={(e) => {
              register('cost').onChange(e)
              handleCostChange(e)
            }}
          />
          {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="margin">Margen (%)</Label>
          <Input 
            id="margin" 
            type="number" 
            step="0.01" 
            {...register('margin')} 
            onChange={(e) => {
              register('margin').onChange(e)
              handleMarginChange(e)
            }}
          />
          {errors.margin && <p className="text-sm text-red-500">{errors.margin.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio Venta ($)</Label>
          <Input 
            id="price" 
            type="number" 
            step="0.01" 
            {...register('price')} 
            onChange={(e) => {
              register('price').onChange(e)
              handlePriceChange(e)
            }}
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad de Medida</Label>
          <select 
            id="unit" 
            {...register('unit')}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="piece">Pieza</option>
            <option value="liter">Litro</option>
            <option value="kilo">Kilo</option>
            <option value="package">Paquete</option>
          </select>
          {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock">Alerta de Stock (Mínimo)</Label>
          <Input id="minStock" type="number" step="0.01" {...register('minStock')} />
          {errors.minStock && <p className="text-sm text-red-500">{errors.minStock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (Opcional)</Label>
        <Textarea 
          id="notes" 
          placeholder="Ej: Comprado en Walmart..."
          className="resize-none h-20"
          {...register('notes')} 
        />
        {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Foto del Producto</Label>
        <Input id="image" type="file" accept="image/*" {...register('image')} />
        <p className="text-xs text-muted-foreground">Sube una imagen para identificar rápidamente el producto en la caja.</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Guardar Producto</Button>
      </div>
    </form>
  )
}
