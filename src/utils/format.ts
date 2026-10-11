export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export const formatQuantity = (quantity: number, unit: 'piece' | 'liter' | 'kilo') => {
  if (unit === 'piece') return `${quantity} pz`
  if (unit === 'kilo') return `${quantity} kg`
  return `${quantity} L`
}
