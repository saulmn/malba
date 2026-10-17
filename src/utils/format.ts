export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export const formatQuantity = (
  quantity: number,
  unit?: 'piece' | 'liter' | 'kilo' | 'package' | string | null
) => {
  if (!unit) return `${quantity}`
  if (unit === 'piece') return `${quantity} pz`
  if (unit === 'kilo') return `${quantity} kg`
  if (unit === 'package') return `${quantity} paq`
  if (unit === 'liter') return `${quantity} L`
  return `${quantity} ${unit}`
}
