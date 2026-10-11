import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  category: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  margin: z.coerce.number().min(0).optional(),
  notes: z.string().max(3000, 'Las notas no pueden superar 3000 caracteres').optional(),
  minStock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(5),
  unit: z.enum(['piece', 'liter', 'kilo']),
  image: z.any().optional(),
  imageUrl: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const workspaceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  location: z.string().optional(),
})

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>

export const userSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Debe ser un correo electrÃ³nico vÃ¡lido'),
  password: z.string().min(6, 'La contraseÃ±a debe tener al menos 6 caracteres'),
  role: z.enum(['master', 'admin', 'manager', 'staff']).default('staff'),
})

export type UserFormValues = z.infer<typeof userSchema>




