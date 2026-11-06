import React, { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Tags,
	Plus,
	Search,
	Pencil,
	Trash2,
	Check,
	X,
	Loader2,
	Package,
} from "lucide-react";
import {
	createCategoryFn,
	updateCategoryFn,
	deleteCategoryFn,
	type CategoryItem,
} from "@/server/categories";
import { toast } from "sonner";

interface CategoriesManagerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: Array<{
		id: number | string;
		name: string;
		productCount?: number;
	}>;
}

export function CategoriesManagerDialog({
	open,
	onOpenChange,
	categories = [],
}: CategoriesManagerDialogProps) {
	const router = useRouter();

	const [newName, setNewName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const [editingId, setEditingId] = useState<number | string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	const [deletingCategory, setDeletingCategory] = useState<{
		id: number | string;
		name: string;
		productCount?: number;
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleCreateCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanName = newName.trim();
		if (!cleanName) return;

		if (cleanName.length < 2) {
			toast.error("El nombre debe tener al menos 2 caracteres");
			return;
		}

		const exists = categories.some(
			(c) => c.name.toLowerCase() === cleanName.toLowerCase(),
		);
		if (exists) {
			toast.error(`Ya existe una categoría llamada "${cleanName}"`);
			return;
		}

		setIsCreating(true);
		try {
			await createCategoryFn({ data: { name: cleanName } });
			toast.success(`Categoría "${cleanName}" creada correctamente`);
			setNewName("");
			await router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al crear la categoría");
		} finally {
			setIsCreating(false);
		}
	};

	const handleStartEdit = (cat: { id: number | string; name: string }) => {
		setEditingId(cat.id);
		setEditingName(cat.name);
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditingName("");
	};

	const handleSaveEdit = async (catId: number | string) => {
		const clean = editingName.trim();
		if (!clean) {
			toast.error("El nombre no puede estar vacío");
			return;
		}
		if (clean.length < 2) {
			toast.error("El nombre debe tener al menos 2 caracteres");
			return;
		}

		const duplicate = categories.some(
			(c) =>
				String(c.id) !== String(catId) &&
				c.name.toLowerCase() === clean.toLowerCase(),
		);
		if (duplicate) {
			toast.error(`Ya existe otra categoría con el nombre "${clean}"`);
			return;
		}

		// Ensure numeric ID
		const numericId = typeof catId === "number" ? catId : Number(catId);
		if (!numericId || isNaN(numericId)) {
			toast.error("Identificador de categoría no válido");
			return;
		}

		setIsSavingEdit(true);
		try {
			await updateCategoryFn({ data: { id: numericId, name: clean } });
			toast.success("Categoría actualizada correctamente");
			setEditingId(null);
			setEditingName("");
			await router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al actualizar la categoría");
		} finally {
			setIsSavingEdit(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deletingCategory) return;

		const numericId =
			typeof deletingCategory.id === "number"
				? deletingCategory.id
				: Number(deletingCategory.id);

		if (!numericId || isNaN(numericId)) {
			toast.error("Identificador de categoría no válido");
			setDeletingCategory(null);
			return;
		}

		setIsDeleting(true);
		try {
			await deleteCategoryFn({ data: { id: numericId } });
			toast.success(
				`Categoría "${deletingCategory.name}" eliminada correctamente`,
			);
			setDeletingCategory(null);
			await router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al eliminar la categoría");
		} finally {
			setIsDeleting(false);
		}
	};

	const filteredCategories = categories.filter((cat) => {
		if (!searchQuery.trim()) return true;
		return cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
	});

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
					{/* Header */}
					<DialogHeader className="p-5 pb-4 border-b">
						<div className="flex items-center gap-2">
							<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Tags className="size-5" />
							</div>
							<div>
								<DialogTitle className="text-lg font-semibold">
									Gestión de Categorías
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground mt-0.5">
									Crea, renombra o elimina categorías para tus productos
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					{/* Body */}
					<div className="p-5 flex flex-col gap-4 overflow-y-auto">
						{/* Creation Form */}
						<form onSubmit={handleCreateCategory} className="flex gap-2">
							<Input
								placeholder="Nueva categoría (ej. Bebidas, Abarrotes...)"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								className="h-9 text-xs"
								disabled={isCreating}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={isCreating || !newName.trim()}
								className="h-9 px-3 text-xs shrink-0 flex items-center gap-1.5"
							>
								{isCreating ? (
									<Loader2 className="size-3.5 animate-spin" />
								) : (
									<Plus className="size-3.5" />
								)}
								<span>Agregar</span>
							</Button>
						</form>

						{/* Search Bar if > 4 categories */}
						{categories.length > 4 && (
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
								<Input
									placeholder="Buscar categoría..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 pl-8 text-xs bg-muted/40"
								/>
							</div>
						)}

						{/* Categories List */}
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between text-xs text-muted-foreground px-1 mb-1">
								<span>
									{filteredCategories.length} de {categories.length}{" "}
									categoría{categories.length === 1 ? "" : "s"}
								</span>
							</div>

							<div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
								{filteredCategories.length === 0 ? (
									<div className="py-8 text-center text-xs text-muted-foreground border rounded-lg bg-muted/20">
										{searchQuery.trim()
											? "No se encontraron categorías que coincidan con la búsqueda."
											: "Aún no hay categorías creadas. ¡Agrega la primera arriba!"}
									</div>
								) : (
									filteredCategories.map((cat) => {
										const isEditing = editingId === cat.id;

										if (isEditing) {
											return (
												<div
													key={cat.id}
													className="flex items-center gap-1.5 p-2 rounded-lg border bg-muted/30"
												>
													<Input
														value={editingName}
														onChange={(e) => setEditingName(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																e.preventDefault();
																handleSaveEdit(cat.id);
															} else if (e.key === "Escape") {
																handleCancelEdit();
															}
														}}
														className="h-8 text-xs bg-background flex-1"
														autoFocus
														disabled={isSavingEdit}
													/>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={() => handleSaveEdit(cat.id)}
														disabled={isSavingEdit || !editingName.trim()}
														className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
														title="Guardar"
													>
														{isSavingEdit ? (
															<Loader2 className="size-3.5 animate-spin" />
														) : (
															<Check className="size-4" />
														)}
													</Button>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={handleCancelEdit}
														disabled={isSavingEdit}
														className="size-8 text-muted-foreground hover:text-foreground"
														title="Cancelar"
													>
														<X className="size-4" />
													</Button>
												</div>
											);
										}

										const productCount = cat.productCount || 0;

										return (
											<div
												key={cat.id}
												className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
											>
												<div className="flex items-center gap-2 min-w-0 pr-2">
													<Tags className="size-3.5 text-muted-foreground shrink-0" />
													<span className="text-xs font-medium truncate text-foreground">
														{cat.name}
													</span>
													<Badge
														variant="secondary"
														className="text-[10px] h-5 px-1.5 py-0 font-normal shrink-0"
													>
														<Package className="size-2.5 mr-1 opacity-70" />
														{productCount} {productCount === 1 ? "prod." : "prods."}
													</Badge>
												</div>

												<div className="flex items-center gap-1 shrink-0">
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={() => handleStartEdit(cat)}
														className="size-7 text-muted-foreground hover:text-foreground"
														title="Editar nombre de categoría"
													>
														<Pencil className="size-3.5" />
													</Button>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={() => setDeletingCategory(cat)}
														className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
														title="Eliminar categoría"
													>
														<Trash2 className="size-3.5" />
													</Button>
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				open={!!deletingCategory}
				onOpenChange={(isOpen) => {
					if (!isOpen) setDeletingCategory(null);
				}}
				title={`¿Eliminar categoría "${deletingCategory?.name}"?`}
				description={
					deletingCategory && (deletingCategory.productCount || 0) > 0 ? (
						<span>
							Esta categoría está asociada a{" "}
							<strong className="text-foreground">
								{deletingCategory.productCount}{" "}
								{deletingCategory.productCount === 1 ? "producto" : "productos"}
							</strong>
							. Los productos no se eliminarán, pero quedarán sin categoría asignada.
						</span>
					) : (
						"Esta categoría no tiene productos asociados. ¿Deseas eliminarla definitivamente?"
					)
				}
				confirmText="Eliminar Categoría"
				variant="destructive"
				icon="trash"
				isLoading={isDeleting}
				onConfirm={handleConfirmDelete}
			/>
		</>
	);
}

