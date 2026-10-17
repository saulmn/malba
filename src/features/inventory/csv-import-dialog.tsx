import { useState, useId } from "react";
import {
	Upload,
	FileSpreadsheet,
	CheckCircle2,
	AlertCircle,
	ArrowRight,
	Store,
	Tag,
	Layers,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	parseCSV,
	detectCSVStructure,
	transformRowsToProducts,
	type CSVColumnMapping,
	type CSVImportOptions,
	type ParsedProductItem,
	type UnitType,
} from "@/utils/csv-importer";
import { importProductsBatchFn } from "@/server/inventory";
import { formatCurrency } from "@/utils/format";

interface CSVImportDialogProps {
	categories: Array<{ id: number; name: string }>;
	suppliers: Array<{ id: number; name: string }>;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export function CSVImportDialog({
	categories,
	suppliers,
	onSuccess,
	onCancel,
}: CSVImportDialogProps) {
	const fileInputId = useId();

	// File state
	const [rawText, setRawText] = useState<string>("");
	const [fileName, setFileName] = useState<string>("");
	const [parsedRows, setParsedRows] = useState<string[][]>([]);

	// Mapping state
	const [mapping, setMapping] = useState<CSVColumnMapping>({
		headerRow: 0,
		nameCol: -1,
		supplierCol: -1,
		categoryCol: -1,
		quantityCol: -1,
		costCol: -1,
		priceCol: -1,
		marginCol: -1,
		unitCol: -1,
	});

	// Options state
	const [options, setOptions] = useState<CSVImportOptions>({
		defaultCategory: "General",
		defaultSupplier: "",
		carryForwardSupplier: true,
		defaultUnit: "piece",
	});

	const [duplicateAction, setDuplicateAction] = useState<
		"update" | "skip" | "create_always"
	>("update");

	// Status & execution state
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

	const handleFileUpload = (file: File) => {
		setFileName(file.name);
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			setRawText(text);

			const rows = parseCSV(text);
			setParsedRows(rows);

			// Auto detect structure
			const detected = detectCSVStructure(rows);
			setMapping(detected);

			// If file has a name hinting at category, use it as default
			const lowerName = file.name.toLowerCase();
			if (lowerName.includes("quimico") || lowerName.includes("químico")) {
				setOptions((prev) => ({ ...prev, defaultCategory: "Químicos" }));
			} else if (lowerName.includes("limpieza")) {
				setOptions((prev) => ({ ...prev, defaultCategory: "Limpieza" }));
			}
		};
		reader.readAsText(file, "UTF-8");
	};

	// Transform rows based on current mapping & options
	const { items, totalDetectedRows, skippedRows, warnings } =
		parsedRows.length > 0
			? transformRowsToProducts(parsedRows, mapping, options)
			: { items: [], totalDetectedRows: 0, skippedRows: 0, warnings: [] };

	// Extract unique categories and suppliers from the parsed items
	const detectedCategories = Array.from(
		new Set(items.map((i) => i.category).filter(Boolean)),
	);
	const detectedSuppliers = Array.from(
		new Set(items.map((i) => i.supplierName).filter(Boolean)),
	);

	const handleImport = async () => {
		if (items.length === 0) {
			toast.error("No hay productos válidos para importar");
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await importProductsBatchFn({
				data: {
					products: items,
					duplicateAction,
				},
			});

			toast.success(
				`¡Éxito! Se procesaron ${result.total} productos (${result.created} nuevos, ${result.updated} actualizados).`,
			);
			if (result.suppliersCreated > 0 || result.categoriesCreated > 0) {
				toast.info(
					`Se registraron ${result.categoriesCreated} nuevas categorías y ${result.suppliersCreated} nuevos proveedores.`,
				);
			}

			if (onSuccess) onSuccess();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al importar productos desde el CSV");
		} finally {
			setIsSubmitting(false);
		}
	};

	const headers =
		parsedRows.length > mapping.headerRow
			? parsedRows[mapping.headerRow]
			: [];

	const columnOptions = [
		{ value: -1, label: "(Ninguna / No mapear)" },
		...headers.map((h, idx) => ({
			value: idx,
			label: `Col ${idx + 1}: ${h || `[Columna ${idx + 1}]`}`,
		})),
	];

