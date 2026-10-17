export type UnitType = "piece" | "liter" | "kilo" | "package";

export interface ParsedProductItem {
	name: string;
	category: string;
	supplierName: string;
	cost: number;
	price: number;
	margin: number;
	quantity: number;
	unit: UnitType;
	minStock: number;
	notes?: string;
}

export interface CSVColumnMapping {
	headerRow: number;
	nameCol: number;
	supplierCol: number;
	categoryCol: number;
	quantityCol: number;
	costCol: number;
	priceCol: number;
	marginCol: number;
	unitCol: number;
}

export interface CSVImportOptions {
	defaultCategory: string;
	defaultSupplier: string;
	carryForwardSupplier: boolean;
	defaultUnit: UnitType;
}

export interface CSVParseResult {
	headers: string[];
	rows: string[][];
	detectedMapping: CSVColumnMapping;
	sampleRows: string[][];
}

/**
 * Parses raw CSV string into a 2D array of string cells.
 * Supports quotes, commas, semicolons, and CRLF / LF.
 */
export function parseCSV(text: string): string[][] {
	if (!text || text.trim().length === 0) return [];

	// Auto-detect delimiter from the first 500 characters
	const sample = text.slice(0, 1000);
	const commaCount = (sample.match(/,/g) || []).length;
	const semicolonCount = (sample.match(/;/g) || []).length;
	const tabCount = (sample.match(/\t/g) || []).length;

	let delimiter = ",";
	if (semicolonCount > commaCount && semicolonCount > tabCount) {
		delimiter = ";";
	} else if (tabCount > commaCount && tabCount > semicolonCount) {
		delimiter = "\t";
	}

	const lines: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let insideQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];

		if (char === '"') {
			if (insideQuotes && nextChar === '"') {
				cell += '"';
				i++;
			} else {
				insideQuotes = !insideQuotes;
			}
		} else if (char === delimiter && !insideQuotes) {
			row.push(cell.trim());
			cell = "";
		} else if ((char === "\r" || char === "\n") && !insideQuotes) {
			if (char === "\r" && nextChar === "\n") {
				i++;
			}
			row.push(cell.trim());
			if (row.some((c) => c.length > 0)) {
				lines.push(row);
			}
			row = [];
			cell = "";
		} else {
			cell += char;
		}
	}

	if (cell.length > 0 || row.length > 0) {
		row.push(cell.trim());
		if (row.some((c) => c.length > 0)) {
			lines.push(row);
		}
	}

	return lines;
}

/**
 * Strips currency characters, commas, and spaces to extract a valid numeric float.
 */
export function cleanPrice(str: string | undefined | null): number {
	if (!str) return 0;
	const cleaned = str.replace(/[^\d.-]/g, "");
	const val = parseFloat(cleaned);
	return isNaN(val) ? 0 : Number(val.toFixed(2));
}

/**
 * Parses a quantity string and infers the unit of measurement if included.
 * Examples: "20 L" -> { quantity: 20, unit: "liter" }
 *           "1 KG" -> { quantity: 1, unit: "kilo" }
 *           "50"   -> { quantity: 50, unit: "piece" }
 */
export function parseQuantityAndUnit(
	str: string | undefined | null,
	fallbackUnit: UnitType = "piece",
): { quantity: number; unit: UnitType } {
	if (!str || str.trim().length === 0) {
		return { quantity: 0, unit: fallbackUnit };
	}

	const lower = str.toLowerCase();
	let unit: UnitType = fallbackUnit;

	if (/(\bl\b|\blt\b|\blts\b|\blitro\b|\blitros\b)/i.test(lower)) {
		unit = "liter";
	} else if (/(\bkg\b|\bkilo\b|\bkilos\b|\bgr\b|\bgramos\b)/i.test(lower)) {
		unit = "kilo";
	} else if (/(\bpaq\b|\bpaquete\b|\bpaquetes\b|\bpq\b)/i.test(lower)) {
		unit = "package";
	}

	const cleaned = str.replace(/[^\d.-]/g, "");
	const qty = parseFloat(cleaned);
	return {
		quantity: isNaN(qty) ? 0 : Number(qty.toFixed(3)),
		unit,
	};
}

