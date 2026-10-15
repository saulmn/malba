import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import {
	ArrowDownRight,
	ArrowUpRight,
	DollarSign,
	Activity,
	Truck,
	Users,
	Calendar,
	TrendingUp,
	TrendingDown,
	Wallet,
} from "lucide-react";

export function DashboardScreen({ data }: { data: any }) {
	const {
		income,
		totalExpenses,
		netIncome,
		expensesByPeriod,
		topSuppliers,
		topCustomers,
		recentTransactions,
		recentExpenses,
		totalProducts,
		lowStockProducts,
	} = data;

	const maxSupplierTotal = Math.max(
		...topSuppliers.map((s: any) => s.total || 0),
		1,
	);
	const maxCustomerTotal = Math.max(
		...topCustomers.map((c: any) => c.total || 0),
		1,
	);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard & Analíticas</h1>
				<p className="text-sm text-muted-foreground mt-0.5">
					Métricas financieras, proveedores clave y clientes frecuentes de esta sucursal
				</p>
			</div>

			{/* Main Financial KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Margen Neto</CardTitle>
						<Wallet className="h-4 w-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div
							className={`text-2xl font-bold ${netIncome >= 0 ? "text-emerald-600" : "text-destructive"}`}
						>
							{formatCurrency(netIncome)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Ventas menos gastos totales
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
						<ArrowUpRight className="h-4 w-4 text-emerald-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-emerald-600">
							{formatCurrency(income)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Ingresos por ventas en POS
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Gastos y Compras</CardTitle>
						<ArrowDownRight className="h-4 w-4 text-rose-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-rose-600">
							{formatCurrency(totalExpenses)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Egresos de caja y compras a proveedores
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Inventario Activo</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalProducts}</div>
						<p className="text-xs text-muted-foreground mt-1">
							{lowStockProducts > 0 ? (
								<span className="text-amber-600 font-medium">
									{lowStockProducts} con stock bajo
								</span>
							) : (
								"Niveles de stock óptimos"
							)}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Expenses Period Breakdown Cards */}
			<div className="rounded-xl border bg-card p-5 shadow-xs">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Calendar className="size-4 text-primary" />
						<h3 className="font-semibold text-base">Evolución de Gastos por Período</h3>
					</div>
					<Badge variant="outline" className="text-xs">
						Sucursal Activa
					</Badge>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="bg-muted/40 p-3 rounded-lg border">
						<span className="text-xs text-muted-foreground">Últimos 7 Días</span>
						<p className="text-lg font-bold text-foreground mt-1">
							{formatCurrency(expensesByPeriod?.week || 0)}
						</p>
					</div>
					<div className="bg-muted/40 p-3 rounded-lg border">
						<span className="text-xs text-muted-foreground">Mes Actual</span>
						<p className="text-lg font-bold text-foreground mt-1">
							{formatCurrency(expensesByPeriod?.month || 0)}
						</p>
					</div>
					<div className="bg-muted/40 p-3 rounded-lg border">
						<span className="text-xs text-muted-foreground">Mes Anterior</span>
						<p className="text-lg font-bold text-foreground mt-1">
							{formatCurrency(expensesByPeriod?.lastMonth || 0)}
						</p>
					</div>
					<div className="bg-muted/40 p-3 rounded-lg border">
						<span className="text-xs text-muted-foreground">Gasto Histórico</span>
						<p className="text-lg font-bold text-foreground mt-1">
							{formatCurrency(expensesByPeriod?.allTime || 0)}
						</p>
					</div>
				</div>
			</div>

			{/* Two Column Section: Top Suppliers & Top Customers */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top Suppliers */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div className="flex items-center gap-2">
							<Truck className="size-4 text-primary" />
							<CardTitle className="text-base font-semibold">
								Proveedores con Mayor Compra
							</CardTitle>
						</div>
						<Badge variant="secondary" className="text-xs">
							Top 5
						</Badge>
					</CardHeader>
					<CardContent className="space-y-4">
						{topSuppliers.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								No hay compras registradas a proveedores aún.
							</div>
						) : (
							topSuppliers.map((supplier: any, index: number) => {
								const percentage = Math.round(
									(supplier.total / maxSupplierTotal) * 100,
								);
								return (
									<div key={supplier.id} className="space-y-1.5">
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2 font-medium">
												<span className="text-xs text-muted-foreground w-4">
													#{index + 1}
												</span>
												<span className="truncate max-w-[200px]">
													{supplier.name}
												</span>
												<span className="text-xs text-muted-foreground">
													({supplier.count} gastos)
												</span>
											</div>
											<span className="font-bold text-foreground">
												{formatCurrency(supplier.total)}
											</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
											<div
												className="bg-primary h-2 rounded-full transition-all duration-500"
												style={{ width: `${percentage}%` }}
											/>
										</div>
									</div>
								);
							})
						)}
					</CardContent>
				</Card>

				{/* Top Customers */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<div className="flex items-center gap-2">
							<Users className="size-4 text-emerald-600" />
							<CardTitle className="text-base font-semibold">
								Clientes más Frecuentes
							</CardTitle>
						</div>
						<Badge variant="secondary" className="text-xs">
							Top 5
						</Badge>
					</CardHeader>
					<CardContent className="space-y-4">
						{topCustomers.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								Aún no hay ventas asignadas a clientes registrados.
							</div>
						) : (
							topCustomers.map((customer: any, index: number) => {
								const percentage = Math.round(
									(customer.total / maxCustomerTotal) * 100,
								);
								return (
									<div key={customer.id} className="space-y-1.5">
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2 font-medium">
												<span className="text-xs text-muted-foreground w-4">
													#{index + 1}
												</span>
												<span className="truncate max-w-[200px]">
													{customer.name}
												</span>
												<span className="text-xs text-muted-foreground">
													({customer.count} compras)
												</span>
											</div>
											<span className="font-bold text-emerald-600">
												{formatCurrency(customer.total)}
											</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
											<div
												className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
												style={{ width: `${percentage}%` }}
											/>
										</div>
									</div>
								);
							})
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity Tables */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Sales */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base font-semibold">
								Últimas Ventas en Caja
							</CardTitle>
							<TrendingUp className="size-4 text-emerald-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="border rounded-md overflow-hidden">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/30 border-b text-xs">
									<tr>
										<th className="px-3 py-2 font-medium">Hora</th>
										<th className="px-3 py-2 font-medium">Cliente</th>
										<th className="px-3 py-2 font-medium text-right">Total</th>
									</tr>
								</thead>
								<tbody className="divide-y text-xs">
									{recentTransactions.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="px-3 py-6 text-center text-muted-foreground"
											>
												Sin ventas recientes
											</td>
										</tr>
									) : (
										recentTransactions.map((tx: any) => (
											<tr key={tx.id} className="hover:bg-muted/40">
												<td className="px-3 py-2.5 text-muted-foreground">
													{new Date(tx.createdAt).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</td>
												<td className="px-3 py-2.5 font-medium">
													{tx.customerName || "Público General"}
												</td>
												<td className="px-3 py-2.5 text-right font-bold text-emerald-600">
													+{formatCurrency(Number(tx.total))}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* Recent Expenses */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base font-semibold">
								Últimos Gastos Registrados
							</CardTitle>
							<TrendingDown className="size-4 text-rose-500" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="border rounded-md overflow-hidden">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/30 border-b text-xs">
									<tr>
										<th className="px-3 py-2 font-medium">Fecha</th>
										<th className="px-3 py-2 font-medium">Concepto</th>
										<th className="px-3 py-2 font-medium">Proveedor</th>
										<th className="px-3 py-2 font-medium text-right">Monto</th>
									</tr>
								</thead>
								<tbody className="divide-y text-xs">
									{recentExpenses.length === 0 ? (
										<tr>
											<td
												colSpan={4}
												className="px-3 py-6 text-center text-muted-foreground"
											>
												Sin gastos registrados
											</td>
										</tr>
									) : (
										recentExpenses.map((exp: any) => (
											<tr key={exp.id} className="hover:bg-muted/40">
												<td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
													{new Date(exp.date).toLocaleDateString([], {
														month: "short",
														day: "numeric",
													})}
												</td>
												<td className="px-3 py-2.5 font-medium truncate max-w-[120px]">
													{exp.title}
												</td>
												<td className="px-3 py-2.5 text-muted-foreground truncate max-w-[100px]">
													{exp.supplierName || "General"}
												</td>
												<td className="px-3 py-2.5 text-right font-bold text-rose-600">
													-{formatCurrency(Number(exp.amount))}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
