import { Card } from "@/components/ui/card"

export function SkeletonTable() {
    return (
        <Card className="border-border/50 shadow-lg overflow-hidden">
            {/* Header Skeleton */}
            <div className="border-b border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    <div className="flex-1 flex gap-4">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Row Skeletons */}
            <div className="divide-y divide-border/50">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="p-4 flex items-center gap-4 animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="h-4 w-4 rounded bg-muted" />
                        <div className="flex-1 flex gap-4 items-center">
                            <div className="h-4 w-28 rounded bg-muted" />
                            <div className="h-6 w-20 rounded-full bg-muted" />
                            <div className="h-4 w-32 rounded bg-muted" />
                            <div className="h-4 w-16 rounded bg-muted" />
                            <div className="h-6 w-16 rounded-full bg-muted" />
                        </div>
                        <div className="h-8 w-8 rounded bg-muted" />
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="border-t border-border/50 p-4 flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-20 rounded bg-muted animate-pulse self-center" />
                    <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                </div>
            </div>
        </Card>
    )
}

export function SkeletonCard() {
    return (
        <Card className="border-border/50 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="space-y-3">
                <div className="h-10 w-full rounded bg-muted animate-pulse" />
                <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
        </Card>
    )
}
