import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type SupplierFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SupplierFormProps {
	initialData?: Partial<SupplierFormValues>;
	onSubmit: (data: SupplierFormValues) => void;
	onCancel: () => void;
}

export function SupplierForm({
	initialData,
	onSubmit,
	onCancel,
}: SupplierFormProps) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SupplierFormValues>({
		resolver: zodResolver(supplierSchema),
		defaultValues: {
			name: initialData?.name || "",
			description: initialData?.description || "",
			phone1: initialData?.phone1 || "",
			phone2: initialData?.phone2 || "",
			phone3: initialData?.phone3 || "",
			email: initialData?.email || "",
			web: initialData?.web || "",
			address: initialData?.address || "",
		},
	});

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre del Proveedor *</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="Ej. Distribuidora Central, Coca Cola"
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Descripción / Notas</Label>
				<Textarea
					id="description"
					{...register("description")}
					placeholder="Condiciones de entrega, días de visita, crédito, etc. (Máx. 3000 caracteres)"
					rows={3}
					maxLength={3000}
				/>
				{errors.description && (
					<p className="text-xs text-destructive">
						{errors.description.message}
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="phone1" className="text-xs">
						Teléfono Principal
					</Label>
					<Input
						id="phone1"
						{...register("phone1")}
						placeholder="(55) 1234-5678"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="phone2" className="text-xs">
						Teléfono 2 (Opcional)
					</Label>
					<Input
						id="phone2"
						{...register("phone2")}
						placeholder="(55) 9876-5432"
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="phone3" className="text-xs">
						Teléfono 3 (Opcional)
					</Label>
					<Input
						id="phone3"
						{...register("phone3")}
						placeholder="Oficina / Asesor"
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
						placeholder="pedidos@proveedor.com"
					/>
					{errors.email && (
						<p className="text-xs text-destructive">{errors.email.message}</p>
					)}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="web" className="text-xs">
						Sitio Web / Portal B2B
					</Label>
					<Input
						id="web"
						{...register("web")}
						placeholder="https://portal.proveedor.com"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="address">Dirección de Entrega / Bodega</Label>
				<Input
					id="address"
					{...register("address")}
					placeholder="Calle, número, colonia, código postal"
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
					{isSubmitting ? "Guardando..." : "Guardar Proveedor"}
				</Button>
			</div>
		</form>
	);
}
