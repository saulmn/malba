import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { UserForm } from '@/features/users/user-form'
import { type UserFormValues } from '@/utils/validations'
import { createUserFn, getUsersFn } from '@/server/users'

export const Route = createFileRoute('/usuarios')({
  component: RouteComponent,
  loader: async () => {
    return await getUsersFn()
  },
})

function RouteComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const data = Route.useLoaderData()
  const router = useRouter()

  const handleCreateUser = async (formData: UserFormValues) => {
    try {
      await createUserFn({ data: formData })
      toast.success("Usuario creado exitosamente")
      setIsDialogOpen(false)
      router.invalidate() // Reload data
    } catch (error) {
      toast.error("Error al crear usuario")
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        
        <ResponsiveDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          title="Agregar Nuevo Usuario"
          trigger={<Button className="flex items-center gap-2"><Plus size={16} /> Nuevo Usuario</Button>}
        >
          <UserForm onSubmit={handleCreateUser} onCancel={() => setIsDialogOpen(false)} />
        </ResponsiveDialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                  <th className="px-4 py-3 font-medium text-foreground">Email / Usuario</th>
                  <th className="px-4 py-3 font-medium text-foreground">Rol</th>
                  <th className="px-4 py-3 font-medium text-foreground text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  data.map(user => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.username ? (<span>{user.email}<br/><span className="text-xs opacity-70">@{user.username}</span></span>) : user.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"> {user.role.toUpperCase()} </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