/**
 * Automatically inspects the first few rows to locate the header row and map columns.
 */
export function detectCSVStructure(allRows: string[][]): CSVColumnMapping {
	let headerRow = 0;
	let nameCol = -1;
	let supplierCol = -1;
	let categoryCol = -1;
	let quantityCol = -1;
	let costCol = -1;
	let priceCol = -1;
	let marginCol = -1;
	let unitCol = -1;

	// Search up to the first 15 rows for a plausible header row
	for (let r = 0; r < Math.min(15, allRows.length); r++) {
		const row = allRows[r];
		for (let c = 0; c < row.length; c++) {
			const cell = (row[c] || "").toUpperCase().trim();

			if (
				nameCol === -1 &&
				/^(PRODUCTO|PRODUCTOS|NOMBRE|ARTICULO|DESCRIPCION|ITEM|PRODUCT)/i.test(
					cell,
				)
			) {
				nameCol = c;
				headerRow = r;
			}
			if (
				supplierCol === -1 &&
				/^(TIENDA|PROVEEDOR|PROVEEDORES|DISTRIBUIDOR|MARCA|SUPPLIER)/i.test(
					cell,
				)
			) {
				supplierCol = c;
			}
			if (
				categoryCol === -1 &&
				/^(CLASIFICACION|CATEGORIA|CATEGORIAS|RUBRO|FAMILIA|GRUPO|LINEA|CATEGORY)/i.test(
					cell,
				)
			) {
				categoryCol = c;
			}
			if (
				quantityCol === -1 &&
				/^(CANTIDAD|STOCK|EXISTENCIA|EXISTENCIAS|UNIDADES|PZAS|QTY)/i.test(cell)
			) {
				quantityCol = c;
			}
			if (
				costCol === -1 &&
				/^(PRECIO C\/U|COSTO|PRECIO COMPRA|PRECIO UNITARIO|UNIT COST|COST)/i.test(
					cell,
				)
			) {
				costCol = c;
			}
			if (
				priceCol === -1 &&
				/^(PRECIO FINAL|PRECIO VENTA|VENTA|PUBLICO|PRECIO PUBLICO|SALE PRICE|PVP)/i.test(
					cell,
				)
			) {
				priceCol = c;
			}
			if (
				marginCol === -1 &&
				/(50%|CON 50%|MARGEN|UTILIDAD|GANANCIA|%)/i.test(cell)
			) {
				marginCol = c;
			}
			if (
				unitCol === -1 &&
				/^(UNIDAD|MEDIDA|U\.M\.|UNIDAD DE MEDIDA|UNIT)/i.test(cell)
			) {
				unitCol = c;
			}
		}

		if (nameCol !== -1) {
			headerRow = r;
			break;
		}
	}

	// Secondary check: if cost is not detected but a generic "PRECIO" column exists
	if (nameCol !== -1 && allRows[headerRow]) {
		const hRow = allRows[headerRow];
		for (let c = 0; c < hRow.length; c++) {
			const cell = (hRow[c] || "").toUpperCase().trim();
			if (cell === "PRECIO") {
				if (priceCol === -1 && costCol !== -1) {
					priceCol = c;
				} else if (costCol === -1 && priceCol !== -1) {
					costCol = c;
				} else if (costCol === -1 && priceCol === -1) {
					costCol = c;
				}
			}
		}
	}

	return {
		headerRow,
		nameCol,
		supplierCol,
		categoryCol,
		quantityCol,
		costCol,
		priceCol,
		marginCol,
		unitCol,
	};
}

/**
 * Transforms parsed rows into normalized product objects according to mapping and options.
 */
