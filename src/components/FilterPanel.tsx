import { useState, useMemo } from "react"
import { Filter, X, Calendar, Coins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { type ParsedTransaction, ActionType } from "@/utils/csv"

export interface FilterState {
    transactionTypes: ActionType[]
    dateFrom: string
    dateTo: string
    assetFilter: string
}

interface FilterPanelProps {
    transactions: ParsedTransaction[]
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
}

const TRANSACTION_TYPE_OPTIONS = [
    { value: ActionType.SEND, label: "Native Transfer", description: "Outgoing transfers" },
    { value: ActionType.RECEIVE, label: "Receive", description: "Incoming transfers" },
    { value: ActionType.SWAP, label: "Swap", description: "Token exchanges" },
    { value: ActionType.CONTRACT, label: "Contract Interaction", description: "Smart contract calls" },
    { value: ActionType.UNKNOWN, label: "Unknown", description: "Unclassified transactions" },
]

export function FilterPanel({ transactions, filters, onFiltersChange }: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Get unique assets from transactions
    const availableAssets = useMemo(() => {
        const assets = new Set<string>()
        transactions.forEach(tx => {
            if (tx.receivedCurrency) assets.add(tx.receivedCurrency)
            if (tx.sentCurrency) assets.add(tx.sentCurrency)
            if (tx.feeCurrency) assets.add(tx.feeCurrency)
        })
        return Array.from(assets).sort()
    }, [transactions])

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.transactionTypes.length > 0) count++
        if (filters.dateFrom) count++
        if (filters.dateTo) count++
        if (filters.assetFilter) count++
        return count
    }, [filters])

    const handleTypeToggle = (type: ActionType, checked: boolean) => {
        const newTypes = checked
            ? [...filters.transactionTypes, type]
            : filters.transactionTypes.filter(t => t !== type)
        onFiltersChange({ ...filters, transactionTypes: newTypes })
    }

    const handleReset = () => {
        onFiltersChange({
            transactionTypes: [],
            dateFrom: "",
            dateTo: "",
            assetFilter: ""
        })
    }

    const handleAssetChange = (value: string) => {
        onFiltersChange({ ...filters, assetFilter: value })
    }

    // Filtered count preview
    const filteredCount = useMemo(() => {
        return transactions.filter(tx => {
            // Type filter
            if (filters.transactionTypes.length > 0 && !filters.transactionTypes.includes(tx.type)) {
                return false
            }
            // Date filter
            if (filters.dateFrom && tx.date < new Date(filters.dateFrom)) {
                return false
            }
            if (filters.dateTo && tx.date > new Date(filters.dateTo)) {
                return false
            }
            // Asset filter
            if (filters.assetFilter) {
                const assets = [tx.receivedCurrency, tx.sentCurrency, tx.feeCurrency].filter(Boolean)
                if (!assets.some(a => a?.toLowerCase().includes(filters.assetFilter.toLowerCase()))) {
                    return false
                }
            }
            return true
        }).length
    }, [transactions, filters])

    if (!isExpanded) {
        return (
            <Button
                variant="outline"
                onClick={() => setIsExpanded(true)}
                className="w-full justify-between group hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                            {activeFilterCount}
                        </Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    {filteredCount} of {transactions.length} transactions
                </span>
            </Button>
        )
    }

    return (
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-card to-card/95 backdrop-blur animate-in fade-in-50 slide-in-from-top-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        Filter Transactions
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(false)}
                        className="h-8 w-8 hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Transaction Types */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Transaction Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TRANSACTION_TYPE_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group"
                            >
                                <Checkbox
                                    checked={filters.transactionTypes.includes(option.value)}
                                    onChange={(e: any) => handleTypeToggle(option.value, e.target.checked)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">From</label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">To</label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                                className="h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Asset Filter */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        Asset Filter
                    </label>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search by asset (e.g., ETH, USDC)..."
                            value={filters.assetFilter}
                            onChange={(e) => handleAssetChange(e.target.value)}
                            className="h-9 pr-20"
                        />
                        {availableAssets.length > 0 && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                {availableAssets.slice(0, 3).map(asset => (
                                    <button
                                        key={asset}
                                        onClick={() => handleAssetChange(asset)}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
                                    >
                                        {asset}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {filters.assetFilter && (
                        <p className="text-xs text-muted-foreground">
                            Showing transactions involving{" "}
                            <span className="font-medium text-foreground">{filters.assetFilter}</span>
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{filteredCount}</span>
                        {" "}of {transactions.length} transactions
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={activeFilterCount === 0}
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsExpanded(false)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Filter className="mr-1.5 h-3.5 w-3.5" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Helper function to apply filters to transactions
export function applyFilters(
    transactions: ParsedTransaction[],
    filters: FilterState
): ParsedTransaction[] {
    return transactions.filter(tx => {
        // Type filter
        if (filters.transactionTypes.length > 0 && !filters.transactionTypes.includes(tx.type)) {
            return false
        }
        // Date filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            fromDate.setHours(0, 0, 0, 0)
            if (tx.date < fromDate) return false
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999)
            if (tx.date > toDate) return false
        }
        // Asset filter
        if (filters.assetFilter) {
            const assets = [tx.receivedCurrency, tx.sentCurrency, tx.feeCurrency].filter(Boolean)
            if (!assets.some(a => a?.toLowerCase().includes(filters.assetFilter.toLowerCase()))) {
                return false
            }
        }
        return true
    })
}
