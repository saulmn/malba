import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { users, workspaces, workspaceUsers, authSessions } from "@/db/schema";
import { userSchema } from "@/utils/validations";
import { getSessionFn } from "./auth";
import { eq, and, not } from "drizzle-orm";
import { z } from "zod";

export const getUsersFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const currentUser = await getSessionFn();
		if (!currentUser) {
			throw new Error("No autenticado");
		}

		const results = await db.query.users.findMany({
			with: {
				activeWorkspace: true,
				workspaceUsers: {
					with: {
						workspace: true,
					},
				},
			},
			orderBy: (u, { asc }) => [asc(u.name)],
		});

		return results.map((u) => ({
			id: u.id,
			name: u.name,
			username: u.username,
			email: u.email,
			role: u.role,
			activeStore: u.activeStore,
			activeWorkspaceName: u.activeWorkspace?.name || null,
			assignedWorkspaces: u.workspaceUsers.map((wu) => ({
				id: wu.workspace.id,
				name: wu.workspace.name,
			})),
			createdAt: u.createdAt,
		}));
	},
);

export const createUserFn = createServerFn({ method: "POST" })
	.validator(
		(
			data: z.infer<typeof userSchema> & {
				workspaceIds?: number[];
				activeStoreId?: number | null;
			},
		) => data,
	)
	.handler(async ({ data }) => {
		const currentUser = await getSessionFn();
		if (!currentUser || (currentUser.role !== "master" && currentUser.role !== "admin")) {
			throw new Error("No tienes permisos para crear usuarios");
		}

		if (!data.password || data.password.length < 6) {
			throw new Error("La contraseña debe tener al menos 6 caracteres");
		}

		// Determinar sucursal activa inicial
		let activeStore = data.activeStoreId || (data.workspaceIds && data.workspaceIds[0]) || null;

		// Si no tiene sucursal asignada pero hay sucursales en el sistema
		if (!activeStore && data.role === "master") {
			const firstWs = await db.query.workspaces.findFirst();
			if (firstWs) activeStore = firstWs.id;
		}

		const passwordHash = `hashed_${data.password}`;

		const [newUser] = await db
			.insert(users)
			.values({
				name: data.name,
				username: data.username || null,
				email: data.email,
				passwordHash: passwordHash,
				role: data.role,
				activeStore: activeStore,
			})
			.returning();

		// Asociar sucursales seleccionadas en workspace_users
		if (data.workspaceIds && data.workspaceIds.length > 0) {
			const workspaceUsersData = data.workspaceIds.map((wId) => ({
				userId: newUser.id,
				workspaceId: wId,
			}));
			await db.insert(workspaceUsers).values(workspaceUsersData);
		}

		return newUser;
	});

export const updateUserFn = createServerFn({ method: "POST" })
	.validator(
		(
			data: z.infer<typeof userSchema> & {
				id: number;
				workspaceIds?: number[];
				activeStoreId?: number | null;
			},
		) => data,
	)
	.handler(async ({ data }) => {
		const currentUser = await getSessionFn();
		if (!currentUser || (currentUser.role !== "master" && currentUser.role !== "admin")) {
			throw new Error("No tienes permisos para editar usuarios");
		}

		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, data.id),
		});

		if (!existingUser) {
			throw new Error("Usuario no encontrado");
		}

		// Determinar sucursal activa
		let targetActiveStore = data.activeStoreId || null;
		if (!targetActiveStore && data.workspaceIds && data.workspaceIds.length > 0) {
			targetActiveStore = data.workspaceIds[0];
		} else if (!targetActiveStore && data.role === "master") {
			const firstWs = await db.query.workspaces.findFirst();
			if (firstWs) targetActiveStore = firstWs.id;
		}

		const updatePayload: Record<string, any> = {
			name: data.name,
			username: data.username || null,
			email: data.email,
			role: data.role,
			activeStore: targetActiveStore,
		};

		// Actualizar contraseña solo si se envió una nueva
		if (data.password && data.password.trim().length > 0) {
			if (data.password.length < 6) {
				throw new Error("La contraseña debe tener al menos 6 caracteres");
			}
			updatePayload.passwordHash = `hashed_${data.password}`;
		}

		const [updated] = await db
			.update(users)
			.set(updatePayload)
			.where(eq(users.id, data.id))
			.returning();

		// Sincronizar sucursales asignadas en workspace_users
		await db.delete(workspaceUsers).where(eq(workspaceUsers.userId, data.id));

		if (data.workspaceIds && data.workspaceIds.length > 0) {
			const workspaceUsersData = data.workspaceIds.map((wId) => ({
				userId: data.id,
				workspaceId: wId,
			}));
			await db.insert(workspaceUsers).values(workspaceUsersData);
		}

		return updated;
	});

export const deleteUserFn = createServerFn({ method: "POST" })
	.validator((data: { id: number }) => data)
	.handler(async ({ data }) => {
		const currentUser = await getSessionFn();
		if (!currentUser || currentUser.role !== "master") {
			throw new Error("Solo una cuenta master puede eliminar usuarios");
		}

		if (currentUser.id === data.id) {
			throw new Error("No puedes eliminar tu propia cuenta");
		}

		// Eliminar sesiones activas y asignaciones
		await db.delete(authSessions).where(eq(authSessions.userId, data.id));
		await db.delete(workspaceUsers).where(eq(workspaceUsers.userId, data.id));
		await db.delete(users).where(eq(users.id, data.id));

		return { success: true };
	});
