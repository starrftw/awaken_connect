import { useState, useCallback, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type ParsedTransaction } from "@/utils/csv"

interface SearchBarProps {
    transactions: ParsedTransaction[]
    onSearchResults: (results: ParsedTransaction[]) => void
    placeholder?: string
}

export function SearchBar({
    transactions,
    onSearchResults,
    placeholder = "Search by hash, address, or asset..."
}: SearchBarProps) {
    const [query, setQuery] = useState("")

    // Perform search
    const performSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) {
            onSearchResults(transactions)
            return
        }

        const lowerQuery = searchQuery.toLowerCase()

        const results = transactions.filter(tx => {
            // Search in transaction hash
            if (tx.hash.toLowerCase().includes(lowerQuery)) return true

            // Search in notes/method names
            if (tx.notes.toLowerCase().includes(lowerQuery)) return true

            // Search in asset names
            if (tx.receivedCurrency?.toLowerCase().includes(lowerQuery)) return true
            if (tx.sentCurrency?.toLowerCase().includes(lowerQuery)) return true
            if (tx.feeCurrency?.toLowerCase().includes(lowerQuery)) return true

            // Search in amounts
            if (tx.receivedQuantity?.includes(lowerQuery)) return true
            if (tx.sentQuantity?.includes(lowerQuery)) return true

            // Search in status or type
            if (tx.status.toLowerCase().includes(lowerQuery)) return true
            if (tx.type.toLowerCase().includes(lowerQuery)) return true

            return false
        })

        onSearchResults(results)
    }, [transactions, onSearchResults])

    // Real-time search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(query)
        }, 150) // 150ms debounce for real-time feel

        return () => clearTimeout(timeoutId)
    }, [query, performSearch])

    const handleClear = () => {
        setQuery("")
        onSearchResults(transactions)
    }

    return (
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="h-4 w-4" />
            </div>
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
