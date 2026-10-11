import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workspaceSchema, type WorkspaceFormValues } from '@/utils/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WorkspaceForm({ onSubmit, onCancel }: { onSubmit: (data: WorkspaceFormValues) => void, onCancel?: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Sucursal</Label>
        <Input id="name" {...register('name')} placeholder="Ej. Matriz Centro" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input id="location" {...register('location')} placeholder="Dirección completa" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Guardar Sucursal</Button>
      </div>
    </form>
  )
}
