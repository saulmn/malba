import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Edit2, Plus, Search } from "lucide-react";
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
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ProductForm } from "@/features/inventory/product-form";
import {
	createProductFn,
	getInventoryFn,
	updateProductFn,
} from "@/server/inventory";
import { type ProductFormValues } from "@/utils/validations";

export const Route = createFileRoute("/inventario")({
	component: RouteComponent,
	loader: async () => {
		return await getInventoryFn();
	},
});

function RouteComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any | null>(null);
	const [search, setSearch] = useState("");
	const data = Route.useLoaderData();
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
						workspaceId: 1, // Hardcoded for now
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

	const filteredData = data.filter((item) =>
		item.name.toLowerCase().includes(search.toLowerCase()),
	);

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
						Gestiona el stock actual de tu sucursal
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<div className="relative max-w-sm">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								size={18}
							/>
							<Input
								className="pl-10"
								placeholder="Buscar en inventario..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						<div className="border rounded-md overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="bg-muted/30 border-b">
									<tr>
										<th className="px-4 py-3 font-medium text-foreground">
											Producto
										</th>
										<th className="px-4 py-3 font-medium text-foreground">
											Categorí­a
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
												colSpan={6}
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
