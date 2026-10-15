import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
	BarChart,
	FileText,
	Home,
	LogOut,
	Package,
	Settings,
	ShoppingCart,
	Store,
	Users,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
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

const menuItems = [
	{ title: "Inicio", url: "/", icon: Home },
	{ title: "Ventas", url: "/ventas", icon: ShoppingCart },
	{ title: "Mis Ventas", url: "/mis-ventas", icon: FileText },
	{ title: "Inventario", url: "/inventario", icon: Package },
	{ title: "Dashboard", url: "/dashboard", icon: BarChart },
	{ title: "Sucursales", url: "/sucursales", icon: Store },
	{ title: "Usuarios", url: "/usuarios", icon: Users },
	{ title: "Configuración", url: "/config", icon: Settings },
];

function AppSidebar() {
	return (
		<Sidebar>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Punto de Venta</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton tooltip={item.title}>
										<a href={item.url} className="flex items-center gap-2">
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<div className="p-4 mt-auto border-t border-sidebar-border">
				<button
					onClick={() => (window.location.href = "/login")}
					className="flex items-center gap-2 w-full px-2 py-2 text-sm font-medium text-destructive rounded-md hover:bg-destructive/10 transition-colors"
				>
					<LogOut size={18} />
					Cerrar Sesión
				</button>
			</div>
		</Sidebar>
	);
}

import { useLocation } from "@tanstack/react-router";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function RootDocument({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const isLogin = location.pathname === "/login";

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
								<AppSidebar />
								<main className="flex-1 overflow-y-auto flex flex-col">
									<header className="px-4 h-14 flex shrink-0 items-center justify-between border-b bg-card">
										<div className="flex items-center gap-2">
											<SidebarTrigger />
											<h1 className="font-bold text-lg md:hidden">
												Punto de Venta
											</h1>
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
