import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Store, Users, ShieldAlert } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { UserForm } from "@/features/users/user-form";
import {
	createUserFn,
	updateUserFn,
	deleteUserFn,
	getUsersFn,
} from "@/server/users";
import { getWorkspacesFn } from "@/server/workspaces";

export const Route = createFileRoute("/usuarios")({
	component: RouteComponent,
	loader: async () => {
		const [usersList, workspacesList] = await Promise.all([
			getUsersFn(),
			getWorkspacesFn(),
		]);
		return { users: usersList, workspaces: workspacesList };
	},
});

function RouteComponent() {
	const { users: data, workspaces } = Route.useLoaderData();
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<any | null>(null);

	const handleCreateOrUpdateUser = async (formData: any) => {
		try {
			if (editingUser) {
				await updateUserFn({
					data: {
						...formData,
						id: editingUser.id,
					},
				});
				toast.success("Usuario actualizado exitosamente");
			} else {
				await createUserFn({ data: formData });
				toast.success("Usuario creado exitosamente");
			}
			setIsDialogOpen(false);
			setEditingUser(null);
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al procesar usuario");
		}
	};

	const handleDeleteUser = async (id: number, name: string) => {
		if (!confirm(`¿Estás seguro de eliminar al usuario "${name}"? Esta acción cancelará sus accesos al sistema.`)) {
			return;
		}

		try {
			await deleteUserFn({ data: { id } });
			toast.success("Usuario eliminado exitosamente");
			router.invalidate();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Error al eliminar usuario");
		}
	};

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "master":
				return <Badge className="bg-purple-600 hover:bg-purple-700">Master</Badge>;
			case "admin":
				return <Badge className="bg-blue-600 hover:bg-blue-700">Admin</Badge>;
			case "manager":
				return <Badge className="bg-amber-600 hover:bg-amber-700">Gerente</Badge>;
			default:
				return <Badge variant="secondary">Cajero / Staff</Badge>;
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Administra cuentas, roles y asignación a sucursales
					</p>
				</div>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						setIsDialogOpen(open);
						if (!open) setEditingUser(null);
					}}
					title={editingUser ? "Editar Usuario y Sucursales" : "Agregar Nuevo Usuario"}
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nuevo Usuario
						</Button>
					}
				>
					<UserForm
						key={editingUser ? `edit-${editingUser.id}` : "new"}
						initialData={
							editingUser
								? {
										id: editingUser.id,
										name: editingUser.name,
										username: editingUser.username || "",
										email: editingUser.email,
										role: editingUser.role,
										activeStoreId: editingUser.activeStore,
										assignedWorkspaceIds: editingUser.assignedWorkspaces.map(
											(w: any) => w.id,
										),
									}
								: undefined
						}
						workspaces={workspaces}
						onSubmit={handleCreateOrUpdateUser}
						onCancel={() => {
							setIsDialogOpen(false);
							setEditingUser(null);
						}}
					/>
				</ResponsiveDialog>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Users className="size-4 text-primary" />
						Usuarios del Sistema ({data.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border rounded-md overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-muted/30 border-b">
								<tr>
									<th className="px-4 py-3 font-medium text-foreground">Nombre y Usuario</th>
									<th className="px-4 py-3 font-medium text-foreground">Correo</th>
									<th className="px-4 py-3 font-medium text-foreground">Rol</th>
									<th className="px-4 py-3 font-medium text-foreground">Sucursal Predeterminada</th>
									<th className="px-4 py-3 font-medium text-foreground">Sucursales con Acceso</th>
									<th className="px-4 py-3 font-medium text-foreground text-right">Acciones</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{data.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-8 text-center text-muted-foreground"
										>
											No hay usuarios registrados.
										</td>
									</tr>
								) : (
									data.map((user) => (
										<tr key={user.id} className="hover:bg-muted/40 transition-colors">
											<td className="px-4 py-3 font-medium">
												<div className="flex flex-col">
													<span className="text-foreground">{user.name}</span>
													{user.username && (
														<span className="text-xs text-muted-foreground">
															@{user.username}
														</span>
													)}
												</div>
											</td>
											<td className="px-4 py-3 text-muted-foreground">{user.email}</td>
											<td className="px-4 py-3">{getRoleBadge(user.role)}</td>
											<td className="px-4 py-3">
												{user.activeWorkspaceName ? (
													<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
														<Store className="size-3" />
														{user.activeWorkspaceName}
													</span>
												) : (
													<span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
														Sin asignar
													</span>
												)}
											</td>
											<td className="px-4 py-3">
												{user.role === "master" ? (
													<Badge variant="outline" className="text-xs border-purple-500/30 text-purple-700 dark:text-purple-300">
														Todas (Master)
													</Badge>
												) : user.assignedWorkspaces.length > 0 ? (
													<div className="flex flex-wrap gap-1">
														{user.assignedWorkspaces.map((w: any) => (
															<Badge key={w.id} variant="secondary" className="text-[11px] font-normal">
																{w.name}
															</Badge>
														))}
													</div>
												) : (
													<span className="text-xs text-muted-foreground/60 italic">
														Ninguna
													</span>
												)}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1.5 text-xs font-medium"
														onClick={() => {
															setEditingUser(user);
															setIsDialogOpen(true);
														}}
													>
														<Edit2 className="size-3.5" />
														Editar
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
														onClick={() => handleDeleteUser(user.id, user.name)}
													>
														<Trash2 className="size-4" />
													</Button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
