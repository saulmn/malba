import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scale, Droplets } from "lucide-react";
import { formatCurrency } from "@/utils/format";

type EditOrderItemProps = {
	item: {
		id: string;
		name: string;
		price: number;
		quantity: number;
		unit: "piece" | "liter" | "kilo" | "package";
	};
	onSave: (id: string, newQuantity: number) => void;
	onCancel: () => void;
};

const round2 = (num: number): number => {
	return Math.round((num + Number.EPSILON) * 100) / 100;
};

export function EditOrderItem({ item, onSave, onCancel }: EditOrderItemProps) {
	const initialQty = round2(item.quantity);
	const [quantity, setQuantity] = useState(initialQty.toFixed(2));
	const [amount, setAmount] = useState((initialQty * item.price).toFixed(2));
	const [grams, setGrams] = useState(
		item.unit === "kilo" ? Math.round(initialQty * 1000).toString() : "",
	);
	const [mls, setMls] = useState(
		item.unit === "liter" ? Math.round(initialQty * 1000).toString() : "",
	);

	// Modificar cantidad (Kilos / Litros / Piezas)
	const handleQuantityChange = (val: string) => {
		// Si es unidad a granel, limitar a máximo 2 decimales mientras se escribe
		if (item.unit !== "piece" && item.unit !== "package") {
			if (val.includes(".")) {
				const parts = val.split(".");
				if (parts[1] && parts[1].length > 2) {
					val = `${parts[0]}.${parts[1].slice(0, 2)}`;
				}
			}
		}
		setQuantity(val);

		if (!val || val === "") {
			setAmount("");
			setGrams("");
			setMls("");
			return;
		}

		const num = parseFloat(val);
		if (isNaN(num)) return;

		const calcAmount = round2(num * item.price);
		setAmount(calcAmount.toFixed(2));

		if (item.unit === "kilo") {
			setGrams(Math.round(num * 1000).toString());
		} else if (item.unit === "liter") {
			setMls(Math.round(num * 1000).toString());
		}
	};

	// Modificar importe ($) -> calcular cantidad redondeada a 2 decimales
	const handleAmountChange = (val: string) => {
		setAmount(val);

		if (!val || val === "") {
			setQuantity("");
			setGrams("");
			setMls("");
			return;
		}

		const num = parseFloat(val);
		if (isNaN(num)) return;

		if (item.price > 0) {
			const calcQty = round2(num / item.price);
			if (item.unit === "piece" || item.unit === "package") {
				const wholeQty = Math.max(1, Math.floor(calcQty));
				setQuantity(wholeQty.toString());
			} else {
				setQuantity(calcQty.toFixed(2));
				if (item.unit === "kilo") {
					setGrams(Math.round(calcQty * 1000).toString());
				} else if (item.unit === "liter") {
					setMls(Math.round(calcQty * 1000).toString());
				}
			}
		}
	};

	// Modificar gramos directamente
	const handleGramsChange = (val: string) => {
		setGrams(val);

		if (!val || val === "") {
			setQuantity("");
			setAmount("");
			return;
		}

		const g = parseFloat(val);
		if (isNaN(g)) return;

		const kg = round2(g / 1000);
		setQuantity(kg.toFixed(2));
		const calcAmount = round2(kg * item.price);
		setAmount(calcAmount.toFixed(2));
	};

	// Modificar mililitros directamente
	const handleMlsChange = (val: string) => {
		setMls(val);

		if (!val || val === "") {
			setQuantity("");
			setAmount("");
			return;
		}

		const ml = parseFloat(val);
		if (isNaN(ml)) return;

		const l = round2(ml / 1000);
		setQuantity(l.toFixed(2));
		const calcAmount = round2(l * item.price);
		setAmount(calcAmount.toFixed(2));
	};

	// Accesos rápidos por importe ($)
	const applyAmount = (monto: number) => {
		setAmount(monto.toFixed(2));
		if (item.price > 0) {
			const calcQty = round2(monto / item.price);
			if (item.unit === "piece" || item.unit === "package") {
				const wholeQty = Math.max(1, Math.floor(calcQty));
				setQuantity(wholeQty.toString());
			} else {
				setQuantity(calcQty.toFixed(2));
				if (item.unit === "kilo") {
					setGrams(Math.round(calcQty * 1000).toString());
				} else if (item.unit === "liter") {
					setMls(Math.round(calcQty * 1000).toString());
				}
			}
		}
	};

	// Accesos rápidos por cantidad
	const applyQuantity = (qty: number) => {
		const cleanQty = round2(qty);
		setQuantity(
			item.unit === "piece" || item.unit === "package"
				? Math.round(cleanQty).toString()
				: cleanQty.toFixed(2),
		);
		const calcAmount = round2(cleanQty * item.price);
		setAmount(calcAmount.toFixed(2));

		if (item.unit === "kilo") {
			setGrams(Math.round(cleanQty * 1000).toString());
		} else if (item.unit === "liter") {
			setMls(Math.round(cleanQty * 1000).toString());
		}
	};

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		const num = parseFloat(quantity) || 0;
		if (num <= 0) return;

		const cleanQty =
			item.unit === "piece" || item.unit === "package"
				? Math.max(1, Math.round(num))
				: round2(num);

		onSave(item.id, cleanQty);
	};

	const currentQtyNum = parseFloat(quantity) || 0;

	return (
		<form onSubmit={handleSave} className="space-y-5">
			{/* Información del producto y precio */}
			<div className="flex items-center justify-between text-xs px-1 text-muted-foreground border-b pb-2">
				<span>
					Precio:{" "}
					<strong className="text-foreground font-semibold">
						{formatCurrency(item.price)}
					</strong>{" "}
					/{" "}
					{item.unit === "kilo"
						? "kg"
						: item.unit === "liter"
							? "litro"
							: item.unit === "piece"
								? "pieza"
								: "paquete"}
				</span>
				{parseFloat(amount) > 0 && (
					<span>
						Total:{" "}
						<strong className="text-primary font-bold">
							{formatCurrency(parseFloat(amount))}
						</strong>
					</span>
				)}
			</div>

			{/* Inputs según el tipo de unidad */}
			{item.unit === "kilo" ? (
				<div className="grid grid-cols-3 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="amount" className="text-xs font-medium">
							Importe ($)
						</Label>
						<Input
							id="amount"
							type="number"
							step="0.01"
							placeholder="0.00"
							value={amount}
							onChange={(e) => handleAmountChange(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="grams" className="text-xs font-medium">
							Gramos (g)
						</Label>
						<Input
							id="grams"
							type="number"
							step="1"
							placeholder="0"
							value={grams}
							onChange={(e) => handleGramsChange(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="qty" className="text-xs font-medium">
							Kilos (kg)
						</Label>
						<Input
							id="qty"
							type="number"
							step="0.01"
							placeholder="0.00"
							value={quantity}
							onChange={(e) => handleQuantityChange(e.target.value)}
						/>
					</div>
				</div>
			) : item.unit === "liter" ? (
				<div className="grid grid-cols-3 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="amount" className="text-xs font-medium">
							Importe ($)
						</Label>
						<Input
							id="amount"
							type="number"
							step="0.01"
							placeholder="0.00"
							value={amount}
							onChange={(e) => handleAmountChange(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="mls" className="text-xs font-medium">
							Mililitros (ml)
						</Label>
						<Input
							id="mls"
							type="number"
							step="1"
							placeholder="0"
							value={mls}
							onChange={(e) => handleMlsChange(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="qty" className="text-xs font-medium">
							Litros (L)
						</Label>
						<Input
							id="qty"
							type="number"
							step="0.01"
							placeholder="0.00"
							value={quantity}
							onChange={(e) => handleQuantityChange(e.target.value)}
						/>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label htmlFor="qty" className="text-xs font-medium">
							Cantidad ({item.unit === "piece" ? "Piezas" : "Paquetes"})
						</Label>
						<Input
							id="qty"
							type="number"
							step="1"
							min="1"
							value={quantity}
							onChange={(e) => handleQuantityChange(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="amount" className="text-xs font-medium">
							Importe ($)
						</Label>
						<Input
							id="amount"
							type="number"
							step="0.01"
							value={amount}
							onChange={(e) => handleAmountChange(e.target.value)}
						/>
					</div>
				</div>
			)}

			{/* Indicador visual para báscula o volumen */}
			{item.unit === "kilo" && (
				<div className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Scale className="h-4 w-4 text-primary shrink-0" />
						<span className="text-xs">Para pesar en báscula:</span>
					</div>
					<div className="font-semibold text-foreground text-sm">
						{Math.round(currentQtyNum * 1000)} g
						<span className="text-xs text-muted-foreground ml-1.5 font-normal">
							({currentQtyNum.toFixed(2)} kg)
						</span>
					</div>
				</div>
			)}

			{item.unit === "liter" && (
				<div className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Droplets className="h-4 w-4 text-primary shrink-0" />
						<span className="text-xs">Volumen a despachar:</span>
					</div>
					<div className="font-semibold text-foreground text-sm">
						{Math.round(currentQtyNum * 1000)} ml
						<span className="text-xs text-muted-foreground ml-1.5 font-normal">
							({currentQtyNum.toFixed(2)} L)
						</span>
					</div>
				</div>
			)}

			{/* Accesos rápidos por dinero */}
			<div className="space-y-1.5">
				<span className="text-xs text-muted-foreground font-medium">
					Acceso rápido por dinero:
				</span>
				<div className="flex flex-wrap gap-1.5">
					{[10, 15, 20, 30, 50].map((val) => (
						<Button
							key={val}
							type="button"
							size="sm"
							variant="outline"
							className="h-7 text-xs px-2.5 bg-background"
							onClick={() => applyAmount(val)}
						>
							${val}
						</Button>
					))}
				</div>
			</div>

			{/* Accesos rápidos por cantidad / peso */}
			{item.unit === "kilo" && (
				<div className="space-y-1.5">
					<span className="text-xs text-muted-foreground font-medium">
						Acceso rápido por peso:
					</span>
					<div className="flex flex-wrap gap-1.5">
						{[
							{ label: "1/4 kg (250g)", qty: 0.25 },
							{ label: "1/2 kg (500g)", qty: 0.5 },
							{ label: "3/4 kg (750g)", qty: 0.75 },
							{ label: "1 kg", qty: 1 },
						].map((p) => (
							<Button
								key={p.qty}
								type="button"
								size="sm"
								variant="outline"
								className="h-7 text-xs px-2.5 bg-background"
								onClick={() => applyQuantity(p.qty)}
							>
								{p.label}
							</Button>
						))}
					</div>
				</div>
			)}

			{item.unit === "liter" && (
				<div className="space-y-1.5">
					<span className="text-xs text-muted-foreground font-medium">
						Acceso rápido por volumen:
					</span>
					<div className="flex flex-wrap gap-1.5">
						{[
							{ label: "250 ml", qty: 0.25 },
							{ label: "500 ml", qty: 0.5 },
							{ label: "750 ml", qty: 0.75 },
							{ label: "1 L", qty: 1 },
						].map((p) => (
							<Button
								key={p.qty}
								type="button"
								size="sm"
								variant="outline"
								className="h-7 text-xs px-2.5 bg-background"
								onClick={() => applyQuantity(p.qty)}
							>
								{p.label}
							</Button>
						))}
					</div>
				</div>
			)}

			{(item.unit === "piece" || item.unit === "package") && (
				<div className="space-y-1.5">
					<span className="text-xs text-muted-foreground font-medium">
						Acceso rápido por cantidad:
					</span>
					<div className="flex flex-wrap gap-1.5">
						{[1, 2, 3, 5, 10].map((qty) => (
							<Button
								key={qty}
								type="button"
								size="sm"
								variant="outline"
								className="h-7 text-xs px-2.5 bg-background"
								onClick={() => applyQuantity(qty)}
							>
								{qty} {item.unit === "piece" ? "pz" : "paq"}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Botones de acción */}
			<div className="flex gap-2 justify-end pt-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button
					type="submit"
					disabled={!parseFloat(quantity) || parseFloat(quantity) <= 0}
				>
					Guardar
				</Button>
			</div>
		</form>
	);
}
