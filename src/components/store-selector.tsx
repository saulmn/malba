import { useState, useEffect } from "react"
import { Store, ChevronDown, Check, AlertTriangle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getSessionFn } from "@/server/auth"
import { getUserWorkspacesFn, switchActiveStoreFn } from "@/server/workspaces"
import { toast } from "sonner"
import { cn } from "cn"

interface Workspace {
  id: number
  name: string
  location?: string | null
}

interface UserSession {
  id: number
  name: string
  email: string
  role: string
  activeStore: number | null
  activeWorkspace?: Workspace | null
}

export function StoreSelector() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const loadData = async () => {
    try {
      const [userData, wsList] = await Promise.all([
        getSessionFn(),
        getUserWorkspacesFn(),
      ])
      if (userData) {
        setUser(userData as unknown as UserSession)
      }
      if (wsList) {
        setWorkspaces(wsList)
      }
    } catch (err) {
      console.error("Error loading store selector data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-4 w-3 text-muted-foreground">/</div>
        <div className="h-8 w-32 bg-muted rounded-md"></div>
      </div>
    )
  }

  if (!user) return null

  const activeWorkspace = user.activeWorkspace || workspaces.find((w) => w.id === user.activeStore) || workspaces[0]

  const handleSelectWorkspace = (ws: Workspace) => {
    setPopoverOpen(false)
    if (activeWorkspace && ws.id === activeWorkspace.id) {
      return
    }
    setSelectedWs(ws)
    setIsConfirmOpen(true)
  }

  const handleConfirmSwitch = async () => {
    if (!selectedWs) return
    setIsSwitching(true)
    try {
      await switchActiveStoreFn({ data: { workspaceId: selectedWs.id } })
      toast.success(`Sucursal cambiada a ${selectedWs.name}`)
      setIsConfirmOpen(false)
      // Reload page to refresh all active queries, register sessions, and cart state
      window.location.reload()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Error al cambiar de sucursal")
      setIsSwitching(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        {/* User Name */}
        <div className="hidden sm:flex items-center gap-1.5 font-medium text-foreground">
          <User className="size-4 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[150px]">{user.name}</span>
        </div>

        <span className="hidden sm:inline text-muted-foreground/60 font-light">/</span>

        {/* Store Dropdown */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 px-2.5 font-medium bg-background hover:bg-accent/60 border-input shadow-xs transition-colors"
              >
                <Store className="size-3.5 text-primary shrink-0" />
                <span className="max-w-[140px] sm:max-w-[180px] truncate">
                  {activeWorkspace ? activeWorkspace.name : "Seleccionar Sucursal"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64 p-1.5 shadow-lg">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Sucursales disponibles
            </div>
            {workspaces.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                No tienes sucursales asignadas
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {workspaces.map((ws) => {
                  const isActive = activeWorkspace?.id === ws.id
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSelectWorkspace(ws)}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-2 text-sm rounded-md transition-colors text-left group",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-accent/80 text-foreground"
                      )}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate leading-tight">{ws.name}</span>
                        {ws.location && (
                          <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                            {ws.location}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => !isSwitching && setIsConfirmOpen(open)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Store className="size-5 shrink-0" />
              <DialogTitle>¿Cambiar de sucursal activa?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-foreground/80 leading-relaxed text-sm">
              Estás a punto de cambiar a la sucursal{" "}
              <strong className="text-foreground font-semibold">"{selectedWs?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Aviso importante</p>
              <p className="leading-relaxed">
                A partir de este cambio, todas las operaciones (ventas, inventario y cortes de caja) se vincularán exclusivamente a esta nueva sucursal activa.
              </p>
              <p className="text-[11px] opacity-90">
                Cualquier venta en proceso en el carrito del punto de venta se reiniciará.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSwitching}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmSwitch}
              disabled={isSwitching}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isSwitching ? "Cambiando..." : "Confirmar Cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
