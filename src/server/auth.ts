import { createServerFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { randomBytes } from "crypto";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users, workspaces, workspaceUsers } from "@/db/schema";

export const loginFn = createServerFn({ method: "POST" })
	.validator((data: { identifier: string; password: string }) => data)
	.handler(async ({ data }) => {
		// 1. Find user by email OR username
		const user = await db.query.users.findFirst({
			where: or(
				eq(users.email, data.identifier),
				eq(users.username, data.identifier),
			),
		});

		if (!user) {
			throw new Error("Usuario no encontrado");
		}

		if (user.passwordHash !== `hashed_${data.password}`) {
			throw new Error("Contraseña incorrecta");
		}

		// Check/assign activeStore if not set or invalid
		let activeStoreId = user.activeStore;
		if (activeStoreId) {
			const exists = await db.query.workspaces.findFirst({
				where: eq(workspaces.id, activeStoreId),
			});
			if (!exists) activeStoreId = null;
		}

		if (!activeStoreId) {
			if (user.role === "master") {
				const firstWs = await db.query.workspaces.findFirst();
				if (firstWs) activeStoreId = firstWs.id;
			} else {
				const firstWu = await db.query.workspaceUsers.findFirst({
					where: eq(workspaceUsers.userId, user.id),
				});
				if (firstWu) activeStoreId = firstWu.workspaceId;
			}

			if (activeStoreId) {
				await db
					.update(users)
					.set({ activeStore: activeStoreId })
					.where(eq(users.id, user.id));
			}
		}

		// 2. Create session
		const sessionId = randomBytes(16).toString("hex");
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

		await db.insert(authSessions).values({
			id: sessionId,
			userId: user.id,
			expiresAt,
		});

		// 3. Set cookie
		setCookie("auth_session", sessionId, {
			httpOnly: true,
			path: "/",
			secure: process.env.NODE_ENV === "production",
			expires: expiresAt,
		});

		return {
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				activeStore: activeStoreId,
			},
		};
	});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const sessionId = getCookie("auth_session");
	if (sessionId) {
		await db.delete(authSessions).where(eq(authSessions.id, sessionId));
	}
	deleteCookie("auth_session");
	return { success: true };
});

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const sessionId = getCookie("auth_session");
		if (!sessionId) return null;

		const session = await db.query.authSessions.findFirst({
			where: eq(authSessions.id, sessionId),
			with: {
				user: {
					with: {
						activeWorkspace: true,
					},
				},
			},
		});

		if (!session || session.expiresAt < new Date()) {
			return null;
		}

		const user = session.user;

		// If user doesn't have an activeWorkspace resolved, auto-resolve first accessible
		if (!user.activeWorkspace) {
			let storeId: number | null = null;
			if (user.role === "master") {
				const firstWs = await db.query.workspaces.findFirst();
				if (firstWs) storeId = firstWs.id;
			} else {
				const firstWu = await db.query.workspaceUsers.findFirst({
					where: eq(workspaceUsers.userId, user.id),
				});
				if (firstWu) storeId = firstWu.workspaceId;
			}

			if (storeId) {
				await db
					.update(users)
					.set({ activeStore: storeId })
					.where(eq(users.id, user.id));

				const resolvedWs = await db.query.workspaces.findFirst({
					where: eq(workspaces.id, storeId),
				});

				return {
					...user,
					activeStore: storeId,
					activeWorkspace: resolvedWs || null,
				};
			}
		}

		return user;
	},
);

export async function getAuthenticatedUserWithActiveStore() {
	const user = await getSessionFn();
	if (!user) {
		throw new Error("No autenticado");
	}
	if (!user.activeStore) {
		throw new Error("No tienes una sucursal activa asignada");
	}
	return {
		user,
		activeStoreId: user.activeStore,
	};
}
