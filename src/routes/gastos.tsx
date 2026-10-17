import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	Plus,
	Search,
	DollarSign,
	Calendar,
	Truck,
	User,
	Trash2,
	CreditCard,
	Banknote,
	ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ExpenseForm } from "@/features/expenses/expense-form";
import {
	getExpensesFn,
	createExpenseFn,
	deleteExpenseFn,
} from "@/server/expenses";
import { getSuppliersFn } from "@/server/suppliers";
import { getCurrentRegisterFn } from "@/server/registers";
import { type ExpenseFormValues } from "@/utils/validations";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/gastos")({
	component: RouteComponent,
	loader: async () => {
		const [expensesList, suppliersList, activeRegister] = await Promise.all([
			getExpensesFn(),
			getSuppliersFn(),
			getCurrentRegisterFn(),
		]);
		return {
			expenses: expensesList,
			suppliers: suppliersList,
			hasOpenRegister: !!activeRegister,
		};
	},
});

function RouteComponent() {
	const { expenses, suppliers, hasOpenRegister } = Route.useLoaderData();
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedPeriod, setSelectedPeriod] = useState<
		"all" | "week" | "month" | "year"
	>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const handleCreateExpense = async (formData: ExpenseFormValues) => {
		try {
			await createExpenseFn({ data: formData });
			toast.success("Gasto registrado exitosamente");
			setIsDialogOpen(false);
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al registrar gasto");
		}
	};

	const handleDelete = async (id: number, title: string) => {
		if (
			!confirm(
				`¿Estás seguro de eliminar el gasto "${title}"? Esta acción no se puede deshacer.`,
			)
		) {
			return;
		}

		try {
			await deleteExpenseFn({ data: { id } });
			toast.success("Gasto eliminado");
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error("Error al eliminar gasto");
		}
	};

	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - 7);
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfYear = new Date(now.getFullYear(), 0, 1);

	const filteredByPeriod = expenses.filter((e) => {
		const expenseDate = new Date(e.date);
		if (selectedPeriod === "week") return expenseDate >= startOfWeek;
		if (selectedPeriod === "month") return expenseDate >= startOfMonth;
		if (selectedPeriod === "year") return expenseDate >= startOfYear;
		return true;
	});

	const filteredExpenses = filteredByPeriod.filter((e) => {
		const q = search.toLowerCase();
		return (
			e.title.toLowerCase().includes(q) ||
			(e.description && e.description.toLowerCase().includes(q)) ||
			(e.supplierName && e.supplierName.toLowerCase().includes(q))
		);
	});

	const totalItems = filteredExpenses.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const paginatedExpenses = filteredExpenses.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	const totalAmount = filteredExpenses.reduce(
		(sum, e) => sum + Number(e.amount || 0),
		0,
	);
	const cashRegisterAmount = filteredExpenses
		.filter((e) => e.paymentMethod === "cash_register")
		.reduce((sum, e) => sum + Number(e.amount || 0), 0);

	const getPaymentMethodBadge = (method: string) => {
		switch (method) {
			case "cash_register":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
					>
						<Banknote className="size-3" /> Efectivo Caja
					</Badge>
				);
			case "transfer":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
					>
						<DollarSign className="size-3" /> Transferencia
					</Badge>
				);
			case "card":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
					>
						<CreditCard className="size-3" /> Tarjeta
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="gap-1">
						Otro
					</Badge>
				);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Gastos y Egresos</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Registro de salidas de dinero, compras y gastos operativos de la sucursal
					</p>
				</div>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					title="Registrar Nuevo Gasto"
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nuevo Gasto
						</Button>
					}
				>
					<ExpenseForm
						suppliers={suppliers}
						hasOpenRegister={hasOpenRegister}
						onSubmit={handleCreateExpense}
						onCancel={() => setIsDialogOpen(false)}
					/>
				</ResponsiveDialog>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Total Gastos {selectedPeriod === "all" ? "(General)" : `(Filtro)`}
						</CardTitle>
						<ArrowDownCircle className="size-4 text-destructive" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(totalAmount)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{filteredExpenses.length} gastos en este período
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Salidas de Efectivo (Caja)
						</CardTitle>
						<Banknote className="size-4 text-amber-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(cashRegisterAmount)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Descontados del balance de turnos de caja
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Pagos Bancarios / Tarjeta
						</CardTitle>
						<CreditCard className="size-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(totalAmount - cashRegisterAmount)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Operaciones externas a la caja física
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg w-fit">
					<Button
						variant={selectedPeriod === "all" ? "default" : "ghost"}
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setSelectedPeriod("all");
							setCurrentPage(1);
						}}
					>
						Todos
					</Button>
					<Button
						variant={selectedPeriod === "week" ? "default" : "ghost"}
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setSelectedPeriod("week");
							setCurrentPage(1);
						}}
					>
						Esta Semana
					</Button>
					<Button
						variant={selectedPeriod === "month" ? "default" : "ghost"}
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setSelectedPeriod("month");
							setCurrentPage(1);
						}}
					>
						Este Mes
					</Button>
					<Button
						variant={selectedPeriod === "year" ? "default" : "ghost"}
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setSelectedPeriod("year");
							setCurrentPage(1);
						}}
					>
						Este Año
					</Button>
				</div>

				<div className="relative w-full sm:w-72">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar por concepto o proveedor..."
						className="pl-8 bg-card"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
			</div>

			{/* Expenses Table */}
			<div className="rounded-lg border bg-card shadow-xs overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Fecha</TableHead>
							<TableHead>Concepto / Detalle</TableHead>
							<TableHead>Proveedor</TableHead>
							<TableHead>Método</TableHead>
							<TableHead className="text-right">Monto</TableHead>
							<TableHead>Registrado por</TableHead>
							<TableHead className="w-[60px] text-right"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedExpenses.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									{expenses.length === 0
										? "No hay gastos registrados en esta sucursal."
										: "No se encontraron gastos para el período o búsqueda seleccionada."}
								</TableCell>
							</TableRow>
						) : (
							paginatedExpenses.map((expense) => (
								<TableRow key={expense.id} className="hover:bg-muted/40">
									<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
										<div className="flex items-center gap-1.5">
											<Calendar className="size-3.5" />
											{new Date(expense.date).toLocaleDateString()}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-semibold text-foreground">
												{expense.title}
											</span>
											{expense.description && (
												<span className="text-xs text-muted-foreground line-clamp-1">
													{expense.description}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										{expense.supplierName ? (
											<Badge
												variant="secondary"
												className="gap-1 font-normal text-xs"
											>
												<Truck className="size-3" />
												{expense.supplierName}
											</Badge>
										) : (
											<span className="text-xs text-muted-foreground/60 italic">
												General
											</span>
										)}
									</TableCell>
									<TableCell>
										{getPaymentMethodBadge(expense.paymentMethod)}
									</TableCell>
									<TableCell className="text-right font-bold text-destructive">
										-{formatCurrency(Number(expense.amount))}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										<div className="flex items-center gap-1">
											<User className="size-3" />
											<span>{expense.userName || "Usuario"}</span>
										</div>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
											onClick={() => handleDelete(expense.id, expense.title)}
										>
											<Trash2 className="size-4" />
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
		</div>
	);
}
