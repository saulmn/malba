import { useEffect, useState } from 'react'
import { Bell, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { getLowStockNotificationsFn } from '@/server/notifications'

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch client side after mount to avoid blocking root loader
    getLowStockNotificationsFn().then((data) => {
      setNotifications(data)
      setLoading(false)
    })
  }, [])

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
          )}
        </Button>
      } />
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          <Badge variant="secondary" className="text-xs">{notifications.length}</Badge>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 text-muted/50" />
              Todo al corriente.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <div className="bg-red-100 text-red-600 p-2 rounded-full dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">Stock Bajo: {notif.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quedan {Number(notif.quantity)} (Mínimo: {Number(notif.minStock || 5)})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

