import { useState, useMemo } from "react"
import { Filter, Calendar, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type ParsedTransaction, ActionType } from "@/utils/csv"
import { cn } from "@/lib/utils"

export interface FilterState {
    transactionTypes: ActionType[]
    assetFilter: string[]
    datePreset: string
    dateFrom: string
    dateTo: string
}

interface FilterPanelProps {
    transactions: ParsedTransaction[]
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    availableAssets?: string[]
}

const TRANSACTION_TYPE_OPTIONS = [
    { value: ActionType.SEND, label: "Native Transfer" },
    { value: ActionType.RECEIVE, label: "Receive" },
    { value: ActionType.SWAP, label: "Swap" },
    { value: ActionType.CONTRACT, label: "Contract Interaction" },
    { value: ActionType.UNKNOWN, label: "Unknown" },
]

const DATE_PRESETS = [
    { value: "all", label: "All Time" },
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
]

export function FilterPanel({ transactions, filters, onFiltersChange, availableAssets = [] }: FilterPanelProps) {
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [showDateDropdown, setShowDateDropdown] = useState(false)
    const [showAssetDropdown, setShowAssetDropdown] = useState(false)

    // Debug: Log available assets
    console.log('[FilterPanel] Rendered with:', {
        txCount: transactions.length,
        availableAssets: availableAssets,
        filters: filters
    })



    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.transactionTypes.length > 0) count++
        if (filters.assetFilter.length > 0) count++
        if (filters.datePreset !== "all") count++
        if (filters.dateFrom) count++
        if (filters.dateTo) count++
        return count
    }, [filters])

    const handleTypeToggle = (type: ActionType, checked: boolean) => {
        console.log('[FilterPanel] Type toggle:', type, checked)
        const newTypes = checked
            ? [...filters.transactionTypes, type]
            : filters.transactionTypes.filter(t => t !== type)
        onFiltersChange({ ...filters, transactionTypes: newTypes })
    }

    const handleAssetToggle = (asset: string, checked: boolean) => {
        console.log('[FilterPanel] Asset toggle:', asset, checked)
        const newAssets = checked
            ? [...filters.assetFilter, asset]
            : filters.assetFilter.filter(a => a !== asset)
        onFiltersChange({ ...filters, assetFilter: newAssets })
    }

    const handleDatePresetChange = (preset: string) => {
        const now = new Date()
        let dateFrom = ""
        let dateTo = ""

        switch (preset) {
            case "1m":
                dateFrom = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0]
                break
            case "3m":
                dateFrom = new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0]
                break
            case "6m":
                dateFrom = new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0]
                break
            case "1y":
                dateFrom = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0]
                break
            case "all":
                dateFrom = ""
                dateTo = ""
                break
            case "custom":
                // Keep existing dates, just open the date picker
                setShowDateDropdown(true)
                return
        }

        onFiltersChange({ ...filters, datePreset: preset, dateFrom, dateTo })
        setShowDateDropdown(false)
    }

    const handleReset = () => {
        onFiltersChange({
            transactionTypes: [],
            assetFilter: [],
            datePreset: "all",
            dateFrom: "",
            dateTo: "",
        })
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
            // Asset filter - case-insensitive matching
            if (filters.assetFilter.length > 0) {
                const txAssets = [
                    tx.sentCurrency,
                    tx.receivedCurrency,
                    tx.feeCurrency
                ].filter(Boolean) as string[]
                const hasMatchingAsset = txAssets.some(asset =>
                    filters.assetFilter.some(filterAsset =>
                        filterAsset.toLowerCase() === asset?.toLowerCase()
                    )
                )
                if (!hasMatchingAsset) return false
            }
            return true
        }).length
    }, [transactions, filters])

    const getDatePresetLabel = () => {
        const preset = DATE_PRESETS.find(p => p.value === filters.datePreset)
        return preset?.label || "All Time"
    }

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border/50 rounded-lg">
            {/* Filter Icon & Label */}
            <div className="flex items-center gap-2 mr-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Filters</span>
            </div>

            {/* Date Preset Dropdown */}
            <div className="relative">
                <Button
                    variant="outline"
                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                    className={cn(
                        "h-9 justify-between min-w-[140px]",
                        filters.datePreset !== "all" && "border-primary/50 text-primary"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <Calendar className={cn("h-4 w-4", filters.datePreset !== "all" && "text-primary")} />
                        {getDatePresetLabel()}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                {showDateDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-10 w-64 bg-popover border rounded-lg shadow-lg p-3 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                        {filters.datePreset !== 'custom' ? (
                            <>
                                {DATE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handleDatePresetChange(preset.value)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors rounded",
                                            filters.datePreset === preset.value && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                                <hr className="my-2 border-border/50" />
                                <button
                                    onClick={() => {
                                        onFiltersChange({ ...filters, datePreset: 'custom', dateFrom: '', dateTo: '' })
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors rounded text-primary"
                                >
                                    Custom Range...
                                </button>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Custom Date Range
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">From</label>
                                        <input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value, datePreset: 'custom' })}
                                            className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">To</label>
                                        <input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value, datePreset: 'custom' })}
                                            className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => {
                                            onFiltersChange({ ...filters, datePreset: 'all', dateFrom: '', dateTo: '' })
                                            setShowDateDropdown(false)
                                        }}
                                        className="flex-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => setShowDateDropdown(false)}
                                        className="flex-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Transaction Type Dropdown */}
            <div className="relative">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowTypeDropdown(!showTypeDropdown)
                        setShowDateDropdown(false)
                    }}
                    className={cn(
                        "h-9 justify-between min-w-[140px]",
                        filters.transactionTypes.length > 0 && "border-primary/50 text-primary"
                    )}
                >
                    <span className={cn(filters.transactionTypes.length > 0 && "text-primary")}>
                        {filters.transactionTypes.length === 0
                            ? "All Types"
                            : `${filters.transactionTypes.length} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                {showTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 z-10 w-56 bg-popover border rounded-md shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                        <div className="p-2">
                            {TRANSACTION_TYPE_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters.transactionTypes.includes(option.value)}
                                        onChange={(e) => handleTypeToggle(option.value, e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Asset Dropdown */}
            {availableAssets.length > 0 && (
                <div className="relative">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowAssetDropdown(!showAssetDropdown)
                            setShowTypeDropdown(false)
                            setShowDateDropdown(false)
                        }}
                        className={cn(
                            "h-9 justify-between min-w-[140px]",
                            filters.assetFilter.length > 0 && "border-primary/50 text-primary"
                        )}
                    >
                        <span className={cn(filters.assetFilter.length > 0 && "text-primary")}>
                            {filters.assetFilter.length === 0
                                ? "All Assets"
                                : `${filters.assetFilter.length} selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                    {showAssetDropdown && (
                        <div className="absolute top-full left-0 mt-1 z-10 w-56 bg-popover border rounded-md shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2">
                                {availableAssets.map((asset) => (
                                    <label
                                        key={asset}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.assetFilter.includes(asset)}
                                            onChange={(e) => handleAssetToggle(asset, e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">{asset}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Reset Button */}
            {activeFilterCount > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-9 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <X className="h-4 w-4 mr-1" />
                    Reset
                </Button>
            )}

            {/* Results Count */}
            <span className="text-sm text-muted-foreground ml-auto">
                <span className="font-medium text-foreground">{filteredCount}</span>
                <span className="mx-1">of</span>
                <span className="font-medium text-foreground">{transactions.length}</span>
                <span className="ml-1">transactions</span>
            </span>
        </div>
    )
}

// Helper function to apply filters to transactions
export function applyFilters(
    transactions: ParsedTransaction[],
    filters: FilterState
): ParsedTransaction[] {
    console.log('[applyFilters] Starting filter with:', {
        txCount: transactions.length,
        filters: filters,
        sampleTxTypes: transactions.slice(0, 3).map(tx => ({ id: tx.id?.slice(0, 8), type: tx.type, sentCurrency: tx.sentCurrency, receivedCurrency: tx.receivedCurrency, feeCurrency: tx.feeCurrency }))
    })

    const result = transactions.filter(tx => {
        // Type filter
        if (filters.transactionTypes.length > 0 && !filters.transactionTypes.includes(tx.type)) {
            console.log('[applyFilters] Filtered out by type:', tx.type, 'wanted:', filters.transactionTypes)
            return false
        }
        // Date filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            fromDate.setHours(0, 0, 0, 0)
            if (tx.date < fromDate) {
                console.log('[applyFilters] Filtered out by dateFrom:', tx.date, '<', fromDate)
                return false
            }
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999)
            if (tx.date > toDate) {
                console.log('[applyFilters] Filtered out by dateTo:', tx.date, '>', toDate)
                return false
            }
        }
        // Asset filter - case-insensitive matching
        if (filters.assetFilter.length > 0) {
            const txAssets = [
                tx.sentCurrency,
                tx.receivedCurrency,
                tx.feeCurrency
            ].filter(Boolean) as string[]
            const hasMatchingAsset = txAssets.some(asset =>
                filters.assetFilter.some(filterAsset =>
                    filterAsset.toLowerCase() === asset?.toLowerCase()
                )
            )
            if (!hasMatchingAsset) {
                console.log('[applyFilters] Filtered out by asset:', txAssets, 'wanted:', filters.assetFilter)
                return false
            }
        }
        return true
    })

    console.log('[applyFilters] Result:', result.length, 'of', transactions.length, 'transactions')
    return result
}
