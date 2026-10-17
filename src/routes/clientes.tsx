import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	Plus,
	Search,
	Phone,
	Mail,
	Globe,
	MapPin,
	Users,
	ShoppingBag,
	DollarSign,
	Edit2,
	Trash2,
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
import { CustomerForm } from "@/features/customers/customer-form";
import {
	getCustomersFn,
	createCustomerFn,
	updateCustomerFn,
	deleteCustomerFn,
} from "@/server/customers";
import { type CustomerFormValues } from "@/utils/validations";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/clientes")({
	component: RouteComponent,
	loader: async () => {
		return await getCustomersFn();
	},
});

function RouteComponent() {
	const data = Route.useLoaderData();
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const handleCreateOrUpdate = async (formData: CustomerFormValues) => {
		try {
			if (editingCustomer) {
				await updateCustomerFn({
					data: {
						...formData,
						id: editingCustomer.id,
					},
				});
				toast.success("Cliente actualizado exitosamente");
			} else {
				await createCustomerFn({ data: formData });
				toast.success("Cliente registrado exitosamente");
			}
			setIsDialogOpen(false);
			setEditingCustomer(null);
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al guardar cliente");
		}
	};

	const handleDelete = async (id: number, name: string) => {
		if (
			!confirm(
				`¿Estás seguro de eliminar al cliente "${name}"? Las ventas asociadas mantendrán su historial contable.`,
			)
		) {
			return;
		}

		try {
			await deleteCustomerFn({ data: { id } });
			toast.success("Cliente eliminado");
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error("Error al eliminar cliente");
		}
	};

	const filteredCustomers = data.filter((c) => {
		const q = search.toLowerCase();
		return (
			c.name.toLowerCase().includes(q) ||
			(c.notes && c.notes.toLowerCase().includes(q)) ||
			(c.email && c.email.toLowerCase().includes(q)) ||
			(c.phone1 && c.phone1.includes(q))
		);
	});

	const totalItems = filteredCustomers.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const paginatedCustomers = filteredCustomers.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	const totalCustomers = data.length;
	const totalSpent = data.reduce(
		(sum, c) => sum + Number(c.totalSpent || 0),
		0,
	);
	const activeCustomers = data.filter(
		(c) => Number(c.purchasesCount) > 0,
	).length;

	return (
		<div className="flex flex-col gap-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Cartera de clientes, historial de compras y contacto de esta sucursal
					</p>
				</div>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) setEditingCustomer(null);
					}}
					title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nuevo Cliente
						</Button>
					}
				>
					<CustomerForm
						initialData={editingCustomer || undefined}
						onSubmit={handleCreateOrUpdate}
						onCancel={() => {
							setIsDialogOpen(false);
							setEditingCustomer(null);
						}}
					/>
				</ResponsiveDialog>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Total Clientes
						</CardTitle>
						<Users className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalCustomers}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Registrados en esta sucursal
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Clientes con Compras
						</CardTitle>
						<ShoppingBag className="size-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{activeCustomers}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Han comprado al menos una vez en el POS
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Ventas a Clientes Frecuentes
						</CardTitle>
						<DollarSign className="size-4 text-emerald-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(totalSpent)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Ventas facturadas a clientes identificados
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Search */}
			<div className="flex items-center gap-2 max-w-sm">
				<div className="relative w-full">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar cliente, teléfono o notas..."
						className="pl-8 bg-card"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
			</div>

			{/* Customers Table */}
			<div className="rounded-lg border bg-card shadow-xs overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Cliente</TableHead>
							<TableHead>Contacto</TableHead>
							<TableHead>Dirección</TableHead>
							<TableHead className="text-center">Compras</TableHead>
							<TableHead className="text-right">Total Gastado ($)</TableHead>
							<TableHead className="w-[100px] text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedCustomers.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-muted-foreground"
								>
									{data.length === 0
										? "Aún no has registrado ningún cliente en esta sucursal."
										: "No se encontraron clientes que coincidan con la búsqueda."}
								</TableCell>
							</TableRow>
						) : (
							paginatedCustomers.map((customer) => (
								<TableRow key={customer.id} className="hover:bg-muted/40">
									<TableCell>
										<div className="flex flex-col">
											<span className="font-semibold text-foreground">
												{customer.name}
											</span>
											{customer.notes && (
												<span className="text-xs text-muted-foreground line-clamp-2 max-w-xs mt-0.5">
													{customer.notes}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1 text-xs text-muted-foreground">
											{customer.phone1 && (
												<a
													href={`tel:${customer.phone1}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors"
												>
													<Phone className="size-3" />
													<span>{customer.phone1}</span>
												</a>
											)}
											{customer.phone2 && (
												<a
													href={`tel:${customer.phone2}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors text-[11px]"
												>
													<Phone className="size-2.5 opacity-70" />
													<span>{customer.phone2}</span>
												</a>
											)}
											{customer.email && (
												<a
													href={`mailto:${customer.email}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors"
												>
													<Mail className="size-3" />
													<span>{customer.email}</span>
												</a>
											)}
											{customer.web && (
												<a
													href={
														customer.web.startsWith("http")
															? customer.web
															: `https://${customer.web}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1.5 hover:text-primary transition-colors underline"
												>
													<Globe className="size-3" />
													<span className="truncate max-w-[140px]">
														{customer.web}
													</span>
												</a>
											)}
											{!customer.phone1 &&
												!customer.email &&
												!customer.web && (
													<span className="text-muted-foreground/60 italic">
														Sin datos de contacto
													</span>
												)}
										</div>
									</TableCell>
									<TableCell>
										{customer.address ? (
											<div className="flex items-start gap-1 text-xs text-muted-foreground max-w-xs">
												<MapPin className="size-3 shrink-0 mt-0.5" />
												<span>{customer.address}</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground/60">
												-
											</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										<Badge variant="secondary" className="font-medium">
											{customer.purchasesCount} ventas
										</Badge>
									</TableCell>
									<TableCell className="text-right font-medium text-foreground">
										{formatCurrency(Number(customer.totalSpent || 0))}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-foreground"
												onClick={() => {
													setEditingCustomer(customer);
													setIsDialogOpen(true);
												}}
											>
												<Edit2 className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
												onClick={() =>
													handleDelete(customer.id, customer.name)
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
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
