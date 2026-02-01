import { useState } from "react"

import { fetchCreditcoinTransactions } from "./adapters/creditcoin"
import { fetchHumanityTransactions } from "./adapters/humanity"
import { type ParsedTransaction, downloadCSV } from "./utils/csv"
import { NetworkSelector, type Network } from "./components/NetworkSelector"
import { AddressInput } from "./components/AddressInput"
import { TransactionTable } from "./components/TransactionTable"
import { Footer } from "./components/Footer"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Download } from "lucide-react"

export default function App() {
    const [network, setNetwork] = useState<Network>('creditcoin')
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentAddress, setCurrentAddress] = useState("")

    const handleNetworkChange = (n: Network) => {
        setNetwork(n)
        setTransactions([])
        setSelectedIds([])
        setCurrentAddress("")
    }

    const handleFetch = async (address: string) => {
        if (!address) {
            alert("Please enter a valid address")
            return
        }

        setIsLoading(true)
        setTransactions([])
        setSelectedIds([])
        setCurrentAddress(address)

        try {
            console.log(`Fetching for ${network} address: ${address}`);
            let data: ParsedTransaction[] = []
            if (network === 'creditcoin') {
                data = await fetchCreditcoinTransactions(address)
            } else if (network === 'humanity') {
                data = await fetchHumanityTransactions(address)
            }
            console.log("Fetched data:", data);

            if (data.length === 0) {
                alert("No transactions found for this address on " + network);
            }

            setTransactions(data)
        } catch (e: any) {
            console.error("Fetch Error:", e);
            alert(`Error fetching transactions: ${e.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = (onlySelected: boolean) => {
        if (transactions.length === 0) return

        const dataToExport = onlySelected
            ? transactions.filter(tx => selectedIds.includes(tx.id))
            : transactions

        if (dataToExport.length === 0) {
            alert("No transactions selected to export.")
            return
        }

        const filename = `${network}_${currentAddress.slice(0, 6)}_${new Date().toISOString().split('T')[0]}.csv`
        downloadCSV(dataToExport, filename)
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8">
            <div className="mx-auto max-w-5xl space-y-8">

                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                        Awaken Connect
                    </h1>
                    <p className="text-muted-foreground">
                        Export transaction history for tax & audit compliance.
                        Compatible with <span className="font-semibold text-foreground">Awaken</span>.
                    </p>
                </div>

                {/* Controls Card */}
                <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Select a network and enter your wallet address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <NetworkSelector selected={network} onSelect={handleNetworkChange} disabled={isLoading} />
                        <div className="max-w-xl mx-auto w-full">
                            <AddressInput network={network} onSubmit={handleFetch} isLoading={isLoading} />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Transactions
                            {transactions.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({transactions.length} found)</span>}
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={transactions.length === 0 || selectedIds.length === 0}
                                onClick={() => handleExport(true)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export Selected ({selectedIds.length})
                            </Button>
                            <Button
                                disabled={transactions.length === 0}
                                onClick={() => handleExport(false)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export All
                            </Button>
                        </div>
                    </div>

                    <TransactionTable
                        data={transactions}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                </div>

                <Footer />

            </div>
        </div>
    )
}