export function transformRowsToProducts(
	allRows: string[][],
	mapping: CSVColumnMapping,
	options: CSVImportOptions,
): {
	items: ParsedProductItem[];
	totalDetectedRows: number;
	skippedRows: number;
	warnings: string[];
} {
	const items: ParsedProductItem[] = [];
	const warnings: string[] = [];
	let skippedRows = 0;

	if (mapping.nameCol === -1 || mapping.headerRow >= allRows.length) {
		return {
			items: [],
			totalDetectedRows: 0,
			skippedRows: 0,
			warnings: ["No se pudo identificar la columna con el nombre del producto."],
		};
	}

	let currentSupplier = options.defaultSupplier.trim();

	for (let r = mapping.headerRow + 1; r < allRows.length; r++) {
		const row = allRows[r];
		if (!row || row.length === 0) continue;

		// Carry-forward / current supplier logic
		if (mapping.supplierCol !== -1 && row[mapping.supplierCol]) {
			const val = row[mapping.supplierCol].trim();
			if (val.length > 0) {
				currentSupplier = val;
			}
		} else if (!options.carryForwardSupplier) {
			currentSupplier = options.defaultSupplier.trim();
		}

		// Product name check
		const rawName = (row[mapping.nameCol] || "").trim();
		if (!rawName || /^(LISTA PRODUCTOS PENDIENTES|PENDIENTES|TOTAL)$/i.test(rawName)) {
			// This row might be a category or supplier separator header
			skippedRows++;
			continue;
		}

		// Category
		let category = options.defaultCategory.trim() || "General";
		if (mapping.categoryCol !== -1 && row[mapping.categoryCol]) {
			const catVal = row[mapping.categoryCol].trim();
			if (catVal.length > 0) {
				category = catVal;
			}
		}

		// Supplier
		const supplierName = currentSupplier || options.defaultSupplier.trim();

		// Cost
		const cost =
			mapping.costCol !== -1 ? cleanPrice(row[mapping.costCol]) : 0;

		// Price & Margin
		let price =
			mapping.priceCol !== -1 ? cleanPrice(row[mapping.priceCol]) : 0;

		// Intelligent fallback for price if empty or 0:
		if (price === 0 && mapping.marginCol !== -1 && row[mapping.marginCol]) {
			const marginPrice = cleanPrice(row[mapping.marginCol]);
			if (marginPrice > 0) {
				price = marginPrice;
			}
		}
		if (price === 0 && cost > 0) {
			price = Number((cost * 1.5).toFixed(2));
			warnings.push(
				`Fila ${r + 1} (${rawName}): Sin precio de venta, se estimó con margen 50% ($${price}).`,
			);
		}

		// Compute margin
		let margin = 0;
		if (cost > 0 && price > 0) {
			margin = Number(((price / cost - 1) * 100).toFixed(2));
		}

		// Quantity & Unit
		let quantity = 0;
		let unit = options.defaultUnit;

		if (mapping.quantityCol !== -1 && row[mapping.quantityCol]) {
			const parsed = parseQuantityAndUnit(
				row[mapping.quantityCol],
				options.defaultUnit,
			);
			quantity = parsed.quantity;
			unit = parsed.unit;
		}

		if (mapping.unitCol !== -1 && row[mapping.unitCol]) {
			const uStr = row[mapping.unitCol].toLowerCase().trim();
			if (uStr.includes("lit") || uStr === "l") unit = "liter";
			else if (uStr.includes("kilo") || uStr === "kg") unit = "kilo";
			else if (uStr.includes("paq") || uStr === "pq") unit = "package";
			else if (uStr.includes("piez") || uStr === "pza") unit = "piece";
		}

		items.push({
			name: rawName,
			category,
			supplierName,
			cost,
			price,
			margin,
			quantity,
			unit,
			minStock: 1,
		});
	}

	return {
		items,
		totalDetectedRows: items.length,
		skippedRows,
		warnings: warnings.slice(0, 5), // Keep only top 5 warnings for clean UI
	};
}
