import { createFileRoute } from "@tanstack/react-router";
import {
	SalesHistoryScreen,
	type SalePeriod,
} from "@/features/sales/my-sales-screen";
import { getSessionFn } from "@/server/auth";
import { getSalesHistoryFn } from "@/server/sales";

export const Route = createFileRoute("/mis-ventas")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			period:
				(search.period as SalePeriod) || "today",
			userId: (search.userId as string) || "all",
		};
	},
	loaderDeps: ({ search: { period, userId } }) => ({ period, userId }),
	loader: async ({ deps: { period, userId } }) => {
		const user = await getSessionFn();
		if (!user) {
			throw new Error("No autenticado");
		}

		const result = await getSalesHistoryFn({
			data: {
				period,
				userId: userId === "all" || !userId ? undefined : Number(userId),
			},
		});

		return {
			user,
			sales: result.sales,
			cashiers: result.cashiers,
			activeWorkspaceName: result.activeWorkspaceName,
		};
	},
	component: MisVentasRoute,
});

function MisVentasRoute() {
	const { user, sales, cashiers, activeWorkspaceName } =
		Route.useLoaderData();
	const { period, userId } = Route.useSearch();

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<SalesHistoryScreen
				currentUser={user}
				sales={sales}
				cashiers={cashiers}
				currentPeriod={period}
				currentUserId={userId}
				activeWorkspaceName={activeWorkspaceName}
			/>
		</div>
	);
}
