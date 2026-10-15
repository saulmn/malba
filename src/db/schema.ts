import {
	boolean,
	integer,
	numeric,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const unitEnum = pgEnum("unit", ["piece", "liter", "kilo", "package"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
	"income",
	"outcome",
]);
export const movementTypeEnum = pgEnum("movement_type", [
	"in",
	"out",
	"adjustment",
]);

// 1. Usuarios y Autenticación
export const roleEnum = pgEnum("role", ["master", "admin", "manager", "staff"]);

export const users = pgTable("users", {
	username: text("username").unique(),
	role: roleEnum("role").default("staff").notNull(),
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
	id: text("id").primaryKey(), // Session token
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Sucursales (Workspaces)
export const workspaces = pgTable("workspaces", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	location: text("location"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceUsers = pgTable("workspace_users", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.references(() => workspaces.id)
		.notNull(),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	role: text("role").notNull().default("staff"), // 'admin', 'manager', 'staff'
});

// 3. Sesiones de Caja (Turnos de punto de venta)
export const registerSessions = pgTable("register_sessions", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.references(() => workspaces.id)
		.notNull(),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	status: text("status").notNull().default("open"), // 'open' | 'closed'
	startTime: timestamp("start_time").defaultNow().notNull(),
	endTime: timestamp("end_time"),
	startingBalance: numeric("starting_balance", { precision: 12, scale: 2 })
		.notNull()
		.default("0"),
	closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
	expectedBalance: numeric("expected_balance", { precision: 12, scale: 2 }),
	difference: numeric("difference", { precision: 12, scale: 2 }),
});

// 4. Catálogo de Productos e Inventarios
export const products = pgTable("products", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.references(() => workspaces.id)
		.notNull(),
	name: text("name").notNull(),
	category: text("category"),
	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
	cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
	margin: numeric("margin", { precision: 5, scale: 2 }),
	notes: varchar("notes", { length: 3000 }),
	minStock: numeric("min_stock", { precision: 10, scale: 3 })
		.notNull()
		.default("5"),
	unit: unitEnum("unit").notNull().default("piece"),
	imageUrl: text("image_url"),
	isQuickAction: boolean("is_quick_action").default(false).notNull(),
});

export const inventory = pgTable("inventory", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.references(() => workspaces.id)
		.notNull(),
	productId: integer("product_id")
		.references(() => products.id)
		.notNull(),
	quantity: numeric("quantity", { precision: 10, scale: 3 })
		.notNull()
		.default("0"),
});

export const inventoryMovements = pgTable("inventory_movements", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.references(() => workspaces.id)
		.notNull(),
	productId: integer("product_id")
		.references(() => products.id)
		.notNull(),
	userId: integer("user_id")
		.references(() => users.id)
		.notNull(),
	type: movementTypeEnum("type").notNull(),
	quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
	reason: text("reason"), // ej: "Venta", "Compra a proveedor", "Merma"
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Ventas y Transacciones (Ingresos/Egresos)
export const transactions = pgTable("transactions", {
	id: serial("id").primaryKey(),
	registerSessionId: integer("register_session_id")
		.references(() => registerSessions.id)
		.notNull(),
	type: transactionTypeEnum("type").notNull(), // income = Venta, outcome = Gasto
	total: numeric("total", { precision: 12, scale: 2 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionItems = pgTable("transaction_items", {
	id: serial("id").primaryKey(),
	transactionId: integer("transaction_id")
		.references(() => transactions.id)
		.notNull(),
	productId: integer("product_id").references(() => products.id),
	quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
});

import { relations } from "drizzle-orm";

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
	user: one(users, {
		fields: [authSessions.userId],
		references: [users.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	authSessions: many(authSessions),
}));
