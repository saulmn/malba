import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface ProductFormProps {
	onSubmit: (data: ProductFormValues) => void;
	onCancel?: () => void;
	defaultValues?: Partial<ProductFormValues>;
	suppliers?: Array<{ id: number; name: string }>;
	categories?: Array<{ id: number | string; name: string }>;
}

export function ProductForm({
	onSubmit,
	onCancel,
	defaultValues,
	suppliers = [],
	categories = [],
}: ProductFormProps) {
	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		control,
		formState: { errors },
	} = useForm<ProductFormValues>({
		// @ts-expect-error Zod resolver typing mismatch
		resolver: zodResolver(productSchema),
		defaultValues: {
			name: defaultValues?.name || "",
			category: defaultValues?.category || "",
			cost: defaultValues?.cost !== undefined ? defaultValues.cost : 0,
			margin: defaultValues?.margin !== undefined ? defaultValues.margin : 0,
			price: defaultValues?.price !== undefined ? defaultValues.price : 0,
			quantity: defaultValues?.quantity !== undefined ? defaultValues.quantity : 0,
			minStock: defaultValues?.minStock !== undefined ? defaultValues.minStock : 1,
			unit: defaultValues?.unit || "piece",
			supplierId: defaultValues?.supplierId || null,
			notes: defaultValues?.notes || "",
		},
	});

	const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const cost = parseFloat(e.target.value) || 0;
		const margin = parseFloat(getValues("margin")?.toString() || "0");
		if (margin > 0) {
			const price = cost * (1 + margin / 100);
			setValue("price", Number(price.toFixed(2)));
		}
	};

	const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const margin = parseFloat(e.target.value) || 0;
		const cost = parseFloat(getValues("cost").toString() || "0");
		const price = cost * (1 + margin / 100);
		setValue("price", Number(price.toFixed(2)));
	};

	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const price = parseFloat(e.target.value) || 0;
		const cost = parseFloat(getValues("cost").toString() || "0");
		if (cost > 0) {
			const margin = (price / cost - 1) * 100;
			setValue("margin", Number(margin.toFixed(2)));
		}
	};

	const categoryOptions = categories.map((c) => ({
		value: c.name,
		label: c.name,
	}));

	const supplierOptions = [
		{ value: "", label: "Sin proveedor asignado" },
		...suppliers.map((s) => ({
			value: String(s.id),
			label: s.name,
		})),
	];

	return (
		<form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre del Producto *</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="Ej. Coca Cola 600ml, Sabritas Original"
				/>
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name.message}</p>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Searchable / Reusable Category */}
				<div className="space-y-2">
					<Label>Categoría</Label>
					<Controller
						control={control}
						name="category"
						render={({ field }) => (
							<SearchableSelect
								value={field.value}
								onChange={field.onChange}
								options={categoryOptions}
								placeholder="Seleccionar o crear categoría..."
								searchPlaceholder="Buscar o escribir categoría..."
								allowCreate={true}
								createLabel="Crear categoría"
							/>
						)}
					/>
					{errors.category && (
						<p className="text-xs text-destructive">{errors.category.message}</p>
					)}
				</div>

				{/* Searchable Supplier */}
				<div className="space-y-2">
					<Label>Proveedor</Label>
					<Controller
						control={control}
						name="supplierId"
						render={({ field }) => (
							<SearchableSelect
								value={field.value ? String(field.value) : ""}
								onChange={(val) => field.onChange(val ? Number(val) : null)}
								options={supplierOptions}
								placeholder="Seleccionar proveedor..."
								searchPlaceholder="Buscar proveedor..."
								allowCreate={false}
							/>
						)}
					/>
				</div>
			</div>

			{/* Cost, Margin, Sale Price */}
			<div className="grid grid-cols-3 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="cost" className="text-xs">
						Costo ($)
					</Label>
					<Input
						id="cost"
						type="number"
						step="0.01"
						{...register("cost")}
						onChange={(e) => {
							register("cost").onChange(e);
							handleCostChange(e);
						}}
					/>
					{errors.cost && (
						<p className="text-xs text-destructive">{errors.cost.message}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="margin" className="text-xs">
						Margen (%)
					</Label>
					<Input
						id="margin"
						type="number"
						step="0.01"
						{...register("margin")}
						onChange={(e) => {
							register("margin").onChange(e);
							handleMarginChange(e);
						}}
					/>
					{errors.margin && (
						<p className="text-xs text-destructive">{errors.margin.message}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="price" className="text-xs">
						Precio Venta ($) *
					</Label>
					<Input
						id="price"
						type="number"
						step="0.01"
						{...register("price")}
						onChange={(e) => {
							register("price").onChange(e);
							handlePriceChange(e);
						}}
					/>
					{errors.price && (
						<p className="text-xs text-destructive">{errors.price.message}</p>
					)}
				</div>
			</div>

			{/* Stock & Unit Details */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="quantity" className="text-xs font-semibold text-primary">
						Existencias en Inventario *
					</Label>
					<Input
						id="quantity"
						type="number"
						step="0.001"
						min="0"
						{...register("quantity")}
						placeholder="0"
					/>
					{errors.quantity && (
						<p className="text-xs text-destructive">{errors.quantity.message}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="minStock" className="text-xs">
						Alerta de Stock Mínimo (Default: 1)
					</Label>
					<Input
						id="minStock"
						type="number"
						step="0.001"
						min="0"
						{...register("minStock")}
					/>
					{errors.minStock && (
						<p className="text-xs text-destructive">{errors.minStock.message}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="unit" className="text-xs">
						Unidad de Medida
					</Label>
					<select
						id="unit"
						{...register("unit")}
						className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
					>
						<option value="piece">Pieza</option>
						<option value="liter">Litro</option>
						<option value="kilo">Kilo</option>
						<option value="package">Paquete</option>
					</select>
					{errors.unit && (
						<p className="text-xs text-destructive">{errors.unit.message}</p>
					)}
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="notes" className="text-xs">
					Notas (Opcional)
				</Label>
				<Textarea
					id="notes"
					placeholder="Ej: Ubicación en pasillo 3, código de barras..."
					className="resize-none h-16 text-xs"
					{...register("notes")}
				/>
				{errors.notes && (
					<p className="text-xs text-destructive">{errors.notes.message}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="image" className="text-xs">
					Foto del Producto
				</Label>
				<Input id="image" type="file" accept="image/*" {...register("image")} />
				<p className="text-[11px] text-muted-foreground">
					Sube una imagen para identificar rápidamente el producto en la caja del POS.
				</p>
			</div>

			<div className="flex justify-end gap-2 pt-2 border-t">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
				)}
				<Button type="submit">Guardar Producto</Button>
			</div>
		</form>
	);
}
