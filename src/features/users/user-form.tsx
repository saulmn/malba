import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserFormValues } from '@/utils/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UserForm({ onSubmit, onCancel }: { onSubmit: (data: UserFormValues) => void, onCancel?: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValues>({
    // @ts-expect-error Zod resolver typing mismatch
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'staff'
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" {...register('name')} placeholder="Juan Pérez" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de Usuario (Opcional)</Label>
        <Input id="username" {...register('username')} placeholder="juanperez" />
        {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input id="email" type="email" {...register('email')} placeholder="juan@ejemplo.com" />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select 
          id="role" 
          {...register('role')}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="staff">Vendedor / Cajero (Staff)</option>
          <option value="manager">Gerente (Manager)</option>
          <option value="admin">Administrador (Admin)</option>
          <option value="master">Cuenta Maestra (Master)</option>
        </select>
        {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Guardar Usuario</Button>
      </div>
    </form>
  )
}
