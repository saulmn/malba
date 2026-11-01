import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ViewLoadingSkeleton() {
	return (
		<div className="flex flex-col gap-6 animate-pulse">
			{/* Top Bar Skeleton */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-2">
					<div className="h-8 w-56 bg-muted/80 rounded-md" />
					<div className="h-4 w-80 max-w-full bg-muted/50 rounded-md" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-9 w-28 bg-muted/60 rounded-md" />
					<div className="h-9 w-32 bg-muted/80 rounded-md" />
				</div>
			</div>

			{/* KPI Cards Skeleton */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="border bg-card/60">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<div className="h-4 w-28 bg-muted/70 rounded" />
							<div className="size-4 bg-muted/60 rounded-full" />
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="h-7 w-36 bg-muted rounded" />
							<div className="h-3 w-24 bg-muted/50 rounded" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters / Search Bar Skeleton */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<div className="h-9 w-36 bg-muted/60 rounded-md" />
					<div className="h-9 w-40 bg-muted/60 rounded-md" />
				</div>
				<div className="h-9 w-full sm:w-72 bg-muted/60 rounded-md" />
			</div>

			{/* Content Card / Table Skeleton */}
			<Card className="border bg-card/60 overflow-hidden shadow-xs">
				<div className="p-4 border-b bg-muted/20 flex items-center justify-between">
					<div className="h-4 w-32 bg-muted/80 rounded" />
					<div className="h-4 w-20 bg-muted/50 rounded" />
				</div>
				<div className="p-4 space-y-3.5">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between gap-4 py-2 border-b border-muted/40 last:border-0"
						>
							<div className="flex items-center gap-3 flex-1">
								<div className="size-8 bg-muted/70 rounded-md shrink-0" />
								<div className="space-y-1.5 flex-1 max-w-sm">
									<div className="h-4 w-3/4 bg-muted/80 rounded" />
									<div className="h-3 w-1/2 bg-muted/50 rounded" />
								</div>
							</div>
							<div className="h-4 w-24 bg-muted/60 rounded hidden sm:block" />
							<div className="h-4 w-20 bg-muted/70 rounded" />
							<div className="h-8 w-16 bg-muted/50 rounded-md" />
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
