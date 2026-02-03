import { useState, useMemo } from "react"

import { fetchCreditcoinTransactions } from "./adapters/creditcoin"
import { fetchHumanityTransactions } from "./adapters/humanity"
import { fetchCeloTransactions } from "./adapters/celo"
import { type ParsedTransaction, downloadCSV } from "./utils/csv"
import { NetworkSelector, type Network } from "./components/NetworkSelector"
import { AddressInput } from "./components/AddressInput"
import { TransactionTable } from "./components/TransactionTable"
import { FilterPanel, type FilterState, applyFilters } from "./components/FilterPanel"
import { SearchBar } from "./components/SearchBar"
import { SkeletonTable } from "./components/SkeletonTable"
import { Footer } from "./components/Footer"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Download, FileSpreadsheet, Link2Off, Infinity, Lock } from "lucide-react"

export default function App() {
    const [network, setNetwork] = useState<Network>('creditcoin')
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentAddress, setCurrentAddress] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterState>({
        transactionTypes: [],
        assetFilter: [],
        datePreset: "all",
        dateFrom: "",
        dateTo: "",
    })

    // Extract unique assets from all transactions
    const availableAssets = useMemo(() => {
        const assets = new Set<string>()
        transactions.forEach(tx => {
            if (tx.sentCurrency) assets.add(tx.sentCurrency)
            if (tx.receivedCurrency) assets.add(tx.receivedCurrency)
            if (tx.feeCurrency) assets.add(tx.feeCurrency)
        })
        return Array.from(assets).sort()
    }, [transactions])

    // Unified display logic - apply search then filters
    const displayedTransactions = useMemo(() => {
        let result = transactions

        // 1. Apply Search
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter(tx => {
                return (
                    tx.hash.toLowerCase().includes(lowerQuery) ||
                    tx.notes.toLowerCase().includes(lowerQuery) ||
                    tx.receivedCurrency?.toLowerCase().includes(lowerQuery) ||
                    tx.sentCurrency?.toLowerCase().includes(lowerQuery) ||
                    tx.feeCurrency?.toLowerCase().includes(lowerQuery) ||
                    tx.receivedQuantity?.includes(lowerQuery) ||
                    tx.sentQuantity?.includes(lowerQuery) ||
                    tx.status.toLowerCase().includes(lowerQuery) ||
                    tx.type.toLowerCase().includes(lowerQuery)
                )
            })
        }

        // 2. Apply Filters
        result = applyFilters(result, filters)

        console.log('[App] Pipeline:', {
            original: transactions.length,
            searchQuery: searchQuery,
            afterSearch: result.length,
            filters: filters
        })

        return result
    }, [transactions, searchQuery, filters])

    const handleNetworkChange = (n: Network) => {
        console.log('[App] Network changing from', network, 'to', n)
        console.log('[App] Current address before reset:', currentAddress)
        setNetwork(n)
        setTransactions([])
        setSearchQuery("")
        setSelectedIds([])
        // FIX: Don't reset address here - let user keep it when switching networks
        // setCurrentAddress("")
        console.log('[App] Address preserved:', currentAddress)
        setFilters({
            transactionTypes: [],
            assetFilter: [],
            datePreset: "all",
            dateFrom: "",
            dateTo: "",
        })
    }

    const handleFetch = async (address: string) => {
        if (!address) {
            setError("Please enter a valid wallet address")
            return
        }

        setIsLoading(true)
        setTransactions([])
        setSearchQuery("")
        setSelectedIds([])
        setCurrentAddress(address)
        setError(null)

        try {
            let data: ParsedTransaction[] = []
            if (network === 'creditcoin') {
                data = await fetchCreditcoinTransactions(address)
            } else if (network === 'humanity') {
                data = await fetchHumanityTransactions(address)
            } else if (network === 'celo') {
                data = await fetchCeloTransactions(address, { isTestnet: false })
            }

            if (data.length === 0) {
                setError("No transactions found for this address")
            }

            setTransactions(data)
        } catch (e: any) {
            setError(`Error fetching transactions: ${e.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = (onlySelected: boolean) => {
        const dataToExport = onlySelected
            ? displayedTransactions.filter(tx => selectedIds.includes(tx.id))
            : displayedTransactions

        if (dataToExport.length === 0) {
            setError("No transactions to export")
            return
        }

        const filename = `${network}_${currentAddress.slice(0, 6)}_${new Date().toISOString().split('T')[0]}.csv`
        downloadCSV(dataToExport, filename)
        setError(null)
    }

    const hasTransactions = transactions.length > 0
    const hasSearchActive = searchQuery.length > 0
    const hasFiltersActive = filters.transactionTypes.length > 0 || filters.assetFilter.length > 0 || filters.datePreset !== "all" || filters.dateFrom || filters.dateTo

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground font-sans p-4 sm:p-8">
            <div className="mx-auto max-w-6xl space-y-8">

                {/* Header */}
                <header className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-3 shadow-lg shadow-primary/20">
                            <FileSpreadsheet className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                            Awaken Connect
                        </h1>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Make Your Crypto Assets Tax-Ready</h1>
                    <p className="text-muted-foreground max-w-lg text-lg text-wrap: balance">
                        Export your transaction history to an Awaken-compatible CSV in 45 seconds.
                    </p>
                    <div className="flex items-center justify-center gap-12 pt-4">
                        <div className="flex flex-col items-center text-center gap-1">
                            <Lock className="h-6 w-6 text-green-500" />
                            <span className="font-semibold text-foreground">100% Private</span>
                            <span className="text-xs text-muted-foreground">Data stays on your device</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <Link2Off className="h-6 w-6 text-blue-500" />
                            <span className="font-semibold text-foreground">No Auth Needed</span>
                            <span className="text-xs text-muted-foreground">Just paste your address</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <Infinity className="h-6 w-6 text-purple-500" />
                            <span className="font-semibold text-foreground">Unlimited History</span>
                            <span className="text-xs text-muted-foreground">No transaction limits</span>
                        </div>
                    </div>
                </header>

                {/* Configuration Card */}
                <Card className="border-border/50 shadow-xl shadow-black/5 bg-gradient-to-br from-card to-card/95 backdrop-blur overflow-hidden">
                    <CardHeader className="pb-4 border-b border-border/50 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                        Wallet Address
                                    </span>
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                    Export transaction history to Awaken tax format. Select network, paste address, done.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Input Zone */}
                            <div className="space-y-6">
                                <NetworkSelector
                                    selected={network}
                                    onSelect={handleNetworkChange}
                                    disabled={isLoading}
                                />
                                <div className="max-w-xl mx-auto w-full">
                                    {error && (
                                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                            {error}
                                        </div>
                                    )}
                                    <AddressInput
                                        network={network}
                                        onSubmit={handleFetch}
                                        isLoading={isLoading}
                                        clearError={() => setError(null)}
                                    />
                                </div>
                            </div>

                            {/* Right Column - Info Panel */}
                            <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                                <h3 className="font-semibold text-foreground mb-4">How it Works</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">1</div>
                                        <p className="text-sm text-muted-foreground pt-0.5">Paste your public address.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">2</div>
                                        <p className="text-sm text-muted-foreground pt-0.5">Click "Analyze Wallet".</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">3</div>
                                        <p className="text-sm text-muted-foreground pt-0.5">Export CSV and upload to <a href="https://awaken.tax" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Awaken.tax</a>.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                Loading Transactions...
                            </h2>
                        </div>
                        <SkeletonTable />
                    </div>
                )}

                {/* Data Section */}
                {hasTransactions && !isLoading && (
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    Transactions
                                    <Badge variant="secondary" className="text-xs">
                                        {displayedTransactions.length}
                                    </Badge>
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)} on {network.charAt(0).toUpperCase() + network.slice(1)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {selectedIds.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleExport(true)}
                                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Selected ({selectedIds.length})
                                    </Button>
                                )}
                                <Button
                                    variant="default"
                                    onClick={() => handleExport(false)}
                                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-lg shadow-green-500/20 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export All
                                </Button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by hash, asset, or type..."
                        />

                        {/* Filter Panel */}
                        <FilterPanel
                            transactions={transactions}
                            filters={filters}
                            onFiltersChange={setFilters}
                            availableAssets={availableAssets}
                        />

                        {/* Results Info */}
                        {(hasSearchActive || hasFiltersActive) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Showing</span>
                                <Badge variant="outline" className="font-mono">
                                    {displayedTransactions.length}
                                </Badge>
                                <span>of</span>
                                <Badge variant="outline" className="font-mono">
                                    {transactions.length}
                                </Badge>
                                <span>transactions</span>
                            </div>
                        )}

                        {/* Transaction Table */}
                        <TransactionTable
                            data={displayedTransactions}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                        />
                    </div>
                )}

                {/* Empty State */}
                {!hasTransactions && !isLoading && (
                    <Card className="border-dashed border-2 border-border/50 bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                Enter your wallet address above to load your transaction history.
                                Your data is processed locally and never stored.
                            </p>
                        </CardContent>
                    </Card>
                )}



                <Footer />

            </div>
        </div>
    )
}
