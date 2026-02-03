import { useState, useMemo, useCallback, useEffect } from "react"
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ExternalLink,
    Clock,
    TrendingUp,
    TrendingDown,
    RefreshCcw,
    FileText,
    SearchX
} from "lucide-react"
import { type ParsedTransaction, TransactionStatus, ActionType } from "@/utils/csv"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

interface TransactionTableProps {
    data: ParsedTransaction[]
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

type SortField = 'date' | 'type' | 'status' | 'amount' | 'asset' | 'fee'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
    field: SortField
    order: SortOrder
}

export function TransactionTable({ data, selectedIds, onSelectionChange }: TransactionTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20;

    // Reset page to 1 when data changes (e.g. filter applied or network changed)
    useEffect(() => {
        setCurrentPage(1)
    }, [data])

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Toggle sort - immediate response, no debounce
    const handleSort = useCallback((field: SortField) => {
        setSortConfig(prev => {
            if (prev.field === field) {
                return { field, order: prev.order === 'asc' ? 'desc' : 'asc' }
            }
            return { field, order: 'desc' }
        })
        setCurrentPage(1)
    }, [])

    // Derived Data - sorted (defined before callbacks that depend on it)
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            let cmp = 0
            switch (sortConfig.field) {
                case 'date':
                    cmp = a.date.getTime() - b.date.getTime()
                    break
                case 'type':
                    cmp = a.type.localeCompare(b.type)
                    break
                case 'status':
                    cmp = a.status.localeCompare(b.status)
                    break
                case 'amount':
                    const amtA = parseFloat(a.sentQuantity || "0") + parseFloat(a.receivedQuantity || "0")
                    const amtB = parseFloat(b.sentQuantity || "0") + parseFloat(b.receivedQuantity || "0")
                    cmp = amtA - amtB
                    break
                case 'asset':
                    const assetA = a.receivedCurrency || a.sentCurrency || ""
                    const assetB = b.receivedCurrency || b.sentCurrency || ""
                    cmp = assetA.localeCompare(assetB)
                    break
                case 'fee':
                    const feeA = parseFloat(a.feeAmount || "0")
                    const feeB = parseFloat(b.feeAmount || "0")
                    cmp = feeA - feeB
                    break
            }
            return sortConfig.order === 'asc' ? cmp : -cmp
        })
    }, [data, sortConfig])

    const handleSelectOne = useCallback((id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id])
        } else {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
        }
    }, [selectedIds, onSelectionChange])

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        const result = sortedData.slice(start, start + ITEMS_PER_PAGE)
        console.log('[TransactionTable] Pagination:', {
            totalItems: sortedData.length,
            itemsPerPage: ITEMS_PER_PAGE,
            currentPage,
            showingStart: start + 1,
            showingEnd: Math.min(start + ITEMS_PER_PAGE, sortedData.length),
            displayedCount: result.length
        })
        return result
    }, [sortedData, currentPage])

    // Selection helpers - using useCallback for stability

    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            // Select all filtered transactions (all pages)
            onSelectionChange(data.map(tx => tx.id))
        } else {
            // Deselect all
            onSelectionChange([])
        }
    }, [data, onSelectionChange])

    const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE)

    // Calculate showing range
    const showingStart = (currentPage - 1) * ITEMS_PER_PAGE + 1
    const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)

    // Checkbox state - check if ALL data items are selected
    const allSelected = data.length > 0 && data.every(tx => selectedIds.includes(tx.id))
    const someSelected = selectedIds.length > 0 && !allSelected

    // Sort indicator component
    const SortIndicator = ({ field }: { field: SortField }) => {
        if (sortConfig.field !== field) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        }
        return sortConfig.order === 'asc'
            ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
            : <ArrowDown className="h-3.5 w-3.5 text-primary" />
    }

    // Sortable header component with fixed animation
    const SortableHeader = ({
        field,
        children,
        className = ""
    }: {
        field: SortField
        children: React.ReactNode
        className?: string
    }) => (
        <th
            className={`
                h-12 px-4 text-left align-middle font-medium text-muted-foreground
                cursor-pointer select-none
                hover:bg-muted/50
                ${className}
            `}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1.5">
                {children}
                <SortIndicator field={field} />
            </div>
        </th>
    )

    if (data.length === 0) {
        return (
            <Card className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center border-dashed border-2 border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border/50 shadow-sm">
                    <SearchX className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">No transactions found</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                    Try adjusting your filters or search criteria to find what you're looking for.
                </p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden bg-gradient-to-b from-card to-card/95">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                    <Checkbox
                                        checked={allSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = someSelected;
                                        }}
                                        onChange={(e: any) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                                <SortableHeader field="date" className="w-[180px]">
                                    Date
                                </SortableHeader>
                                <SortableHeader field="type" className="w-[140px]">
                                    Type
                                </SortableHeader>
                                <SortableHeader field="asset">
                                    Asset
                                </SortableHeader>
                                <SortableHeader field="amount">
                                    Amount
                                </SortableHeader>
                                <SortableHeader field="fee">
                                    Fee
                                </SortableHeader>
                                <SortableHeader field="status" className="w-[120px]">
                                    Status
                                </SortableHeader>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[80px]">
                                    View
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="
                                        border-b border-border/50
                                        transition-colors duration-150
                                        hover:bg-muted/40
                                        data-[state=selected]:bg-primary/5
                                    "
                                >
                                    <td className="p-4 align-middle">
                                        <Checkbox
                                            checked={selectedIds.includes(tx.id)}
                                            onChange={(e: any) => handleSelectOne(tx.id, e.target.checked)}
                                        />
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {formatDateDisplay(tx.date)}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md p-1.5 bg-muted/50 ring-1 ring-border/50">
                                                {getActionIcon(tx.type)}
                                            </div>
                                            <span className="capitalize text-sm font-medium">{tx.type.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            {tx.receivedCurrency && (
                                                <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full w-fit">
                                                    {tx.receivedCurrency}
                                                </span>
                                            )}
                                            {tx.sentCurrency && (
                                                <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full w-fit">
                                                    {tx.sentCurrency}
                                                </span>
                                            )}
                                            {!tx.receivedCurrency && !tx.sentCurrency && (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            {tx.receivedQuantity && (
                                                <span className="text-green-600 font-mono text-sm font-medium">
                                                    +{tx.receivedQuantity}
                                                </span>
                                            )}
                                            {tx.sentQuantity && (
                                                <span className="text-red-600 font-mono text-sm font-medium">
                                                    -{tx.sentQuantity}
                                                </span>
                                            )}
                                            {!tx.receivedQuantity && !tx.sentQuantity && (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {tx.feeAmount ? (
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {tx.feeAmount} {tx.feeCurrency}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {getStatusBadge(tx.status)}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <a href={tx.link} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="sr-only">View Transaction</span>
                                            </a>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between py-4 px-2">
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedIds.length}</span>
                    {" "}of {data.length} row(s) selected
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {showingStart}-{showingEnd} of {sortedData.length}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3 text-xs transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1
                            if (totalPages > 5) {
                                if (currentPage > 3) {
                                    pageNum = currentPage - 2 + i
                                }
                                if (currentPage > totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                }
                            }
                            if (pageNum > totalPages) return null
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="icon"
                                    onClick={() => handlePageChange(pageNum)}
                                    className="h-8 w-8 text-xs transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 px-3 text-xs transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

function formatDateDisplay(d: Date) {
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getActionIcon(type: ActionType) {
    const iconClass = "h-3.5 w-3.5"
    switch (type) {
        case ActionType.RECEIVE:
            return <TrendingDown className={`${iconClass} text-green-500`} />
        case ActionType.SEND:
            return <TrendingUp className={`${iconClass} text-red-500`} />
        case ActionType.SWAP:
            return <RefreshCcw className={`${iconClass} text-blue-500`} />
        default:
            return <FileText className={`${iconClass} text-gray-500`} />
    }
}

function getStatusBadge(status: TransactionStatus) {
    switch (status) {
        case TransactionStatus.SUCCESS:
            return (
                <Badge
                    variant="default"
                    className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-0 font-medium text-xs"
                >
                    Success
                </Badge>
            )
        case TransactionStatus.FAILED:
            return (
                <Badge
                    variant="destructive"
                    className="font-medium text-xs"
                >
                    Failed
                </Badge>
            )
        case TransactionStatus.PENDING:
            return (
                <Badge
                    variant="secondary"
                    className="font-medium text-xs"
                >
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                </Badge>
            )
        default:
            return (
                <Badge
                    variant="outline"
                    className="font-medium text-xs text-muted-foreground"
                >
                    Unknown
                </Badge>
            )
    }
}
