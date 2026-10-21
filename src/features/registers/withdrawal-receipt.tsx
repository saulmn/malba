import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowDownLeft,
	Clock,
	Printer,
	User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";

interface WithdrawalReceiptProps {
	withdrawal: {
		id: number;
		amount: string | number;
		reason: string;
		description?: string | null;
		balanceBefore: string | number;
		balanceAfter: string | number;
		createdAt: string | Date;
		userName?: string | null;
		registerSessionId?: number;
	};
	onClose?: () => void;
}

export function WithdrawalReceipt({
	withdrawal,
	onClose,
}: WithdrawalReceiptProps) {
	const handlePrint = () => {
		if (typeof window !== "undefined") {
			window.print();
		}
	};

	const formattedDate = format(
		new Date(withdrawal.createdAt),
		"dd 'de' MMMM 'de' yyyy, hh:mm a",
		{ locale: es },
	);

	return (
		<div className="space-y-6">
			{/* Ticket Container */}
			<div
				id="printable-receipt"
				className="border rounded-xl p-6 bg-card text-card-foreground shadow-xs space-y-5 print:border-none print:shadow-none print:p-0"
			>
				{/* Header */}
				<div className="text-center border-b pb-4 space-y-1">
					<div className="flex items-center justify-center gap-1.5 text-primary font-bold text-lg">
						<ArrowDownLeft className="size-5 text-amber-600" />
						COMPROBANTE DE RETIRO DE CAJA
					</div>
					<p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
						Punto de Venta Malba
					</p>
					<div className="inline-block bg-muted px-2.5 py-0.5 rounded-full text-xs font-mono font-bold mt-1">
						Folio #{String(withdrawal.id).padStart(5, "0")}
					</div>
				</div>

				{/* Amount Highlight */}
				<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
					<span className="text-xs text-amber-700 dark:text-amber-400 uppercase font-semibold">
						Monto Retirado de Caja
					</span>
					<div className="text-3xl font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">
						- {formatCurrency(Number(withdrawal.amount))}
					</div>
				</div>

				{/* Key Data Grid */}
				<div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
					<div className="bg-muted/40 p-3 rounded-lg space-y-0.5">
						<span className="text-muted-foreground text-xs">Fecha y Hora</span>
						<p className="font-semibold text-foreground flex items-center gap-1.5">
							<Clock className="size-3.5 text-muted-foreground" />
							{formattedDate}
						</p>
					</div>

					<div className="bg-muted/40 p-3 rounded-lg space-y-0.5">
						<span className="text-muted-foreground text-xs">
							Quién Retira (Cajero)
						</span>
						<p className="font-semibold text-foreground flex items-center gap-1.5 truncate">
							<User className="size-3.5 text-muted-foreground shrink-0" />
							{withdrawal.userName || "Usuario del Sistema"}
						</p>
					</div>

					<div className="bg-muted/40 p-3 rounded-lg space-y-0.5 col-span-2">
						<span className="text-muted-foreground text-xs">
							Motivo / Concepto
						</span>
						<p className="font-semibold text-foreground">{withdrawal.reason}</p>
					</div>

					{withdrawal.description && (
						<div className="bg-muted/40 p-3 rounded-lg space-y-0.5 col-span-2">
							<span className="text-muted-foreground text-xs">
								Para qué / Observaciones
							</span>
							<p className="text-foreground italic">
								"{withdrawal.description}"
							</p>
						</div>
					)}
				</div>

				{/* Cash Balance Breakdown */}
				<div className="border rounded-lg p-3 bg-muted/20 space-y-1.5 text-xs">
					<div className="flex justify-between text-muted-foreground">
						<span>Saldo en caja antes del retiro:</span>
						<span className="font-medium text-foreground">
							{formatCurrency(Number(withdrawal.balanceBefore))}
						</span>
					</div>
					<div className="flex justify-between text-amber-600 font-medium">
						<span>Monto retirado:</span>
						<span>- {formatCurrency(Number(withdrawal.amount))}</span>
					</div>
					<div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
						<span>Saldo restante en caja:</span>
						<span className="text-emerald-600 font-mono">
							{formatCurrency(Number(withdrawal.balanceAfter))}
						</span>
					</div>
				</div>

				{/* Signature Lines */}
				<div className="grid grid-cols-2 gap-6 pt-6 mt-4 border-t border-dashed">
					<div className="text-center space-y-1">
						<div className="border-b border-foreground/30 h-8" />
						<p className="text-[11px] font-semibold text-muted-foreground">
							Entregó (Cajero / Responsable)
						</p>
					</div>
					<div className="text-center space-y-1">
						<div className="border-b border-foreground/30 h-8" />
						<p className="text-[11px] font-semibold text-muted-foreground">
							Recibió (Gerencia / Propietario)
						</p>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 print:hidden">
				{onClose && (
					<Button variant="outline" onClick={onClose}>
						Cerrar
					</Button>
				)}
				<Button onClick={handlePrint} className="flex items-center gap-2">
					<Printer className="size-4" />
					Imprimir Comprobante
				</Button>
			</div>
		</div>
	);
}
