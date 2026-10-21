import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertTriangle,
	ArrowDownLeft,
	ArrowUpRight,
	CheckCircle2,
	Clock,
	DollarSign,
	History,
	Printer,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	createCashWithdrawalFn,
	getCashWithdrawalsFn,
	getDrawerCashStatusFn,
} from "@/server/withdrawals";
import { formatCurrency } from "@/utils/format";
import { WithdrawalReceipt } from "./withdrawal-receipt";

const COMMON_REASONS = [
	"Exceso de efectivo (Traslado a caja fuerte / Bóveda)",
	"Depósito en cuenta bancaria",
	"Entrega a gerencia / administración",
	"Pago urgente a proveedor o servicio",
	"Cambio de denominaciones (Morralla)",
	"Otro motivo",
];

interface CashWithdrawalDialogProps {
	registerSessionId?: number;
	onSuccess?: () => void;
	onClose?: () => void;
}

export function CashWithdrawalDialog({
	registerSessionId,
	onSuccess,
	onClose,
}: CashWithdrawalDialogProps) {
	const router = useRouter();

	const [activeTab, setActiveTab] = useState<"form" | "history">("form");
	const [loading, setLoading] = useState(false);
	const [drawerData, setDrawerData] = useState<any | null>(null);
	const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);

	// Form State
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState(COMMON_REASONS[0]);
	const [customReason, setCustomReason] = useState("");
	const [description, setDescription] = useState("");

	// Receipt preview after successful submit or on click in history
	const [receiptToView, setReceiptToView] = useState<any | null>(null);

	const loadData = async () => {
		try {
			const status = await getDrawerCashStatusFn({
				data: { registerSessionId },
			});
			setDrawerData(status);

			if (status?.currentRegister?.id) {
				const list = await getCashWithdrawalsFn({
					data: { registerSessionId: status.currentRegister.id },
				});
				setWithdrawalsList(list);
			}
		} catch (error) {
			console.error("Error loading drawer status:", error);
		}
	};

	useEffect(() => {
		loadData();
	}, [registerSessionId]);

	const currentCash = Number(drawerData?.currentCashInDrawer || 0);
	const numericAmount = parseFloat(amount) || 0;
	const balanceAfter = currentCash - numericAmount;
	const isExceeding = numericAmount > currentCash;
	const isValid = numericAmount > 0 && !isExceeding;

	const handlePresetAmount = (preset: number) => {
		setAmount(preset.toString());
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid) return;

		setLoading(true);
		try {
			const effectiveReason =
				reason === "Otro motivo" && customReason.trim()
					? customReason.trim()
					: reason;

			const created = await createCashWithdrawalFn({
				data: {
					amount: numericAmount,
					reason: effectiveReason,
					description: description.trim() || undefined,
					registerSessionId: drawerData?.currentRegister?.id,
				},
			});

			toast.success("Retiro de caja registrado exitosamente", {
				description: `Monto: ${formatCurrency(numericAmount)} | Quedan en caja: ${formatCurrency(balanceAfter)}`,
			});

			router.invalidate();
			if (onSuccess) onSuccess();

			// Show receipt view
			setReceiptToView({
				...created,
				userName: drawerData?.user?.name || created.userName,
			});

			// Reset form & reload status
			setAmount("");
			setDescription("");
			loadData();
		} catch (error: any) {
			toast.error(error?.message || "Error al registrar retiro");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	// If currently viewing a receipt:
	if (receiptToView) {
		return (
			<WithdrawalReceipt
				withdrawal={receiptToView}
				onClose={() => {
					setReceiptToView(null);
					if (onClose) onClose();
				}}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{/* Tabs Header */}
			<div className="flex border-b">
				<button
					type="button"
					onClick={() => setActiveTab("form")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
						activeTab === "form"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					<ArrowUpRight className="size-4" />
					Nuevo Retiro
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("history")}
					className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
						activeTab === "history"
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					<History className="size-4" />
					Retiros del Turno
					{withdrawalsList.length > 0 && (
						<Badge variant="secondary" className="px-1.5 py-0 text-xs">
							{withdrawalsList.length}
						</Badge>
					)}
				</button>
			</div>

			{activeTab === "form" ? (
				<form onSubmit={handleSubmit} className="space-y-4 pt-1">
					{/* Current Drawer Status Card */}
					<div className="bg-muted/40 border rounded-xl p-4 space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
								Efectivo Disponible en Caja
							</span>
							<Badge
								variant={currentCash > 0 ? "default" : "destructive"}
								className="text-xs"
							>
								{currentCash > 0 ? "Caja Activa" : "Sin Efectivo"}
							</Badge>
						</div>

						<div className="text-3xl font-bold text-foreground">
							{formatCurrency(currentCash)}
						</div>

						{drawerData && (
							<div className="grid grid-cols-3 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
								<div>
									<span>Fondo: </span>
									<span className="font-medium text-foreground">
										{formatCurrency(drawerData.startingBalance)}
									</span>
								</div>
								<div>
									<span>Ventas (+): </span>
									<span className="font-medium text-emerald-600">
										+{formatCurrency(drawerData.salesCash)}
									</span>
								</div>
								<div>
									<span>Salidas (-): </span>
									<span className="font-medium text-amber-600">
										-
										{formatCurrency(
											drawerData.expensesCash + drawerData.withdrawalsCash,
										)}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Amount Input */}
					<div className="space-y-2">
						<Label htmlFor="withdrawal-amount">Monto a Retirar ($)</Label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
								$
							</span>
							<Input
								id="withdrawal-amount"
								type="number"
								step="0.01"
								min="0.01"
								max={currentCash > 0 ? currentCash : undefined}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								className="pl-7 font-mono text-base font-semibold"
								required
								autoFocus
							/>
						</div>

						{/* Quick Amount Buttons */}
						{currentCash > 0 && (
							<div className="flex flex-wrap gap-1.5 pt-1">
								{[100, 200, 500, 1000, 2000]
									.filter((p) => p <= currentCash)
									.map((preset) => (
										<Button
											key={preset}
											type="button"
											variant="secondary"
											size="xs"
											className="text-xs px-2 py-1 h-7"
											onClick={() => handlePresetAmount(preset)}
										>
											+${preset}
										</Button>
									))}
							</div>
						)}
					</div>

					{/* Balance After Preview */}
					{numericAmount > 0 && (
						<div
							className={`p-3 rounded-lg text-sm border flex items-center justify-between ${
								isExceeding
									? "bg-destructive/10 border-destructive/20 text-destructive"
									: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
							}`}
						>
							<div className="flex items-center gap-2">
								{isExceeding ? (
									<AlertTriangle className="size-4 shrink-0" />
								) : (
									<CheckCircle2 className="size-4 shrink-0" />
								)}
								<span>
									{isExceeding
										? "El monto supera el efectivo en caja"
										: "Quedará en caja tras el retiro:"}
								</span>
							</div>
							<span className="font-bold font-mono">
								{formatCurrency(balanceAfter)}
							</span>
						</div>
					)}

					{/* Reason Select */}
					<div className="space-y-2">
						<Label>Motivo del Retiro</Label>
						<Select value={reason} onValueChange={setReason}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecciona el motivo" />
							</SelectTrigger>
							<SelectContent>
								{COMMON_REASONS.map((r) => (
									<SelectItem key={r} value={r}>
										{r}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{reason === "Otro motivo" && (
						<div className="space-y-2">
							<Label htmlFor="custom-reason">
								Escribe el motivo específico
							</Label>
							<Input
								id="custom-reason"
								value={customReason}
								onChange={(e) => setCustomReason(e.target.value)}
								placeholder="Ej: Pago de flete, préstamo temporal..."
								required
							/>
						</div>
					)}

					{/* Description / Notes */}
					<div className="space-y-2">
						<Label htmlFor="description">
							Para qué / Observaciones adicionales{" "}
							<span className="text-muted-foreground font-normal text-xs">
								(Opcional)
							</span>
						</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Detalla quién recibe o el número de folio/depósito si aplica..."
							rows={2}
							className="resize-none text-sm"
						/>
					</div>

					{/* Registered By Info */}
					<div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md">
						<User className="size-3.5 shrink-0" />
						<span>
							Registrado bajo la sesión de:{" "}
							<strong className="text-foreground">
								{drawerData?.user?.name || "Usuario activo"}
							</strong>
						</span>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-3">
						{onClose && (
							<Button type="button" variant="outline" onClick={onClose}>
								Cancelar
							</Button>
						)}
						<Button
							type="submit"
							disabled={loading || !isValid}
							className="flex items-center gap-2"
						>
							<ArrowUpRight className="size-4" />
							{loading ? "Registrando..." : "Confirmar y Retirar"}
						</Button>
					</div>
				</form>
			) : (
				/* History Tab */
				<div className="space-y-4 pt-1">
					{withdrawalsList.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground text-sm">
							No se han realizado retiros en este turno de caja.
						</div>
					) : (
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Hora</TableHead>
										<TableHead>Monto</TableHead>
										<TableHead>Motivo / Para qué</TableHead>
										<TableHead>Quedó en caja</TableHead>
										<TableHead className="text-right">Comprobante</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{withdrawalsList.map((w) => (
										<TableRow key={w.id}>
											<TableCell className="font-medium text-xs whitespace-nowrap">
												{format(new Date(w.createdAt), "hh:mm a", {
													locale: es,
												})}
											</TableCell>
											<TableCell className="font-bold text-amber-600 whitespace-nowrap">
												-{formatCurrency(Number(w.amount))}
											</TableCell>
											<TableCell className="text-xs">
												<div className="font-medium">{w.reason}</div>
												{w.description && (
													<div className="text-muted-foreground italic truncate max-w-[200px]">
														"{w.description}"
													</div>
												)}
											</TableCell>
											<TableCell className="text-xs font-mono text-emerald-600 whitespace-nowrap">
												{formatCurrency(Number(w.balanceAfter))}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="xs"
													onClick={() => setReceiptToView(w)}
													className="h-7 text-xs flex items-center gap-1.5"
												>
													<Printer className="size-3" />
													Ver
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					<div className="flex justify-end pt-2">
						{onClose && (
							<Button variant="outline" onClick={onClose}>
								Cerrar
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
