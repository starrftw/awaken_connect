import { useState, useMemo } from "react"
import {
    ArrowUpDown,
    ExternalLink,

    Clock,
    TrendingUp,
    TrendingDown,
    RefreshCcw,
    FileText
} from "lucide-react"
import { type ParsedTransaction, TransactionStatus, ActionType } from "@/utils/csv"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"


interface TransactionTableProps {
    data: ParsedTransaction[]
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

type SortField = 'date' | 'type' | 'status' | 'amount'
type SortOrder = 'asc' | 'desc'

export function TransactionTable({ data, selectedIds, onSelectionChange }: TransactionTableProps) {
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // toggle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc') // Default desc for new field usually better for dates/amounts
        }
    }

    // selection helpers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(data.map(tx => tx.id))
        } else {
            onSelectionChange([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id])
        } else {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
        }
    }

    // Derived Data
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            let cmp = 0
            switch (sortField) {
                case 'date':
                    cmp = a.date.getTime() - b.date.getTime()
                    break
                case 'type':
                    cmp = a.type.localeCompare(b.type)
                    break
                case 'status':
                    cmp = a.status.localeCompare(b.status) // Primitive enum string sort
                    break
                case 'amount':
                    // Rough heuristic: Compare Sent quantity first, then Received
                    const amtA = parseFloat(a.sentQuantity || a.receivedQuantity || "0")
                    const amtB = parseFloat(b.sentQuantity || b.receivedQuantity || "0")
                    cmp = amtA - amtB
                    break
            }
            return sortOrder === 'asc' ? cmp : -cmp
        })
    }, [data, sortField, sortOrder])

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return sortedData.slice(start, start + itemsPerPage)
    }, [sortedData, currentPage])

    const totalPages = Math.ceil(data.length / itemsPerPage)
    const allSelected = data.length > 0 && selectedIds.length === data.length
    const someSelected = selectedIds.length > 0 && !allSelected

    if (data.length === 0) {
        return (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No transactions found</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    Enter a valid wallet address above to load history.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                    <Checkbox
                                        checked={allSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = someSelected;
                                        }}
                                        onChange={(e: any) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                                <th
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Date
                                        <ArrowUpDown className="h-4 w-4" />
                                    </div>
                                </th>
                                <th
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fee</th>
                                <th
                                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                </th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">View</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {paginatedData.map((tx) => (
                                <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle">
                                        <Checkbox
                                            checked={selectedIds.includes(tx.id)}
                                            onChange={(e: any) => handleSelectOne(tx.id, e.target.checked)}
                                        />
                                    </td>
                                    <td className="p-4 align-middle font-mono text-xs">{formatDateDisplay(tx.date)}</td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            {getActionIcon(tx.type)}
                                            <span className="capitalize">{tx.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col">
                                            {tx.receivedQuantity && (
                                                <span className="text-green-500 font-mono">+{tx.receivedQuantity} {tx.receivedCurrency}</span>
                                            )}
                                            {tx.sentQuantity && (
                                                <span className="text-red-500 font-mono">-{tx.sentQuantity} {tx.sentCurrency}</span>
                                            )}
                                            {!tx.receivedQuantity && !tx.sentQuantity && <span className="text-muted-foreground">-</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-xs text-muted-foreground">
                                        {tx.feeAmount ? `${tx.feeAmount} ${tx.feeCurrency}` : '-'}
                                    </td>
                                    <td className="p-4 align-middle">
                                        {getStatusBadge(tx.status)}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Button variant="ghost" size="icon" asChild>
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
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-muted-foreground flex-1">
                    {selectedIds.length} of {data.length} row(s) selected
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Next
                </Button>
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
    switch (type) {
        case ActionType.RECEIVE: return <TrendingDown className="h-4 w-4 text-green-500" />
        case ActionType.SEND: return <TrendingUp className="h-4 w-4 text-red-500" />
        case ActionType.SWAP: return <RefreshCcw className="h-4 w-4 text-blue-500" />
        default: return <FileText className="h-4 w-4 text-gray-500" />
    }
}

function getStatusBadge(status: TransactionStatus) {
    switch (status) {
        case TransactionStatus.SUCCESS:
            return <Badge variant="default" className="bg-green-500/15 text-green-500 hover:bg-green-500/25 border-0">Success</Badge>
        case TransactionStatus.FAILED:
            return <Badge variant="destructive">Failed</Badge>
        case TransactionStatus.PENDING:
            return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
        default:
            return <Badge variant="outline">Unknown</Badge>
    }
}
