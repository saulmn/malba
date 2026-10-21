import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { closeRegisterFn, getRegisterTotalsFn } from "@/server/registers";
import { formatCurrency } from "@/utils/format";

type CloseRegisterProps = {
	registerSessionId: number;
	startingBalance: number;
	onCancel: () => void;
};

export function CloseRegisterForm({
	registerSessionId,
	startingBalance,
	onCancel,
}: CloseRegisterProps) {
	const [physicalCash, setPhysicalCash] = useState("");
	const [loading, setLoading] = useState(false);
	const [totals, setTotals] = useState<{
		income: number;
		outcome: number;
		withdrawals: number;
		withdrawalsCount: number;
		expenses: number;
		withdrawalsList: any[];
	} | null>(null);
	const router = useRouter();

	useEffect(() => {
		getRegisterTotalsFn({ data: { registerSessionId } }).then((res) => {
			setTotals(res);
		});
	}, [registerSessionId]);

	const expectedTotal = totals
		? startingBalance + totals.income - totals.outcome
		: startingBalance;
	const diff = (parseFloat(physicalCash) || 0) - expectedTotal;

	const handleClose = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await closeRegisterFn({
				data: {
					registerSessionId,
					closingBalance: parseFloat(physicalCash) || 0,
					expectedBalance: expectedTotal,
					difference: diff,
				},
			});
			toast.success("Caja cerrada exitosamente", {
				description: `Diferencia: ${formatCurrency(diff)}`,
			});
			router.invalidate();
			onCancel();
		} catch (error) {
			toast.error("Error al cerrar caja");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleClose} className="space-y-4">
			<div className="bg-muted/50 p-4 rounded-md space-y-2 text-sm">
				<div className="flex justify-between">
					<span>Fondo Inicial:</span>
					<span className="font-medium">{formatCurrency(startingBalance)}</span>
				</div>
				<div className="flex justify-between text-green-600 font-medium">
					<span>Ventas en Efectivo:</span>
					<span>+ {formatCurrency(totals?.income || 0)}</span>
				</div>
				{totals && totals.expenses > 0 && (
					<div className="flex justify-between text-amber-600">
						<span>Gastos de Caja:</span>
						<span>- {formatCurrency(totals.expenses)}</span>
					</div>
				)}
				{totals && totals.withdrawals > 0 && (
					<div className="flex justify-between text-amber-600 font-medium">
						<span>Retiros de Efectivo ({totals.withdrawalsCount}):</span>
						<span>- {formatCurrency(totals.withdrawals)}</span>
					</div>
				)}
				<div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
					<span>Total Esperado en Caja:</span>
					<span className="font-mono">{formatCurrency(expectedTotal)}</span>
				</div>
			</div>

			{totals &&
				totals.withdrawalsList &&
				totals.withdrawalsList.length > 0 && (
					<div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs space-y-1.5">
						<span className="font-semibold text-amber-800 dark:text-amber-400 block">
							Detalle de Retiros en este turno:
						</span>
						<div className="space-y-1 max-h-32 overflow-y-auto">
							{totals.withdrawalsList.map((w: any) => (
								<div
									key={w.id}
									className="flex justify-between text-muted-foreground"
								>
									<span>
										{w.reason} {w.userName ? `(${w.userName})` : ""}:
									</span>
									<span className="font-bold text-amber-600">
										-{formatCurrency(Number(w.amount))}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

			<div className="space-y-2">
				<Label htmlFor="physical">Efectivo Fí­sico Contado ($)</Label>
				<Input
					id="physical"
					type="number"
					step="0.01"
					min="0"
					value={physicalCash}
					onChange={(e) => setPhysicalCash(e.target.value)}
					required
					autoFocus
				/>
			</div>

			{physicalCash && (
				<div
					className={`p-3 rounded-md text-sm font-medium ${diff < 0 ? "bg-red-100 text-red-700" : diff > 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
				>
					Descuadre:{" "}
					{diff === 0 ? "Caja Perfecta ($0.00)" : formatCurrency(diff)}
				</div>
			)}

			<div className="flex gap-2 justify-end pt-4">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" variant="destructive" disabled={loading}>
					Realizar Corte y Cerrar
				</Button>
			</div>
		</form>
	);
}