	return (
		<div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
			{/* Step 1: Upload or file details */}
			{parsedRows.length === 0 ? (
				<div
					className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 transition-colors rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20"
					onClick={() => document.getElementById(fileInputId)?.click()}
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => {
						e.preventDefault();
						const file = e.dataTransfer.files[0];
						if (file) handleFileUpload(file);
					}}
				>
					<div className="p-3 bg-primary/10 rounded-full text-primary">
						<Upload className="size-7" />
					</div>
					<div>
						<p className="font-semibold text-foreground text-base">
							Arrastra tu archivo CSV aquí o haz clic para seleccionarlo
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Compatible con archivos exportados de Excel o Google Sheets (.csv)
						</p>
					</div>
					<input
						id={fileInputId}
						type="file"
						accept=".csv,text/csv"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleFileUpload(file);
						}}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{/* File loaded bar */}
					<div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-lg border">
						<div className="flex items-center gap-3">
							<FileSpreadsheet className="size-6 text-emerald-600" />
							<div>
								<p className="font-medium text-sm text-foreground">
									{fileName}
								</p>
								<p className="text-xs text-muted-foreground">
									{parsedRows.length} filas leídas en el archivo
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setParsedRows([]);
								setRawText("");
								setFileName("");
							}}
							className="h-8 text-xs"
						>
							Cambiar archivo
						</Button>
					</div>

					{/* Auto-detection badge bar */}
					<div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-primary font-medium">
						<Sparkles className="size-4 shrink-0" />
						<span>Columnas detectadas automáticamente:</span>
						{mapping.nameCol !== -1 && (
							<Badge variant="outline" className="bg-background">
								Producto: {headers[mapping.nameCol]}
							</Badge>
						)}
						{mapping.priceCol !== -1 && (
							<Badge variant="outline" className="bg-background">
								Precio: {headers[mapping.priceCol]}
							</Badge>
						)}
						{mapping.costCol !== -1 && (
							<Badge variant="outline" className="bg-background">
								Costo: {headers[mapping.costCol]}
							</Badge>
						)}
						{mapping.quantityCol !== -1 && (
							<Badge variant="outline" className="bg-background">
								Cantidad: {headers[mapping.quantityCol]}
							</Badge>
						)}
						{mapping.categoryCol !== -1 ? (
							<Badge variant="outline" className="bg-background">
								Categoría: {headers[mapping.categoryCol]}
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
							>
								Categoría: Asignada por defecto
							</Badge>
						)}
						{mapping.supplierCol !== -1 && (
							<Badge variant="outline" className="bg-background">
								Proveedor: {headers[mapping.supplierCol]}
							</Badge>
						)}
					</div>

					{/* Settings & Options */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-card/60">
						<div className="space-y-1.5">
							<Label htmlFor="defaultCategory" className="text-xs font-semibold">
								Categoría Predeterminada
							</Label>
							<Input
								id="defaultCategory"
								placeholder="Ej. Limpieza, Abarrotes, etc."
								className="h-8 text-xs"
								value={options.defaultCategory}
								onChange={(e) =>
									setOptions((prev) => ({
										...prev,
										defaultCategory: e.target.value,
									}))
								}
							/>
							<p className="text-[11px] text-muted-foreground">
								Se usará para productos sin categoría especificada en el archivo.
							</p>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="duplicateAction" className="text-xs font-semibold">
								Si el producto ya existe en el inventario:
							</Label>
							<select
								id="duplicateAction"
								className="flex h-8 w-full items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
								value={duplicateAction}
								onChange={(e) => setDuplicateAction(e.target.value as any)}
							>
								<option value="update">
									Actualizar precio y existencias (Recomendado)
								</option>
								<option value="skip">Omitir producto si ya existe</option>
								<option value="create_always">
									Crear siempre como nuevo registro
								</option>
							</select>
							<p className="text-[11px] text-muted-foreground">
								Detecta coincidencias por el nombre del producto en esta
								sucursal.
							</p>
						</div>

						<div className="sm:col-span-2 flex items-center gap-2 pt-1">
							<input
								type="checkbox"
								id="carryForward"
								checked={options.carryForwardSupplier}
								onChange={(e) =>
									setOptions((prev) => ({
										...prev,
										carryForwardSupplier: e.target.checked,
									}))
								}
								className="rounded border-input text-primary focus:ring-primary size-4"
							/>
							<label
								htmlFor="carryForward"
								className="text-xs text-foreground font-medium cursor-pointer"
							>
								Arrastrar proveedor hacia abajo (Si una fila no tiene proveedor,
								hereda el anterior de su grupo)
							</label>
						</div>
					</div>

					{/* Advanced Column Mapping Toggle */}
					<div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-xs text-primary hover:text-primary/80 h-7 px-2"
							onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
						>
							<RefreshCw className="size-3 mr-1.5" />
							{showAdvancedMapping
								? "Ocultar configuración manual de columnas"
								: "Modificar mapeo de columnas manualmente"}
						</Button>

						{showAdvancedMapping && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/20 border rounded-lg mt-2 text-xs">
								<div>
									<label className="font-semibold block mb-1">
										Columna Producto *
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.nameCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												nameCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="font-semibold block mb-1">
										Columna Precio Venta *
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.priceCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												priceCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="font-semibold block mb-1">
										Columna Costo
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.costCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												costCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="font-semibold block mb-1">
										Columna Existencias / Cantidad
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.quantityCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												quantityCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="font-semibold block mb-1">
										Columna Categoría
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.categoryCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												categoryCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="font-semibold block mb-1">
										Columna Proveedor
									</label>
									<select
										className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
										value={mapping.supplierCol}
										onChange={(e) =>
											setMapping((m) => ({
												...m,
												supplierCol: Number(e.target.value),
											}))
										}
									>
										{columnOptions.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>
							</div>
						)}
					</div>

					{/* Summary KPIs */}
					<div className="grid grid-cols-3 gap-3">
						<div className="p-3 bg-muted/40 rounded-lg border text-center">
							<p className="text-xl font-bold text-foreground">
								{totalDetectedRows}
							</p>
							<p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
								<Layers className="size-3" /> Productos listos
							</p>
						</div>
						<div className="p-3 bg-muted/40 rounded-lg border text-center">
							<p className="text-xl font-bold text-foreground">
								{detectedCategories.length}
							</p>
							<p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
								<Tag className="size-3" /> Categorías
							</p>
						</div>
						<div className="p-3 bg-muted/40 rounded-lg border text-center">
							<p className="text-xl font-bold text-foreground">
								{detectedSuppliers.length}
							</p>
							<p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
								<Store className="size-3" /> Proveedores
							</p>
						</div>
					</div>

					{/* Warnings */}
					{warnings.length > 0 && (
						<div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
							<div className="flex items-center gap-1.5 font-semibold">
								<AlertCircle className="size-3.5" /> Avisos de ajuste
								automático:
							</div>
							<ul className="list-disc pl-5 space-y-0.5">
								{warnings.map((w, i) => (
									<li key={i}>{w}</li>
								))}
							</ul>
						</div>
					)}

					{/* Preview Table */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span className="font-medium">
								Vista previa de los primeros productos a importar:
							</span>
							<span>Mostrando {Math.min(10, items.length)} de {items.length}</span>
						</div>

						<div className="rounded-md border bg-card overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">Producto</TableHead>
										<TableHead className="text-xs">Categoría</TableHead>
										<TableHead className="text-xs">Proveedor</TableHead>
										<TableHead className="text-xs text-right">Existencias</TableHead>
										<TableHead className="text-xs text-right">Costo</TableHead>
										<TableHead className="text-xs text-right">Precio Venta</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.slice(0, 10).map((item, idx) => (
										<TableRow key={idx} className="text-xs">
											<TableCell className="font-medium">
												{item.name}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-[11px] font-normal">
													{item.category}
												</Badge>
											</TableCell>
											<TableCell>
												{item.supplierName ? (
													<span className="text-xs text-muted-foreground">
														{item.supplierName}
													</span>
												) : (
													<span className="text-xs text-muted-foreground/60 italic">
														Sin proveedor
													</span>
												)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{item.quantity}{" "}
												<span className="text-[11px] text-muted-foreground">
													{item.unit === "liter"
														? "L"
														: item.unit === "kilo"
															? "kg"
															: item.unit === "package"
																? "paq"
																: "pza"}
												</span>
											</TableCell>
											<TableCell className="text-right text-muted-foreground">
												{formatCurrency(item.cost)}
											</TableCell>
											<TableCell className="text-right font-bold text-foreground">
												{formatCurrency(item.price)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			)}

			{/* Actions Footer */}
			<div className="flex items-center justify-end gap-2 pt-3 border-t">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
				)}
				{parsedRows.length > 0 && (
					<Button
						onClick={handleImport}
						disabled={isSubmitting || items.length === 0}
						className="gap-2"
					>
						{isSubmitting ? (
							<>
								<RefreshCw className="size-4 animate-spin" />
								Importando {items.length} productos...
							</>
						) : (
							<>
								<CheckCircle2 className="size-4" />
								Importar {items.length} Productos
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
