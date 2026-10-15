import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormValues } from "@/utils/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store, ShieldCheck } from "lucide-react";

interface WorkspaceOption {
	id: number;
	name: string;
	location?: string | null;
}

interface UserFormProps {
	initialData?: Partial<UserFormValues> & {
		id?: number;
		assignedWorkspaceIds?: number[];
	};
	workspaces: WorkspaceOption[];
	onSubmit: (data: UserFormValues & { workspaceIds: number[]; activeStoreId: number | null }) => void;
	onCancel?: () => void;
}

export function UserForm({
	initialData,
	workspaces,
	onSubmit,
	onCancel,
}: UserFormProps) {
	const isEdit = !!initialData?.id;

	const [selectedWorkspaces, setSelectedWorkspaces] = useState<number[]>(
		initialData?.assignedWorkspaceIds || (initialData?.activeStoreId ? [initialData.activeStoreId] : []),
	);

	const [activeStoreId, setActiveStoreId] = useState<number | null>(
		initialData?.activeStoreId || (workspaces.length > 0 ? workspaces[0].id : null),
	);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<UserFormValues>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			name: initialData?.name || "",
			username: initialData?.username || "",
			email: initialData?.email || "",
			password: "",
			role: initialData?.role || "staff",
		},
	});

	const selectedRole = watch("role");

	const handleWorkspaceToggle = (workspaceId: number) => {
		setSelectedWorkspaces((prev) => {
			const next = prev.includes(workspaceId)
				? prev.filter((id) => id !== workspaceId)
				: [...prev, workspaceId];

			// If current activeStoreId was deselected, reassign to first remaining or null
			if (!next.includes(activeStoreId || -1)) {
				setActiveStoreId(next.length > 0 ? next[0] : null);
			}

			return next;
		});
	};

	const onFormSubmit = (data: UserFormValues) => {
		onSubmit({
			...data,
			workspaceIds: selectedRole === "master" ? workspaces.map((w) => w.id) : selectedWorkspaces,
			activeStoreId: activeStoreId,
		});
	};

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre Completo *</Label>
				<Input id="name" {...register("name")} placeholder="Ej. Juan Pérez" />
				{errors.name && (
					<p className="text-xs text-destructive">{errors.name.message}</p>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="username" className="text-xs">
						Nombre de Usuario (Opcional)
					</Label>
					<Input
						id="username"
						{...register("username")}
						placeholder="juanperez"
					/>
					{errors.username && (
						<p className="text-xs text-destructive">
							{errors.username.message}
						</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="email" className="text-xs">
						Correo Electrónico *
					</Label>
					<Input
						id="email"
						type="email"
						{...register("email")}
						placeholder="juan@ejemplo.com"
					/>
					{errors.email && (
						<p className="text-xs text-destructive">{errors.email.message}</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label htmlFor="password" className="text-xs">
						{isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña *"}
					</Label>
					<Input
						id="password"
						type="password"
						{...register("password")}
						placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
					/>
					{errors.password && (
						<p className="text-xs text-destructive">
							{errors.password.message}
						</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="role" className="text-xs">
						Rol de Permisos *
					</Label>
					<select
						id="role"
						{...register("role")}
						className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
					>
						<option value="staff">Vendedor / Cajero (Staff)</option>
						<option value="manager">Gerente (Manager)</option>
						<option value="admin">Administrador (Admin)</option>
						<option value="master">Cuenta Maestra (Master)</option>
					</select>
					{errors.role && (
						<p className="text-xs text-destructive">{errors.role.message}</p>
					)}
				</div>
			</div>

			{/* Sucursales Asignadas */}
			<div className="space-y-2 pt-2 border-t">
				<div className="flex items-center justify-between">
					<Label className="text-sm font-semibold flex items-center gap-1.5">
						<Store className="size-4 text-primary" /> Sucursales Asignadas
					</Label>
					{selectedRole === "master" && (
						<Badge variant="secondary" className="text-xs gap-1">
							<ShieldCheck className="size-3 text-emerald-600" />
							Acceso Total (Master)
						</Badge>
					)}
				</div>

				{selectedRole === "master" ? (
					<p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md border">
						Como cuenta Master, este usuario tiene acceso a todas las sucursales del sistema de forma automática.
					</p>
				) : (
					<div className="space-y-1.5 max-h-36 overflow-y-auto rounded-md border p-2 bg-muted/20">
						{workspaces.length === 0 ? (
							<p className="text-xs text-muted-foreground p-2">
								No hay sucursales registradas en el sistema.
							</p>
						) : (
							workspaces.map((ws) => {
								const isChecked = selectedWorkspaces.includes(ws.id);
								return (
									<label
										key={ws.id}
										className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
									>
										<input
											type="checkbox"
											checked={isChecked}
											onChange={() => handleWorkspaceToggle(ws.id)}
											className="rounded border-input text-primary focus:ring-primary size-4"
										/>
										<span className="font-medium">{ws.name}</span>
										{ws.location && (
											<span className="text-[11px] text-muted-foreground truncate">
												({ws.location})
											</span>
										)}
									</label>
								);
							})
						)}
					</div>
				)}
			</div>

			{/* Sucursal Activa Predeterminada */}
			<div className="space-y-1.5">
				<Label htmlFor="activeStoreId" className="text-xs">
					Sucursal Activa Inicial / Predeterminada *
				</Label>
				<select
					id="activeStoreId"
					value={activeStoreId ? String(activeStoreId) : ""}
					onChange={(e) => setActiveStoreId(e.target.value ? Number(e.target.value) : null)}
					className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
				>
					<option value="">Selecciona sucursal activa inicial</option>
					{(selectedRole === "master"
						? workspaces
						: workspaces.filter((w) => selectedWorkspaces.includes(w.id))
					).map((ws) => (
						<option key={ws.id} value={String(ws.id)}>
							{ws.name} {ws.location ? `(${ws.location})` : ""}
						</option>
					))}
				</select>
				<p className="text-[11px] text-muted-foreground">
					Es la sucursal que se activará automáticamente cuando este usuario inicie sesión en la app.
				</p>
			</div>

			<div className="flex justify-end gap-2 pt-3 border-t">
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
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? "Guardando..."
						: isEdit
							? "Guardar Cambios"
							: "Crear Usuario"}
				</Button>
			</div>
		</form>
	);
}
