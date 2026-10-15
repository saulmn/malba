import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Edit2, Plus, Search, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ProductForm } from "@/features/inventory/product-form";
import {
	createProductFn,
	getInventoryFn,
	updateProductFn,
} from "@/server/inventory";
import { getSuppliersFn } from "@/server/suppliers";
import { type ProductFormValues } from "@/utils/validations";

export const Route = createFileRoute("/inventario")({
	component: RouteComponent,
	loader: async () => {
		const [inventoryList, suppliersList] = await Promise.all([
			getInventoryFn(),
			getSuppliersFn(),
		]);
		return { inventory: inventoryList, suppliers: suppliersList };
	},
});

function RouteComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any | null>(null);
	const [search, setSearch] = useState("");
	const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
	const { inventory: data, suppliers } = Route.useLoaderData();
	const router = useRouter();

	const handleSubmitProduct = async (formData: ProductFormValues) => {
		try {
			let finalImageUrl = editingItem?.imageUrl || "";

			// Manejo de la subida de imagen
			if (formData.image && formData.image.length > 0) {
				const file = formData.image[0];
				const { getPresignedUploadUrlFn } = await import("@/server/storage");
				const { uploadUrl, finalImageUrl: url } = await getPresignedUploadUrlFn(
					{
						data: { contentType: file.type, fileName: file.name },
					},
				);
				await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				finalImageUrl = url;
			}

			if (editingItem) {
				await updateProductFn({
					data: {
						...formData,
						id: editingItem.id,
						imageUrl: finalImageUrl || undefined,
					},
				});
				toast.success("Producto actualizado exitosamente");
			} else {
				await createProductFn({
					data: {
						...formData,
						imageUrl: finalImageUrl || undefined,
					},
				});
				toast.success("Producto creado exitosamente");
			}
			setIsDialogOpen(false);
			setEditingItem(null);
			router.invalidate();
		} catch (error) {
			toast.error("Error al guardar producto");
			console.error(error);
		}
	};

	const filteredData = data.filter((item) => {
		const matchesSearch =
			item.name.toLowerCase().includes(search.toLowerCase()) ||
			(item.category &&
				item.category.toLowerCase().includes(search.toLowerCase())) ||
			(item.supplierName &&
				item.supplierName.toLowerCase().includes(search.toLowerCase()));

		const matchesSupplier =
			selectedSupplier === "all" ||
			(selectedSupplier === "none" && !item.supplierId) ||
			String(item.supplierId) === selectedSupplier;

		return matchesSearch && matchesSupplier;
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h1 className="text-3xl font-bold tracking-tight">Inventario</h1>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) setEditingItem(null);
					}}
					title={editingItem ? "Editar Producto" : "Agregar Nuevo Producto"}
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nuevo Producto
						</Button>
					}
				>
					<ProductForm
						suppliers={suppliers}
						onSubmit={handleSubmitProduct}
						onCancel={() => {
							setIsDialogOpen(false);
							setEditingItem(null);
						}}
						defaultValues={
							editingItem
								? {
										name: editingItem.name,
										category: editingItem.category || "",
										price: Number(editingItem.price),
										cost: Number(editingItem.cost),
										margin: editingItem.margin ? Number(editingItem.margin) : 0,
										notes: editingItem.notes || "",
										unit: editingItem.unit,
										supplierId: editingItem.supplierId || null,
										minStock: editingItem.minStock
											? Number(editingItem.minStock)
											: 5,
									}
								: undefined
						}
					/>
				</ResponsiveDialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Productos y Existencias</CardTitle>
					<CardDescription>
						Gestiona el stock y catálogo de proveedores de tu sucursal
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
							<div className="relative max-w-sm flex-1">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
									size={18}
								/>
								<Input
									className="pl-10"
									placeholder="Buscar producto, categoría o proveedor..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</div>

							<div className="w-full sm:w-64">
								<select
									className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
									value={selectedSupplier}
									onChange={(e) => setSelectedSupplier(e.target.value)}
								>
									<option value="all">Todos los proveedores</option>
									<option value="none">Sin proveedor</option>
									{suppliers.map((s) => (
										<option key={s.id} value={String(s.id)}>
											{s.name}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="border rounded-md overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/30 border-b">
									<tr>
										<th className="px-4 py-3 font-medium text-foreground">
											Producto
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Categoría
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Proveedor
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Precio
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Costo
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Existencia
										</th>
										<th className="px-4 py-3 font-medium text-foreground text-right">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{filteredData.length === 0 ? (
										<tr>
											<td
												colSpan={7}
												className="px-4 py-8 text-center text-muted-foreground"
											>
												No hay productos registrados o que coincidan con la
												búsqueda.
											</td>
										</tr>
									) : (
										filteredData.map((item) => (
											<tr
												key={item.id}
												className="hover:bg-muted/50 transition-colors"
											>
												<td className="px-4 py-3 font-medium">{item.name}</td>
												<td className="px-4 py-3 text-muted-foreground">
													{item.category || "-"}
												</td>
												<td className="px-4 py-3">
													{item.supplierName ? (
														<Badge
															variant="secondary"
															className="gap-1 font-normal text-xs"
														>
															<Truck className="size-3" />
															{item.supplierName}
														</Badge>
													) : (
														<span className="text-xs text-muted-foreground/60 italic">
															-
														</span>
													)}
												</td>
												<td className="px-4 py-3">
													${Number(item.price).toFixed(2)}
												</td>
												<td className="px-4 py-3">
													${Number(item.cost).toFixed(2)}
												</td>
												<td
													className={`px-4 py-3 font-bold ${Number(item.quantity) <= Number(item.minStock || 5) ? "text-red-500" : ""}`}
												>
													<div className="flex items-center gap-2">
														{Number(item.quantity)}{" "}
														{item.unit === "piece"
															? "pz"
															: item.unit === "liter"
																? "L"
																: item.unit === "kilo"
																	? "kg"
																	: "paq"}
														{Number(item.quantity) <=
															Number(item.minStock || 5) && (
															<AlertTriangle
																size={14}
																className="text-red-500"
															/>
														)}
													</div>
												</td>
												<td className="px-4 py-3 text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setEditingItem(item);
															setIsDialogOpen(true);
														}}
													>
														<Edit2 size={16} />
													</Button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
