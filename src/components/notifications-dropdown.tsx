import { useEffect, useState } from "react";
import { Bell, AlertTriangle, CheckCheck, Check, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { getLowStockNotificationsFn } from "@/server/notifications";

export function NotificationsDropdown() {
	const [notifications, setNotifications] = useState<any[]>([]);
	const [readIds, setReadIds] = useState<number[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			const saved = localStorage.getItem("read_notifications");
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Only fetch client side after mount to avoid blocking root loader
		getLowStockNotificationsFn().then((data) => {
			setNotifications(data);
			setLoading(false);
		});
	}, []);

	const saveReadIds = (newReadIds: number[]) => {
		setReadIds(newReadIds);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(
					"read_notifications",
					JSON.stringify(newReadIds),
				);
			} catch (e) {
				console.error("Error saving read notifications", e);
			}
		}
	};

	const markAsRead = (id: number) => {
		if (!readIds.includes(id)) {
			const updated = [...readIds, id];
			saveReadIds(updated);
			toast.success("Notificación marcada como leída");
		}
	};

	const markAllAsRead = () => {
		const allIds = Array.from(
			new Set([...readIds, ...notifications.map((n) => n.id)]),
		);
		saveReadIds(allIds);
		toast.success("Todas las notificaciones marcadas como leídas");
	};

	const unreadNotifications = notifications.filter(
		(n) => !readIds.includes(n.id),
	);
	const unreadCount = unreadNotifications.length;

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="ghost" size="icon" className="relative h-8 w-8">
						<Bell className="h-5 w-5" />
						{unreadCount > 0 && (
							<span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse" />
						)}
					</Button>
				}
			/>
			<PopoverContent className="w-84 p-0 shadow-lg" align="end">
				{/* Dropdown Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b bg-card">
					<div className="flex items-center gap-2">
						<h4 className="text-sm font-semibold">Notificaciones</h4>
						{unreadCount > 0 ? (
							<Badge
								variant="destructive"
								className="text-xs px-1.5 py-0 font-bold"
							>
								{unreadCount} nueva{unreadCount > 1 ? "s" : ""}
							</Badge>
						) : (
							<Badge
								variant="secondary"
								className="text-xs px-1.5 py-0 text-muted-foreground font-normal"
							>
								0 nuevas
							</Badge>
						)}
					</div>

					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 hover:bg-muted font-medium"
							onClick={markAllAsRead}
						>
							<CheckCheck className="size-3.5 text-primary" />
							Marcar leídas
						</Button>
					)}
				</div>

				{/* Notifications List */}
				<div className="max-h-80 overflow-y-auto">
					{loading ? (
						<div className="p-6 text-center text-sm text-muted-foreground">
							Cargando alertas...
						</div>
					) : notifications.length === 0 ? (
						<div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
							<Bell className="h-8 w-8 text-muted/50" />
							<p className="font-medium text-foreground">Todo al corriente</p>
							<p className="text-xs">No hay productos con stock bajo en este momento.</p>
						</div>
					) : (
						<div className="flex flex-col divide-y">
							{notifications.map((notif) => {
								const isRead = readIds.includes(notif.id);
								return (
									<div
										key={notif.id}
										className={`flex items-start justify-between gap-3 p-3.5 transition-colors ${
											isRead
												? "opacity-55 bg-muted/20"
												: "bg-card hover:bg-muted/40"
										}`}
									>
										<div className="flex items-start gap-2.5 flex-1 min-w-0">
											<div
												className={`p-2 rounded-full shrink-0 ${
													isRead
														? "bg-muted text-muted-foreground"
														: "bg-destructive/15 text-destructive"
												}`}
											>
												<AlertTriangle size={15} />
											</div>
											<div className="flex flex-col gap-0.5 min-w-0">
												<div className="flex items-center gap-1.5">
													<p className="text-sm font-medium leading-tight truncate">
														Stock Bajo: {notif.name}
													</p>
													{isRead && (
														<Badge
															variant="outline"
															className="text-[10px] h-4 px-1 py-0 font-normal text-muted-foreground"
														>
															Leída
														</Badge>
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													Quedan{" "}
													<span className="font-semibold text-foreground">
														{Number(notif.quantity)}
													</span>{" "}
													(Mínimo: {Number(notif.minStock || 1)})
												</p>
											</div>
										</div>

										{!isRead && (
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
												onClick={() => markAsRead(notif.id)}
												title="Marcar como leída"
											>
												<Check className="size-3.5" />
											</Button>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				{notifications.length > 0 && (
					<div className="p-2.5 border-t bg-muted/30 flex items-center justify-between text-xs px-4">
						<Link
							to="/inventario"
							className="text-primary hover:underline font-medium text-xs flex items-center gap-1"
						>
							Ver inventario completo
						</Link>
						{notifications.length > unreadCount && (
							<button
								onClick={() => saveReadIds([])}
								className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1"
								title="Restablecer como no leídas"
							>
								<RotateCcw className="size-3" />
								Restablecer
							</button>
						)}
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
