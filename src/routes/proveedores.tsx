import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	Plus,
	Search,
	Phone,
	Mail,
	Globe,
	MapPin,
	Package,
	DollarSign,
	Edit2,
	Trash2,
	Truck,
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
import { SupplierForm } from "@/features/suppliers/supplier-form";
import {
	getSuppliersFn,
	createSupplierFn,
	updateSupplierFn,
	deleteSupplierFn,
} from "@/server/suppliers";
import { type SupplierFormValues } from "@/utils/validations";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/proveedores")({
	component: RouteComponent,
	loader: async () => {
		return await getSuppliersFn();
	},
});

function RouteComponent() {
	const data = Route.useLoaderData();
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
	const [search, setSearch] = useState("");

	const handleCreateOrUpdate = async (formData: SupplierFormValues) => {
		try {
			if (editingSupplier) {
				await updateSupplierFn({
					data: {
						...formData,
						id: editingSupplier.id,
					},
				});
				toast.success("Proveedor actualizado exitosamente");
			} else {
				await createSupplierFn({ data: formData });
				toast.success("Proveedor registrado exitosamente");
			}
			setIsDialogOpen(false);
			setEditingSupplier(null);
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al guardar proveedor");
		}
	};

	const handleDelete = async (id: number, name: string) => {
		if (
			!confirm(
				`¿Estás seguro de eliminar al proveedor "${name}"? Los productos o gastos asociados mantendrán su historial.`,
			)
		) {
			return;
		}

		try {
			await deleteSupplierFn({ data: { id } });
			toast.success("Proveedor eliminado");
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error("Error al eliminar proveedor");
		}
	};

	const filteredSuppliers = data.filter((s) => {
		const q = search.toLowerCase();
		return (
			s.name.toLowerCase().includes(q) ||
			(s.description && s.description.toLowerCase().includes(q)) ||
			(s.email && s.email.toLowerCase().includes(q)) ||
			(s.phone1 && s.phone1.includes(q))
		);
	});

	const totalSuppliers = data.length;
	const totalSpent = data.reduce(
		(sum, s) => sum + Number(s.totalExpenses || 0),
		0,
	);
	const activeSuppliersWithProducts = data.filter(
		(s) => Number(s.productsCount) > 0,
	).length;

	return (
		<div className="flex flex-col gap-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Gestión de distribuidores y compras para esta sucursal
					</p>
				</div>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) setEditingSupplier(null);
					}}
					title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nuevo Proveedor
						</Button>
					}
				>
					<SupplierForm
						initialData={editingSupplier || undefined}
						onSubmit={handleCreateOrUpdate}
						onCancel={() => {
							setIsDialogOpen(false);
							setEditingSupplier(null);
						}}
					/>
				</ResponsiveDialog>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Total Proveedores
						</CardTitle>
						<Truck className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalSuppliers}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Registrados en esta sucursal
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Proveedores con Catálogo
						</CardTitle>
						<Package className="size-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{activeSuppliersWithProducts}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Con productos vinculados al inventario
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">
							Gasto Acumulado en Compras
						</CardTitle>
						<DollarSign className="size-4 text-emerald-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(totalSpent)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Compras y gastos pagados a proveedores
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
						placeholder="Buscar proveedor, teléfono o correo..."
						className="pl-8 bg-card"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			{/* Suppliers Table */}
			<div className="rounded-lg border bg-card shadow-xs overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Proveedor</TableHead>
							<TableHead>Contacto</TableHead>
							<TableHead>Ubicación</TableHead>
							<TableHead className="text-center">Productos</TableHead>
							<TableHead className="text-right">Compras ($)</TableHead>
							<TableHead className="w-[100px] text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredSuppliers.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-muted-foreground"
								>
									{data.length === 0
										? "Aún no has registrado ningún proveedor en esta sucursal."
										: "No se encontraron proveedores que coincidan con la búsqueda."}
								</TableCell>
							</TableRow>
						) : (
							filteredSuppliers.map((supplier) => (
								<TableRow key={supplier.id} className="hover:bg-muted/40">
									<TableCell>
										<div className="flex flex-col">
											<span className="font-semibold text-foreground">
												{supplier.name}
											</span>
											{supplier.description && (
												<span className="text-xs text-muted-foreground line-clamp-2 max-w-xs mt-0.5">
													{supplier.description}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1 text-xs text-muted-foreground">
											{supplier.phone1 && (
												<a
													href={`tel:${supplier.phone1}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors"
												>
													<Phone className="size-3" />
													<span>{supplier.phone1}</span>
												</a>
											)}
											{supplier.phone2 && (
												<a
													href={`tel:${supplier.phone2}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors text-[11px]"
												>
													<Phone className="size-2.5 opacity-70" />
													<span>{supplier.phone2}</span>
												</a>
											)}
											{supplier.email && (
												<a
													href={`mailto:${supplier.email}`}
													className="flex items-center gap-1.5 hover:text-primary transition-colors"
												>
													<Mail className="size-3" />
													<span>{supplier.email}</span>
												</a>
											)}
											{supplier.web && (
												<a
													href={
														supplier.web.startsWith("http")
															? supplier.web
															: `https://${supplier.web}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1.5 hover:text-primary transition-colors underline"
												>
													<Globe className="size-3" />
													<span className="truncate max-w-[140px]">
														{supplier.web}
													</span>
												</a>
											)}
											{!supplier.phone1 &&
												!supplier.email &&
												!supplier.web && (
													<span className="text-muted-foreground/60 italic">
														Sin datos de contacto
													</span>
												)}
										</div>
									</TableCell>
									<TableCell>
										{supplier.address ? (
											<div className="flex items-start gap-1 text-xs text-muted-foreground max-w-xs">
												<MapPin className="size-3 shrink-0 mt-0.5" />
												<span>{supplier.address}</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground/60">
												-
											</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										<Badge variant="secondary" className="font-medium">
											{supplier.productsCount} prod.
										</Badge>
									</TableCell>
									<TableCell className="text-right font-medium text-foreground">
										{formatCurrency(Number(supplier.totalExpenses || 0))}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-foreground"
												onClick={() => {
													setEditingSupplier(supplier);
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
													handleDelete(supplier.id, supplier.name)
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
			</div>
		</div>
	);
}
