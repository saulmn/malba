import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CustomerFormProps {
	initialData?: Partial<CustomerFormValues>;
	onSubmit: (data: CustomerFormValues) => void;
	onCancel: () => void;
}

export function CustomerForm({
	initialData,
	onSubmit,
	onCancel,
}: CustomerFormProps) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<CustomerFormValues>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			name: initialData?.name || "",
			notes: initialData?.notes || "",
			phone1: initialData?.phone1 || "",
			phone2: initialData?.phone2 || "",
			email: initialData?.email || "",
			web: initialData?.web || "",
			address: initialData?.address || "",
		},
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre del Cliente *</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="Ej. Juan Pérez, Empresa ABC"
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="notes">Notas / Preferencias</Label>
				<Textarea
					id="notes"
					{...register("notes")}
					placeholder="Preferencias de productos, facturación, horario de entrega, etc. (Máx. 3000 caracteres)"
					rows={3}
					maxLength={3000}
				/>
				{errors.notes && (
					<p className="text-xs text-destructive">{errors.notes.message}</p>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="phone1" className="text-xs">
						Teléfono Principal (WhatsApp)
					</Label>
					<Input
						id="phone1"
						{...register("phone1")}
						placeholder="(55) 1234-5678"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="phone2" className="text-xs">
						Teléfono Alternativo
					</Label>
					<Input
						id="phone2"
						{...register("phone2")}
						placeholder="(55) 9876-5432"
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="email" className="text-xs">
						Correo Electrónico
					</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						placeholder="cliente@ejemplo.com"
					/>
					{errors.email && (
						<p className="text-xs text-destructive">{errors.email.message}</p>
					)}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="web" className="text-xs">
						Sitio Web / Red Social
					</Label>
					<Input
						id="web"
						{...register("web")}
						placeholder="https://facebook.com/cliente"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="address">Dirección</Label>
				<Input
					id="address"
					{...register("address")}
					placeholder="Calle, colonia, referencias para envío"
				/>
			</div>

			<div className="flex justify-end gap-2 pt-3">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Guardando..." : "Guardar Cliente"}
				</Button>
			</div>
		</form>
	);
}
