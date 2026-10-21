import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	redirect,
	Scripts,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
	History,
	LayoutDashboard,
	LogOut,
	Package,
	Receipt,
	Settings,
	ShoppingCart,
	Store,
	Truck,
	UserCheck,
	Users,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSessionFn } from "@/server/auth";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	beforeLoad: async ({ location }) => {
		if (location.pathname === "/login") return;

		const user = await getSessionFn();
		if (!user) {
			throw redirect({
				to: "/login",
			});
		}
		return { user };
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Punto de Venta" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	shellComponent: RootDocument,
});

interface MenuItem {
	title: string;
	url: string;
	icon: any;
	masterOnly?: boolean;
}

const menuItems: MenuItem[] = [
	{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
	{ title: "Ventas", url: "/ventas", icon: ShoppingCart },
	{ title: "Historial de Ventas", url: "/mis-ventas", icon: History },
	{ title: "Inventario", url: "/inventario", icon: Package },
	{ title: "Proveedores", url: "/proveedores", icon: Truck },
	{ title: "Clientes", url: "/clientes", icon: UserCheck },
	{ title: "Gastos", url: "/gastos", icon: Receipt },
	{ title: "Sucursales", url: "/sucursales", icon: Store, masterOnly: true },
	{ title: "Usuarios", url: "/usuarios", icon: Users, masterOnly: true },
	{ title: "Configuración", url: "/config", icon: Settings, masterOnly: true },
];

function AppSidebar({ user }: { user?: any }) {
	const location = useLocation();
	const isMaster = user?.role === "master";
	const visibleMenuItems = menuItems.filter(
		(item) => !item.masterOnly || isMaster,
	);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="h-14 border-b border-sidebar-border flex flex-row items-center justify-between px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
				<div className="flex items-center gap-2 overflow-hidden px-1">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
						M
					</div>
					<div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
						<span className="font-bold text-sm leading-tight text-sidebar-foreground">
							Malba
						</span>
						<span className="text-[10px] text-muted-foreground leading-tight">
							Punto de Venta
						</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden mb-1 font-semibold text-xs tracking-wider uppercase text-muted-foreground/70">
						Punto de Venta
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="gap-2">
							{visibleMenuItems.map((item) => {
								const isActive =
									location.pathname === item.url ||
									(item.url !== "/" && location.pathname.startsWith(item.url));

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											tooltip={item.title}
											isActive={isActive}
											render={<Link to={item.url} />}
											className="h-10 px-3 gap-3 rounded-lg font-medium transition-all duration-150 group-data-[collapsible=icon]:justify-center"
										>
											<item.icon className="size-4.5 shrink-0" />
											<span className="truncate group-data-[collapsible=icon]:hidden">
												{item.title}
											</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border p-3">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Cerrar Sesión"
							onClick={() => (window.location.href = "/login")}
							className="h-10 px-3 gap-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive font-medium transition-all duration-150 group-data-[collapsible=icon]:justify-center"
						>
							<LogOut className="size-4.5 shrink-0" />
							<span className="truncate group-data-[collapsible=icon]:hidden">
								Cerrar Sesión
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { StoreSelector } from "@/components/store-selector";
import ThemeToggle from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function RootDocument({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const isLogin = location.pathname === "/login";
	const routeContext = Route.useRouteContext();
	const user = routeContext?.user;

	return (
		<html lang="es-MX" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased bg-background text-foreground selection:bg-[#D1E8FF] selection:text-[#0B1957]">
				{isLogin ? (
					children
				) : (
					<TooltipProvider>
						<SidebarProvider>
							<div className="flex w-full h-screen overflow-hidden">
								<AppSidebar user={user} />
								<main className="flex-1 overflow-y-auto flex flex-col">
									<header className="px-4 h-14 flex shrink-0 items-center justify-between border-b bg-card">
										<div className="flex items-center gap-3">
											<SidebarTrigger />
											<StoreSelector />
										</div>
										<div className="flex items-center gap-3">
											<ThemeToggle />
											<NotificationsDropdown />
										</div>
									</header>
									<div className="flex-1 p-4 md:p-8">{children}</div>
								</main>
							</div>
						</SidebarProvider>
					</TooltipProvider>
				)}
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
