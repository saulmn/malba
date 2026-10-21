import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { WorkspaceForm } from "@/features/workspaces/workspace-form";
import { createWorkspaceFn, getWorkspacesFn } from "@/server/workspaces";
import type { WorkspaceFormValues } from "@/utils/validations";

export const Route = createFileRoute("/sucursales")({
	beforeLoad: ({ context }) => {
		if ((context as any)?.user?.role !== "master") {
			throw redirect({ to: "/ventas" });
		}
	},
	component: RouteComponent,
	loader: async () => {
		return await getWorkspacesFn();
	},
});

function RouteComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const data = Route.useLoaderData();
	const router = useRouter();

	const handleCreateWorkspace = async (formData: WorkspaceFormValues) => {
		try {
			await createWorkspaceFn({ data: formData });
			toast.success("Sucursal creada exitosamente");
			setIsDialogOpen(false);
			router.invalidate(); // Reload data
		} catch (error) {
			toast.error("Error al crear sucursal");
			console.error(error);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>

				<ResponsiveDialog
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					title="Agregar Nueva Sucursal"
					trigger={
						<Button className="flex items-center gap-2">
							<Plus size={16} /> Nueva Sucursal
						</Button>
					}
				>
					<WorkspaceForm
						onSubmit={handleCreateWorkspace}
						onCancel={() => setIsDialogOpen(false)}
					/>
				</ResponsiveDialog>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{data.length === 0 ? (
					<p className="text-muted-foreground">
						No hay sucursales registradas.
					</p>
				) : (
					data.map((workspace) => (
						<Card key={workspace.id}>
							<CardHeader>
								<CardTitle>{workspace.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Ubicación: {workspace.location || "No especificada"}
								</p>
								<p className="text-xs text-muted-foreground mt-4">
									Registrada:{" "}
									{new Date(workspace.createdAt).toLocaleDateString()}
								</p>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
