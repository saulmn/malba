"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	variant?: "destructive" | "default";
	icon?: "trash" | "warning" | "info";
	isLoading?: boolean;
	onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title = "¿Estás seguro?",
	description,
	confirmText = "Eliminar",
	cancelText = "Cancelar",
	variant = "destructive",
	icon = "warning",
	isLoading = false,
	onConfirm,
}: ConfirmDialogProps) {
	const [submitting, setSubmitting] = React.useState(false);

	const handleConfirm = async () => {
		try {
			setSubmitting(true);
			await onConfirm();
			onOpenChange(false);
		} catch (error) {
			console.error("Error confirming action:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const busy = isLoading || submitting;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[420px]" showCloseButton={!busy}>
				<div className="flex gap-3.5 items-start">
					<div
						className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
							variant === "destructive"
								? "bg-destructive/10 text-destructive"
								: "bg-primary/10 text-primary"
						}`}
					>
						{icon === "trash" ? (
							<Trash2 className="size-5" />
						) : icon === "info" ? (
							<Info className="size-5" />
						) : (
							<AlertTriangle className="size-5" />
						)}
					</div>
					<div className="flex flex-col gap-1.5 flex-1 pt-0.5">
						<DialogHeader className="text-left">
							<DialogTitle className="text-base font-semibold leading-snug">
								{title}
							</DialogTitle>
						</DialogHeader>
						{description && (
							<DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
								{description}
							</DialogDescription>
						)}
					</div>
				</div>

				<DialogFooter className="mt-4 gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={busy}
						onClick={() => onOpenChange(false)}
					>
						{cancelText}
					</Button>
					<Button
						type="button"
						variant={variant === "destructive" ? "destructive" : "default"}
						size="sm"
						disabled={busy}
						onClick={handleConfirm}
						className={
							variant === "destructive"
								? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
								: ""
						}
					>
						{busy && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
