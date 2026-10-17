import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	AlertTriangle,
	Edit2,
	Plus,
	Search,
	Truck,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Filter,
	X,
	Package,
	Upload,
	Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { ProductForm } from "@/features/inventory/product-form";
import { CSVImportDialog } from "@/features/inventory/csv-import-dialog";
import {
	createProductFn,
	deleteProductFn,
	getInventoryFn,
	updateProductFn,
} from "@/server/inventory";
import { getSuppliersFn } from "@/server/suppliers";
import { getCategoriesFn } from "@/server/categories";
import { type ProductFormValues } from "@/utils/validations";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/inventario")({
	component: RouteComponent,
	loader: async () => {
		const [inventoryList, suppliersList, categoriesList] = await Promise.all([
			getInventoryFn(),
			getSuppliersFn(),
			getCategoriesFn(),
		]);
		return {
			inventory: inventoryList,
			suppliers: suppliersList,
			categories: categoriesList,
		};
	},
});

type SortField = "name" | "price" | "category" | "supplier" | "quantity";
type SortDirection = "asc" | "desc";

function RouteComponent() {
	const { inventory: data, suppliers, categories } = Route.useLoaderData();
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any | null>(null);
	const [deleteProductTarget, setDeleteProductTarget] = useState<{
		id: number;
		name: string;
		reopenEditOnCancel?: boolean;
	} | null>(null);

	// Filters
	const [search, setSearch] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
	const [stockStatus, setStockStatus] = useState<string>("all");

	// Sorting
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
		setCurrentPage(1);
	};

	const resetFilters = () => {
		setSearch("");
		setSelectedCategory("all");
		setSelectedSupplier("all");
		setStockStatus("all");
		setSortField("name");
		setSortDirection("asc");
		setCurrentPage(1);
	};

	const hasActiveFilters =
		search !== "" ||
		selectedCategory !== "all" ||
		selectedSupplier !== "all" ||
		stockStatus !== "all";

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

	const handleDeleteProduct = (
		id: number,
		name: string,
		reopenEditOnCancel = false,
	) => {
		setDeleteProductTarget({ id, name, reopenEditOnCancel });
	};

	const executeDeleteProduct = async (id: number) => {
		try {
			await deleteProductFn({ data: { id } });
			toast.success("Producto eliminado exitosamente");
			if (editingItem?.id === id) {
				setIsDialogOpen(false);
				setEditingItem(null);
			}
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al eliminar producto");
		}
	};

	// Filter & Sort
	const processedData = useMemo(() => {
		const filtered = data.filter((item) => {
			const q = search.toLowerCase().trim();
			const matchesSearch =
				!q ||
				item.name.toLowerCase().includes(q) ||
				(item.category && item.category.toLowerCase().includes(q)) ||
				(item.supplierName && item.supplierName.toLowerCase().includes(q)) ||
				(item.notes && item.notes.toLowerCase().includes(q));

			const matchesCategory =
				selectedCategory === "all" ||
				(selectedCategory === "none" && !item.category) ||
				item.category?.toLowerCase() === selectedCategory.toLowerCase();

			const matchesSupplier =
				selectedSupplier === "all" ||
				(selectedSupplier === "none" && !item.supplierId) ||
				String(item.supplierId) === selectedSupplier;

			const qty = Number(item.quantity || 0);
			const min = Number(item.minStock || 1);

			let matchesStock = true;
			if (stockStatus === "low") {
				matchesStock = qty <= min && qty > 0;
			} else if (stockStatus === "out") {
				matchesStock = qty <= 0;
			} else if (stockStatus === "in_stock") {
				matchesStock = qty > 0;
			}

			return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
		});

		// Sort
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "price":
					comparison = Number(a.price) - Number(b.price);
					break;
				case "category":
					comparison = (a.category || "").localeCompare(b.category || "");
					break;
				case "supplier":
					comparison = (a.supplierName || "").localeCompare(b.supplierName || "");
					break;
				case "quantity":
					comparison = Number(a.quantity || 0) - Number(b.quantity || 0);
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return filtered;
	}, [
		data,
		search,
		selectedCategory,
		selectedSupplier,
		stockStatus,
		sortField,
		sortDirection,
	]);

	// Pagination slice
	const totalItems = processedData.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;
	const paginatedData = processedData.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	const renderSortIcon = (field: SortField) => {
		if (sortField !== field) {
			return <ArrowUpDown className="size-3.5 opacity-40 ml-1 inline" />;
		}
		return sortDirection === "asc" ? (
			<ArrowUp className="size-3.5 text-primary ml-1 inline" />
		) : (
			<ArrowDown className="size-3.5 text-primary ml-1 inline" />
		);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Catálogo de productos, existencias en almacén y proveedores de la sucursal
					</p>
				</div>

				<div className="flex items-center gap-2">
					<ResponsiveDialog
						open={isImportOpen}
						onOpenChange={setIsImportOpen}
						title="Importar Productos desde CSV"
						trigger={
							<Button variant="outline" className="flex items-center gap-2">
								<Upload size={16} /> Importar CSV
							</Button>
						}
					>
						<CSVImportDialog
							categories={categories}
							suppliers={suppliers}
							onSuccess={() => {
								setIsImportOpen(false);
								router.invalidate();
							}}
							onCancel={() => setIsImportOpen(false)}
						/>
					</ResponsiveDialog>

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
						categories={categories}
						onSubmit={handleSubmitProduct}
						onDelete={
							editingItem
								? () => {
										const item = editingItem;
										setIsDialogOpen(false);
										handleDeleteProduct(item.id, item.name, true);
									}
								: undefined
						}
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
										quantity: Number(editingItem.quantity || 0),
										notes: editingItem.notes || "",
										unit: editingItem.unit,
										supplierId: editingItem.supplierId || null,
										minStock: editingItem.minStock
											? Number(editingItem.minStock)
											: 1,
									}
								: undefined
						}
					/>
				</ResponsiveDialog>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<CardTitle className="text-lg">Productos y Existencias</CardTitle>
							<CardDescription>
								{totalItems} de {data.length} productos mostrados
							</CardDescription>
						</div>

						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={resetFilters}
								className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 self-start sm:self-auto"
							>
								<X className="size-3.5" /> Limpiar filtros
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						{/* Advanced Filters Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg border">
							{/* Search */}
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
									size={16}
								/>
								<Input
									className="pl-9 h-9 text-xs bg-background"
									placeholder="Buscar por nombre o notas..."
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>

							{/* Category Filter */}
							<div>
								<select
									className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
									value={selectedCategory}
									onChange={(e) => {
										setSelectedCategory(e.target.value);
										setCurrentPage(1);
									}}
								>
									<option value="all">Todas las categorías</option>
									<option value="none">Sin categoría</option>
									{categories.map((c) => (
										<option key={c.id} value={c.name}>
											{c.name}
										</option>
									))}
								</select>
							</div>

							{/* Supplier Filter */}
							<div>
								<select
									className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
									value={selectedSupplier}
									onChange={(e) => {
										setSelectedSupplier(e.target.value);
										setCurrentPage(1);
									}}
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

							{/* Stock Status Filter */}
							<div>
								<select
									className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
									value={stockStatus}
									onChange={(e) => {
										setStockStatus(e.target.value);
										setCurrentPage(1);
									}}
								>
									<option value="all">Todo el stock (Estado)</option>
									<option value="in_stock">En existencia (&gt; 0)</option>
									<option value="low">Alerta stock bajo</option>
									<option value="out">Agotados (0 existencias)</option>
								</select>
							</div>
						</div>

						{/* Table with Clickable Sort Headers */}
						<div className="border rounded-md overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/40 border-b select-none">
									<tr>
										<th
											className="px-4 py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
											onClick={() => handleSort("name")}
										>
											Producto {renderSortIcon("name")}
										</th>
										<th
											className="px-4 py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
											onClick={() => handleSort("category")}
										>
											Categoría {renderSortIcon("category")}
										</th>
										<th
											className="px-4 py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
											onClick={() => handleSort("supplier")}
										>
											Proveedor {renderSortIcon("supplier")}
										</th>
										<th
											className="px-4 py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
											onClick={() => handleSort("price")}
										>
											Precio {renderSortIcon("price")}
										</th>
										<th className="px-4 py-3 font-semibold text-foreground">
											Costo
										</th>
										<th
											className="px-4 py-3 font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors"
											onClick={() => handleSort("quantity")}
										>
											Existencias {renderSortIcon("quantity")}
										</th>
										<th className="px-4 py-3 font-semibold text-foreground text-right">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{paginatedData.length === 0 ? (
										<tr>
											<td
												colSpan={7}
												className="px-4 py-10 text-center text-muted-foreground"
											>
												<div className="flex flex-col items-center justify-center gap-2">
													<Package className="size-8 text-muted-foreground/40" />
													<span>
														{data.length === 0
															? "Aún no hay productos en inventario."
															: "No se encontraron productos con los filtros seleccionados."}
													</span>
													{hasActiveFilters && (
														<Button
															variant="outline"
															size="sm"
															onClick={resetFilters}
															className="mt-1"
														>
															Restablecer filtros
														</Button>
													)}
												</div>
											</td>
										</tr>
									) : (
										paginatedData.map((item) => {
											const qty = Number(item.quantity || 0);
											const min = Number(item.minStock || 1);
											const isLow = qty <= min && qty > 0;
											const isOut = qty <= 0;

											return (
												<tr
													key={item.id}
													className="hover:bg-muted/50 transition-colors cursor-pointer"
													onClick={() => {
														setEditingItem(item);
														setIsDialogOpen(true);
													}}
												>
													<td className="px-4 py-3">
														<div className="flex flex-col">
															<span className="font-semibold text-foreground">
																{item.name}
															</span>
															{item.notes && (
																<span className="text-[11px] text-muted-foreground line-clamp-1">
																	{item.notes}
																</span>
															)}
														</div>
													</td>
													<td className="px-4 py-3 text-muted-foreground text-xs">
														{item.category ? (
															<Badge
																variant="outline"
																className="font-normal text-xs"
															>
																{item.category}
															</Badge>
														) : (
															<span className="text-muted-foreground/50 italic">
																-
															</span>
														)}
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
															<span className="text-xs text-muted-foreground/50 italic">
																-
															</span>
														)}
													</td>
													<td className="px-4 py-3 font-medium">
														{formatCurrency(Number(item.price))}
													</td>
													<td className="px-4 py-3 text-xs text-muted-foreground">
														{formatCurrency(Number(item.cost))}
													</td>
													<td className="px-4 py-3">
														<div className="flex items-center gap-1.5 font-bold">
															<span
																className={
																	isOut
																		? "text-destructive"
																		: isLow
																			? "text-amber-600 dark:text-amber-400"
																			: "text-foreground"
																}
															>
																{qty}
															</span>
															<span className="text-xs font-normal text-muted-foreground">
																{item.unit === "piece"
																	? "pz"
																	: item.unit === "liter"
																		? "L"
																		: item.unit === "kilo"
																			? "kg"
																			: "paq"}
															</span>
															{isOut ? (
																<Badge
																	variant="destructive"
																	className="text-[10px] px-1.5 py-0 font-medium"
																>
																	Agotado
																</Badge>
															) : isLow ? (
																<div
																	title={`Stock bajo (Mínimo: ${min})`}
																	className="flex items-center text-amber-600 dark:text-amber-400"
																>
																	<AlertTriangle size={14} />
																</div>
															) : null}
														</div>
													</td>
													<td
														className="px-4 py-3 text-right"
														onClick={(e) => e.stopPropagation()}
													>
														<div className="flex items-center justify-end gap-1">
															<Button
																variant="ghost"
																size="sm"
																className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
																onClick={(e) => {
																	e.stopPropagation();
																	setEditingItem(item);
																	setIsDialogOpen(true);
																}}
															>
																<Edit2 size={14} />
																Editar
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDeleteProduct(item.id, item.name);
																}}
																title="Eliminar producto"
															>
																<Trash2 size={14} />
															</Button>
														</div>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
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
				</CardContent>
			</Card>

			<ConfirmDialog
				open={!!deleteProductTarget}
				onOpenChange={(open) => {
					if (!open) {
						if (deleteProductTarget?.reopenEditOnCancel) {
							setIsDialogOpen(true);
						}
						setDeleteProductTarget(null);
					}
				}}
				title="Eliminar Producto"
				description={`¿Estás seguro de eliminar el producto "${deleteProductTarget?.name}" del inventario? Esta acción no se puede deshacer.`}
				confirmText="Eliminar"
				variant="destructive"
				icon="trash"
				onConfirm={async () => {
					if (deleteProductTarget) {
						await executeDeleteProduct(deleteProductTarget.id);
					}
				}}
			/>
		</div>
	);
}
