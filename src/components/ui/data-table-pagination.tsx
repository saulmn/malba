import * as React from "react";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
	pageSizeOptions?: number[];
}

export function DataTablePagination({
	currentPage,
	totalPages,
	pageSize,
	totalItems,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions = [10, 20, 50],
}: DataTablePaginationProps) {
	if (totalItems === 0) return null;

	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, totalItems);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-xs text-muted-foreground">
			<div className="flex items-center gap-2">
				<span>
					Mostrando <strong className="text-foreground">{startItem}</strong> a{" "}
					<strong className="text-foreground">{endItem}</strong> de{" "}
					<strong className="text-foreground">{totalItems}</strong> registros
				</span>
			</div>

			<div className="flex items-center gap-4 sm:gap-6">
				{onPageSizeChange && (
					<div className="flex items-center gap-1.5">
						<span>Por página:</span>
						<select
							value={pageSize}
							onChange={(e) => onPageSizeChange(Number(e.target.value))}
							className="h-8 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
						>
							{pageSizeOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				)}

				<div className="flex items-center gap-1 font-medium text-foreground">
					<span>
						Página {currentPage} de {Math.max(1, totalPages)}
					</span>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(1)}
						disabled={currentPage <= 1}
						title="Primera página"
					>
						<ChevronsLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage <= 1}
						title="Página anterior"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage >= totalPages}
						title="Página siguiente"
					>
						<ChevronRight className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(totalPages)}
						disabled={currentPage >= totalPages}
						title="Última página"
					>
						<ChevronsRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
