import { useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { formatCurrency, formatQuantity } from "@/utils/format";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "@tanstack/react-router";
import {
	Search,
	DollarSign,
	Receipt,
	User,
	Users,
	Clock,
	Calendar,
	Eye,
	ShoppingBag,
	Store,
	UserCheck,
} from "lucide-react";

export type SalePeriod =
	| "today"
	| "yesterday"
	| "week"
	| "month"
	| "year"
	| "all";

interface CashierUser {
	id: number;
	name: string;
	username: string | null;
}

interface SalesHistoryScreenProps {
	currentUser: any;
	sales: any[];
	cashiers?: CashierUser[];
	currentPeriod: SalePeriod;
	currentUserId?: string;
	activeWorkspaceName?: string;
	userId?: number; // backwards compatibility
}

export function SalesHistoryScreen({
	currentUser,
	sales,
	cashiers = [],
	currentPeriod = "today",
	currentUserId = "all",
	activeWorkspaceName,
}: SalesHistoryScreenProps) {
	const navigate = useNavigate({ from: "/mis-ventas" });

	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [selectedSale, setSelectedSale] = useState<any | null>(null);

	const handlePeriodChange = (val: SalePeriod) => {
		setCurrentPage(1);
		navigate({
			search: (prev: any) => ({ ...prev, period: val }),
		});
	};

	const handleCashierChange = (val: string) => {
		setCurrentPage(1);
		navigate({
			search: (prev: any) => ({ ...prev, userId: val }),
		});
	};

	// Client-side text filter on the loaded period & cashier sales
	const filteredSales = sales.filter((sale) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase().trim();
		const idMatch =
			String(sale.id).includes(q) || `#${sale.id}`.includes(q);
		const itemsMatch = sale.itemsSummary?.toLowerCase().includes(q);
		const cashierMatch = sale.userName?.toLowerCase().includes(q);
		const customerMatch = sale.customerName?.toLowerCase().includes(q);

		return idMatch || itemsMatch || cashierMatch || customerMatch;
	});

	// Calculations
	const totalAmount = filteredSales.reduce(
		(acc, sale) => acc + Number(sale.total || 0),
		0,
	);
	const totalItems = filteredSales.length;
	const averageTicket = totalItems > 0 ? totalAmount / totalItems : 0;

	// Pagination
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const paginatedSales = filteredSales.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	return (
		<div className="flex flex-col gap-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Registro y consulta de tickets de todos los cajeros en{" "}
						<span className="font-medium text-foreground">
							{activeWorkspaceName || "la sucursal"}
						</span>
					</p>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Venta Total</CardTitle>
						<DollarSign className="size-4 text-emerald-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{formatCurrency(totalAmount)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							En el período seleccionado
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Tickets Cobrados
						</CardTitle>
						<Receipt className="size-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">{totalItems}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Operaciones de venta finalizadas
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
						<ShoppingBag className="size-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{formatCurrency(averageTicket)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Promedio facturado por ticket
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters Bar */}
			<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-3">
					{/* Period Selector */}
					<div className="w-44">
						<Select
							value={currentPeriod}
							onValueChange={(v) => handlePeriodChange(v as SalePeriod)}
						>
							<SelectTrigger className="h-9 text-xs">
								<SelectValue placeholder="Periodo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="today">Hoy</SelectItem>
								<SelectItem value="yesterday">Ayer</SelectItem>
								<SelectItem value="week">Esta semana</SelectItem>
								<SelectItem value="month">Este mes</SelectItem>
								<SelectItem value="year">Este año</SelectItem>
								<SelectItem value="all">Todo el historial</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Cashier / User Filter */}
					<div className="w-48">
						<Select
							value={currentUserId || "all"}
							onValueChange={handleCashierChange}
						>
							<SelectTrigger className="h-9 text-xs">
								<SelectValue placeholder="Todos los cajeros" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los cajeros</SelectItem>
								{cashiers.map((cashier) => (
									<SelectItem key={cashier.id} value={String(cashier.id)}>
										{cashier.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Text search */}
				<div className="relative w-full md:w-80">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar por #Ticket, artículo o cliente..."
						className="pl-8 h-9 text-xs bg-card"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
			</div>

			{/* Transactions Table */}
			<div className="rounded-lg border bg-card shadow-xs overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Ticket #</TableHead>
							<TableHead>Fecha y Hora</TableHead>
							<TableHead>Cajero</TableHead>
							<TableHead>Cliente</TableHead>
							<TableHead>Artículos Vendidos</TableHead>
							<TableHead className="text-right">Monto Total</TableHead>
							<TableHead className="w-[80px] text-right">Detalle</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedSales.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-12 text-muted-foreground"
								>
									{sales.length === 0
										? "No hay ventas registradas para el período y filtros seleccionados."
										: "No se encontraron tickets que coincidan con la búsqueda."}
								</TableCell>
							</TableRow>
						) : (
							paginatedSales.map((sale) => (
								<TableRow
									key={sale.id}
									className="hover:bg-muted/40 transition-colors"
								>
									{/* Ticket ID */}
									<TableCell>
										<Badge
											variant="outline"
											className="font-mono font-bold text-xs bg-muted/20 text-foreground"
										>
											#{sale.id}
										</Badge>
									</TableCell>

									{/* Date & Time */}
									<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
										<div className="flex flex-col">
											<span className="font-medium text-foreground">
												{format(
													new Date(sale.createdAt),
													"dd 'de' MMMM, yyyy",
													{ locale: es },
												)}
											</span>
											<span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
												<Clock className="size-3" />
												{format(new Date(sale.createdAt), "hh:mm a")}
											</span>
										</div>
									</TableCell>

									{/* Cashier */}
									<TableCell className="text-xs">
										<div className="flex items-center gap-1.5">
											<User className="size-3.5 text-muted-foreground" />
											<span className="font-medium text-foreground">
												{sale.userName}
											</span>
										</div>
									</TableCell>

									{/* Customer */}
									<TableCell className="text-xs text-muted-foreground">
										{sale.customerName ? (
											<div className="flex items-center gap-1 text-foreground font-medium">
												<UserCheck className="size-3.5 text-primary" />
												<span>{sale.customerName}</span>
											</div>
										) : (
											<span className="text-muted-foreground/60 italic">
												Público general
											</span>
										)}
									</TableCell>

									{/* Items summary */}
									<TableCell className="max-w-md">
										<div className="text-xs text-foreground line-clamp-2">
											{sale.itemsSummary || sale.description}
										</div>
									</TableCell>

									{/* Total */}
									<TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
										+{formatCurrency(Number(sale.total))}
									</TableCell>

									{/* Action button */}
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="h-8 gap-1 text-xs"
											onClick={() => setSelectedSale(sale)}
										>
											<Eye className="size-3.5" />
											<span className="sr-only sm:not-sr-only">Ver</span>
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				<DataTablePagination
					currentPage={currentPage}
					totalPages={totalPages}
					pageSize={pageSize}
					totalItems={totalItems}
					onPageChange={setCurrentPage}
					onPageSizeChange={(newSize) => {
						setPageSize(newSize);
						setCurrentPage(1);
					}}
				/>
			</div>

			{/* Ticket Detail Dialog */}
			<ResponsiveDialog
				open={!!selectedSale}
				onOpenChange={(open) => {
					if (!open) setSelectedSale(null);
				}}
				title={selectedSale ? `Ticket #${selectedSale.id}` : "Detalle de Venta"}
			>
				{selectedSale && (
					<div className="space-y-4">
						{/* Metadata Header */}
						<div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-xs border">
							<div>
								<span className="text-muted-foreground block text-[11px]">
									Fecha y Hora:
								</span>
								<span className="font-medium text-foreground">
									{format(
										new Date(selectedSale.createdAt),
										"dd/MM/yyyy hh:mm a",
									)}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px]">
									Atendido por (Cajero):
								</span>
								<span className="font-medium text-foreground">
									{selectedSale.userName}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px]">
									Cliente:
								</span>
								<span className="font-medium text-foreground">
									{selectedSale.customerName || "Público General"}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px]">
									Sesión de Caja:
								</span>
								<span className="font-medium text-foreground">
									#{selectedSale.registerSessionId}
								</span>
							</div>
						</div>

						{/* Items breakdown */}
						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader className="bg-muted/50">
									<TableRow>
										<TableHead className="text-xs">Cant.</TableHead>
										<TableHead className="text-xs">Producto</TableHead>
										<TableHead className="text-xs text-right">Precio</TableHead>
										<TableHead className="text-xs text-right">Subtotal</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{selectedSale.items && selectedSale.items.length > 0 ? (
										selectedSale.items.map((it: any) => (
											<TableRow key={it.id} className="text-xs">
												<TableCell className="font-semibold">
													{formatQuantity(it.quantity, it.unit || "piece")}
												</TableCell>
												<TableCell className="font-medium">
													{it.productName || "Producto"}
												</TableCell>
												<TableCell className="text-right text-muted-foreground">
													{formatCurrency(Number(it.price))}
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(Number(it.price) * Number(it.quantity))}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-xs text-muted-foreground py-4 text-center"
											>
												{selectedSale.description || "Venta POS"}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>

						{/* Total banner */}
						<div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
							<span className="font-bold text-base text-foreground">
								Total de la Venta:
							</span>
							<span className="font-extrabold text-2xl text-primary">
								{formatCurrency(Number(selectedSale.total))}
							</span>
						</div>

						<div className="flex justify-end pt-2">
							<Button
								variant="outline"
								onClick={() => setSelectedSale(null)}
								className="text-xs"
							>
								Cerrar
							</Button>
						</div>
					</div>
				)}
			</ResponsiveDialog>
		</div>
	);
}

// Backwards-compatible alias
export const MySalesScreen = SalesHistoryScreen;
