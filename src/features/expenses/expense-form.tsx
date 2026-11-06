import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";

const PAYMENT_METHODS = [
	{ value: "cash_register", label: "Efectivo de Caja (Turno activo)" },
	{ value: "transfer", label: "Transferencia Bancaria" },
	{ value: "card", label: "Tarjeta Débito / Crédito" },
	{ value: "other", label: "Otro / Crédito" },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash_register: "Efectivo de Caja (Turno activo)",
	transfer: "Transferencia Bancaria",
	card: "Tarjeta Débito / Crédito",
	other: "Otro / Crédito",
};

interface ExpenseFormProps {
	suppliers: Array<{ id: number; name: string }>;
	hasOpenRegister: boolean;
	onSubmit: (data: ExpenseFormValues) => void | Promise<void>;
	onCancel: () => void;
}

export function ExpenseForm({
	suppliers,
	hasOpenRegister,
	onSubmit,
	onCancel,
}: ExpenseFormProps) {
	const todayStr = new Date().toISOString().split("T")[0];

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			title: "",
			description: "",
			supplierId: null,
			amount: 0,
			paymentMethod: hasOpenRegister ? "cash_register" : "transfer",
			date: todayStr,
		},
	});

	const selectedPaymentMethod = watch("paymentMethod");

	const onFormSubmit = async (data: ExpenseFormValues) => {
		await onSubmit(data);
	};

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="title">Concepto / Título del Gasto *</Label>
				<Input
					id="title"
					{...register("title")}
					placeholder="Ej. Pago de luz, Compra de refrescos, Mantenimiento"
				/>
				{errors.title && (
					<p className="text-xs text-destructive">{errors.title.message}</p>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="amount">Monto ($) *</Label>
					<Input
						id="amount"
						type="number"
						step="0.01"
						min="0.01"
						{...register("amount")}
						placeholder="0.00"
					/>
					{errors.amount && (
						<p className="text-xs text-destructive">{errors.amount.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="date">Fecha del Gasto</Label>
					<Input id="date" type="date" {...register("date")} />
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label>Método de Pago *</Label>
					<Controller
						control={control}
						name="paymentMethod"
						render={({ field }) => (
							<Select
								items={PAYMENT_METHODS}
								value={field.value}
								onValueChange={(val) =>
									field.onChange(
										val as "cash_register" | "transfer" | "card" | "other",
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Selecciona método de pago">
										{(val: string | null) =>
											(val && PAYMENT_METHOD_LABELS[val]) ||
											"Selecciona método de pago"
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_METHODS.map((m) => (
										<SelectItem key={m.value} value={m.value}>
											{m.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
					{selectedPaymentMethod === "cash_register" && !hasOpenRegister && (
						<p className="text-xs text-amber-600 dark:text-amber-400">
							⚠️ Advertencia: No hay caja abierta. Se requiere abrir caja para
							registrar salida de efectivo.
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label>Proveedor (Opcional)</Label>
					<Controller
						control={control}
						name="supplierId"
						render={({ field }) => (
							<SearchableSelect
								value={field.value ? String(field.value) : ""}
								onChange={(val) => field.onChange(val ? Number(val) : null)}
								options={[
									{ value: "", label: "Sin proveedor (Gasto general)" },
									...suppliers.map((s) => ({
										value: String(s.id),
										label: s.name,
									})),
								]}
								placeholder="Sin proveedor (Gasto general)"
								searchPlaceholder="Buscar proveedor..."
							/>
						)}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Notas / Justificación</Label>
				<Textarea
					id="description"
					{...register("description")}
					placeholder="Número de factura o ticket, justificación, etc. (Máx. 3000 caracteres)"
					rows={3}
					maxLength={3000}
				/>
				{errors.description && (
					<p className="text-xs text-destructive">
						{errors.description.message}
					</p>
				)}
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
				<Button
					type="submit"
					disabled={isSubmitting}
					className="flex items-center gap-2"
				>
					{isSubmitting && <Loader2 className="size-4 animate-spin" />}
					{isSubmitting ? "Registrando..." : "Registrar Gasto"}
				</Button>
			</div>
		</form>
	);
}
