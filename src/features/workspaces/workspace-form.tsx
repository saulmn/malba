import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { workspaceSchema, type WorkspaceFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceForm({
	onSubmit,
	onCancel,
}: {
	onSubmit: (data: WorkspaceFormValues) => void | Promise<void>;
	onCancel?: () => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<WorkspaceFormValues>({
		resolver: zodResolver(workspaceSchema),
	});

	const onFormSubmit = async (data: WorkspaceFormValues) => {
		await onSubmit(data);
	};

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre de la Sucursal</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="Ej. Matriz Centro"
					disabled={isSubmitting}
				/>
				{errors.name && (
					<p className="text-sm text-red-500">{errors.name.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="location">Ubicación</Label>
				<Input
					id="location"
					{...register("location")}
					placeholder="Dirección completa"
					disabled={isSubmitting}
				/>
			</div>

			<div className="flex justify-end gap-2 pt-4">
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
				<Button
					type="submit"
					disabled={isSubmitting}
					className="flex items-center gap-2"
				>
					{isSubmitting && <Loader2 className="size-4 animate-spin" />}
					{isSubmitting ? "Guardando..." : "Guardar Sucursal"}
				</Button>
			</div>
		</form>
	);
}
