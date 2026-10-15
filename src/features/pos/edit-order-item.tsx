import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type EditOrderItemProps = {
  item: {
    id: string
    name: string
    price: number
    quantity: number
    unit: 'piece' | 'liter' | 'kilo'
  }
  onSave: (id: string, newQuantity: number) => void
  onCancel: () => void
}

export function EditOrderItem({ item, onSave, onCancel }: EditOrderItemProps) {
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [amount, setAmount] = useState((item.quantity * item.price).toFixed(2))

  // When quantity changes, update amount
  const handleQuantityChange = (val: string) => {
    setQuantity(val)
    const num = parseFloat(val) || 0
    setAmount((num * item.price).toFixed(2))
  }

  // When amount changes, update quantity
  const handleAmountChange = (val: string) => {
    setAmount(val)
    const num = parseFloat(val) || 0
    // Prevent division by zero
    if (item.price > 0) {
      const calcQty = num / item.price
      // If piece or package, we probably shouldn't allow decimals, but for bulk we do.
      if (item.unit === 'piece' || item.unit === 'package') {
        setQuantity(Math.floor(calcQty).toString())
      } else {
        setQuantity(calcQty.toFixed(3))
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(item.id, parseFloat(quantity) || 0)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qty">
            Cantidad ({item.unit === 'piece' ? 'Pz' : item.unit === 'liter' ? 'Litros' : item.unit === 'kilo' ? 'Kilos' : 'Paquetes'})
          </Label>
          <Input 
            id="qty" 
            type="number" 
            step={item.unit === 'piece' || item.unit === 'package' ? '1' : '0.001'}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Importe ($)</Label>
          <Input 
            id="amount" 
            type="number" 
            step="0.01"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

