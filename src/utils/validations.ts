import { z } from "zod";

export const productSchema = z.object({
	name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	category: z.string().optional(),
	price: z.coerce.number().min(0, "El precio no puede ser negativo"),
	cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
	margin: z.coerce.number().min(0).optional(),
	quantity: z.coerce.number().min(0, "La existencia no puede ser negativa").default(0),
	notes: z
		.string()
		.max(3000, "Las notas no pueden superar 3000 caracteres")
		.optional(),
	minStock: z.coerce
		.number()
		.min(0, "El stock mínimo no puede ser negativo")
		.default(1),
	unit: z.enum(["piece", "liter", "kilo", "package"]),
	supplierId: z.coerce.number().optional().nullable(),
	image: z.any().optional(),
	imageUrl: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
	name: z.string().min(2, "El nombre de la categoría debe tener al menos 2 caracteres"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const workspaceSchema = z.object({
	name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	location: z.string().optional(),
});

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export const userSchema = z.object({
	username: z
		.string()
		.min(3, "El usuario debe tener al menos 3 caracteres")
		.optional()
		.or(z.literal("")),
	name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	email: z.string().email("Debe ser un correo electrónico válido"),
	password: z.string().optional().or(z.literal("")),
	role: z.enum(["master", "admin", "manager", "staff"]).default("staff"),
	activeStoreId: z.coerce.number().optional().nullable(),
	workspaceIds: z.array(z.coerce.number()).optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

export const supplierSchema = z.object({
	name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	description: z.string().max(3000, "La descripción no puede superar 3000 caracteres").optional(),
	phone1: z.string().optional(),
	phone2: z.string().optional(),
	phone3: z.string().optional(),
	email: z.string().email("Correo no válido").optional().or(z.literal("")),
	web: z.string().optional(),
	address: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const customerSchema = z.object({
	name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	notes: z.string().max(3000, "Las notas no pueden superar 3000 caracteres").optional(),
	phone1: z.string().optional(),
	phone2: z.string().optional(),
	email: z.string().email("Correo no válido").optional().or(z.literal("")),
	web: z.string().optional(),
	address: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const expenseSchema = z.object({
	title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
	description: z.string().max(3000, "La descripción no puede superar 3000 caracteres").optional(),
	supplierId: z.coerce.number().optional().nullable(),
	amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
	paymentMethod: z.enum(["cash_register", "transfer", "card", "other"]).default("cash_register"),
	date: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const cashWithdrawalSchema = z.object({
	amount: z.coerce
		.number({ invalid_type_error: "Ingresa un monto válido" })
		.positive("El monto debe ser mayor a 0"),
	reason: z.string().min(2, "Selecciona o escribe el motivo del retiro"),
	description: z
		.string()
		.max(3000, "La descripción no puede superar 3000 caracteres")
		.optional(),
	registerSessionId: z.coerce.number().optional(),
});

export type CashWithdrawalFormValues = z.infer<typeof cashWithdrawalSchema>;
