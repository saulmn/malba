import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency, formatQuantity } from '@/utils/format'
import { Trash2, Search } from 'lucide-react'
import { CheckoutForm, type CheckoutFormValues } from '@/features/pos/checkout-form'
import { EditOrderItem } from '@/features/pos/edit-order-item'
import { OpenRegisterScreen } from '@/features/registers/open-register'
import { CloseRegisterForm } from '@/features/registers/close-register'
import { createSaleFn } from '@/server/sales'
import { Route } from '@/routes/ventas'

type OrderItem = {
  id: string
  productId: number
  name: string
  price: number
  quantity: number
  unit: 'piece' | 'liter' | 'kilo'
}

export function PosScreen() {
  const { products, currentRegister, customers = [] } = Route.useLoaderData()

  const storageKey = currentRegister ? `pos_ticket_${currentRegister.workspaceId}` : null

  const [order, setOrder] = useState<OrderItem[]>(() => {
    if (typeof window === 'undefined' || !currentRegister) return []
    try {
      const saved = localStorage.getItem(`pos_ticket_${currentRegister.workspaceId}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isClearTicketOpen, setIsClearTicketOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        if (order.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(order))
        } else {
          localStorage.removeItem(storageKey)
        }
      } catch (e) {
        console.error('Error saving pos ticket to localStorage', e)
      }
    }
  }, [order, storageKey])

  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false)

  if (!currentRegister) {
    return <OpenRegisterScreen />
  }

  const addToOrder = (product: any) => {
    setOrder((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          unit: product.unit,
        },
      ]
    })
  }

  const removeFromOrder = (id: string) => {
    setOrder((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    if (isNaN(qty) || qty <= 0) return
    setOrder((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    )
    setEditingItem(null)
  }

  const total = order.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handlePay = async (data: CheckoutFormValues) => {
    if (order.length === 0) return
    
    try {
      await createSaleFn({
        data: {
          items: order.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          total: total,
          workspaceId: currentRegister.workspaceId,
          registerSessionId: currentRegister.id,
          customerId: data.customerId || null,
        }
      })
      toast.success("Venta guardada exitosamente", {
        description: `Total: ${formatCurrency(total)} | Recibido: ${formatCurrency(data.received)} | Cambio: ${formatCurrency(data.received - total)}`,
        duration: 5000,
      })
      setOrder([])
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.removeItem(storageKey)
      }
      setIsCheckoutOpen(false)
    } catch (error) {
      toast.error("Error al procesar la venta")
      console.error(error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 flex flex-col gap-4 lg:overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              className="pl-10 text-lg py-6"
              placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <ResponsiveDialog
            open={isCloseRegisterOpen}
            onOpenChange={setIsCloseRegisterOpen}
            title="Corte de Caja"
            trigger={<Button variant="destructive" size="lg" className="py-6 h-[72px]">Cerrar Caja</Button>}
          >
            <CloseRegisterForm 
              registerSessionId={currentRegister.id} 
              startingBalance={Number(currentRegister.startingBalance)}
              onCancel={() => setIsCloseRegisterOpen(false)}
            />
          </ResponsiveDialog>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between overflow-hidden"
                onClick={() => addToOrder(product)}
              >
                {product.imageUrl && (
                  <div className="h-32 w-full bg-muted overflow-hidden relative border-b">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      {Number(product.quantity) <= Number(product.minStock || 5) && (
                          <Badge variant="destructive" className="mr-2 px-1 py-0" title="Stock bajo">
                            <AlertTriangle size={12} className="mr-1" /> Bajo
                          </Badge>
                        )}
                        <Badge variant="outline">
                        {product.unit === 'liter' ? 'Litros' : product.unit === 'kilo' ? 'Kilos' : product.unit === 'package' ? 'Paquete' : 'PZ'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-2 leading-tight">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 mt-auto">
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(Number(product.price))}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        /{product.unit === 'piece' ? 'unidad' : product.unit === 'liter' ? 'litro' : product.unit === 'kilo' ? 'kilo' : 'paquete'}
                      </span>
                    </p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card className="flex flex-col h-[500px] lg:h-full overflow-hidden border-2 border-primary/20">
        <CardHeader className="bg-muted/30 border-b p-4">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Ticket Actual</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{order.length} artículos</Badge>
              {order.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => setIsClearTicketOpen(true)}
                  title="Vaciar ticket actual"
                >
                  Vaciar
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-0">
          {order.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay productos en el ticket
            </div>
          ) : (
            <ul className="divide-y">
              {order.map((item) => (
                <li key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium line-clamp-1">{item.name}</span>
                    <span className="font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <ResponsiveDialog
                        open={editingItem?.id === item.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingItem(null)
                        }}
                        title={"Editar $({item.name})"}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 font-medium bg-background"
                            onClick={() => setEditingItem(item)}
                          >
                            {formatQuantity(item.quantity, item.unit)}
                          </Button>
                        }
                      >
                        {editingItem?.id === item.id && (
                          <EditOrderItem 
                            item={item} 
                            onSave={updateQuantity} 
                            onCancel={() => setEditingItem(null)} 
                          />
                        )}
                      </ResponsiveDialog>
                      <span className="text-sm text-muted-foreground">
                        x {formatCurrency(item.price)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFromOrder(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        
        <div className="p-4 border-t bg-muted/30 flex flex-col gap-4">
          <div className="flex justify-between items-center text-xl">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary text-2xl">{formatCurrency(total)}</span>
          </div>
          
          <ResponsiveDialog 
            open={isCheckoutOpen} 
            onOpenChange={setIsCheckoutOpen}
            title="Completar Venta"
            trigger={<Button size="lg" className="w-full text-lg h-14" disabled={order.length === 0}>Cobrar</Button>}
          >
            <CheckoutForm 
              total={total} 
              customers={customers}
              onSubmit={handlePay} 
              onCancel={() => setIsCheckoutOpen(false)} 
            />
          </ResponsiveDialog>
        </div>
      </Card>

      <ConfirmDialog
        open={isClearTicketOpen}
        onOpenChange={setIsClearTicketOpen}
        title="Vaciar Ticket"
        description="¿Estás seguro de vaciar todos los artículos del ticket actual? Esta acción no se puede deshacer."
        confirmText="Vaciar Ticket"
        variant="destructive"
        icon="trash"
        onConfirm={() => {
          setOrder([])
          if (storageKey) localStorage.removeItem(storageKey)
        }}
      />
    </div>
  )
}




