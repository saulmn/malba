import * as React from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export interface SearchableOption {
	value: string;
	label: string;
	sublabel?: string;
}

interface SearchableSelectProps {
	options: SearchableOption[];
	value?: string | number | null;
	onChange: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	allowCreate?: boolean;
	createLabel?: string;
	className?: string;
	disabled?: boolean;
}

export function SearchableSelect({
	options,
	value,
	onChange,
	placeholder = "Seleccionar...",
	searchPlaceholder = "Buscar...",
	emptyText = "No se encontraron resultados",
	allowCreate = false,
	createLabel = "Crear",
	className,
	disabled = false,
}: SearchableSelectProps) {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState("");

	const stringValue = value !== undefined && value !== null ? String(value) : "";

	const selectedOption = options.find((opt) => opt.value === stringValue);

	const filteredOptions = React.useMemo(() => {
		if (!query.trim()) return options;
		const q = query.toLowerCase().trim();
		return options.filter(
			(opt) =>
				opt.label.toLowerCase().includes(q) ||
				(opt.sublabel && opt.sublabel.toLowerCase().includes(q)),
		);
	}, [options, query]);

	const exactMatch = options.some(
		(opt) => opt.label.toLowerCase() === query.toLowerCase().trim(),
	);

	const handleSelect = (val: string) => {
		onChange(val);
		setOpen(false);
		setQuery("");
	};

	const handleCreate = () => {
		if (!query.trim()) return;
		const trimmed = query.trim();
		onChange(trimmed);
		setOpen(false);
		setQuery("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							"flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs font-normal focus:outline-hidden focus:ring-1 focus:ring-ring",
							!selectedOption && "text-muted-foreground",
							className,
						)}
					>
						<span className="truncate">
							{selectedOption ? selectedOption.label : placeholder}
						</span>
						<ChevronDown className="size-4 shrink-0 opacity-50 ml-2" />
					</Button>
				}
			/>
			<PopoverContent align="start" className="w-(--anchor-width) min-w-[220px] p-1.5 shadow-md">
				{/* Search box inside popover */}
				<div className="flex items-center gap-2 border-b px-2 pb-1.5 pt-0.5">
					<Search className="size-3.5 shrink-0 text-muted-foreground" />
					<input
						type="text"
						className="flex-1 bg-transparent text-xs outline-hidden placeholder:text-muted-foreground"
						placeholder={searchPlaceholder}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						autoFocus
					/>
				</div>

				{/* Options list */}
				<div className="max-h-56 overflow-y-auto pt-1 flex flex-col gap-0.5">
					{filteredOptions.length === 0 && !allowCreate && (
						<p className="px-2 py-3 text-xs text-muted-foreground text-center">
							{emptyText}
						</p>
					)}

					{allowCreate && query.trim() && !exactMatch && (
						<button
							type="button"
							onClick={handleCreate}
							className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-primary font-medium rounded-md hover:bg-primary/10 transition-colors text-left"
						>
							<Plus className="size-3.5 shrink-0" />
							<span>
								{createLabel} "{query.trim()}"
							</span>
						</button>
					)}

					{filteredOptions.map((opt) => {
						const isSelected = opt.value === stringValue;
						return (
							<button
								key={opt.value}
								type="button"
								onClick={() => handleSelect(opt.value)}
								className={cn(
									"flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-md transition-colors text-left",
									isSelected
										? "bg-primary/10 text-primary font-semibold"
										: "hover:bg-muted text-foreground",
								)}
							>
								<div className="flex flex-col truncate pr-2">
									<span className="truncate">{opt.label}</span>
									{opt.sublabel && (
										<span className="text-[10px] text-muted-foreground truncate">
											{opt.sublabel}
										</span>
									)}
								</div>
								{isSelected && <Check className="size-3.5 text-primary shrink-0" />}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
