import { useState, useEffect } from "react"
import { Search, Wallet, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Network } from "./NetworkSelector"
import { validateKaspaAddress } from "../adapters/kaspa"

interface AddressInputProps {
    network: Network
    onSubmit: (address: string) => void
    isLoading?: boolean
    clearError?: () => void
}

interface NetworkConfig {
    label: string
    placeholder: string
    description: string
    validate: (addr: string) => boolean
    example: string
}

const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
    creditcoin: {
        label: "Creditcoin",
        placeholder: "Enter Creditcoin address (0x...)",
        description: "EVM-compatible blockchain for credit history",
        validate: (addr: string) => addr.startsWith('0x') && addr.length === 42,
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    "creditcoin-testnet": {
        label: "Creditcoin Testnet",
        placeholder: "Enter Creditcoin Testnet address (0x...)",
        description: "Testnet for Creditcoin blockchain",
        validate: (addr: string) => addr.startsWith('0x') && addr.length === 42,
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    humanity: {
        label: "Humanity Protocol",
        placeholder: "Enter Humanity address (0x...)",
        description: "Proof of humanity on blockchain",
        validate: (addr: string) => addr.startsWith('0x') && addr.length === 42,
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    celo: {
        label: "Celo",
        placeholder: "Enter Celo address (0x...)",
        description: "Mobile-first EVM-compatible blockchain",
        validate: (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr),
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    kaspa: {
        label: "Kaspa",
        placeholder: "Enter Kaspa address (kaspa:q...)",
        description: "Fast, proof-of-work DAG blockchain",
        validate: (addr: string) => validateKaspaAddress(addr),
        example: "kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j"
    }
}

export function AddressInput({ network, onSubmit, isLoading, clearError }: AddressInputProps) {
    const [value, setValue] = useState("")
    const [error, setError] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const config = NETWORK_CONFIGS[network]

    // Clear error only when network changes (NOT value)
    useEffect(() => {
        setError("")
    }, [network])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!config.validate(value)) {
            setError(`Invalid ${config.label} address format. Expected: ${config.example}`)
            if (clearError) clearError()
            return
        }
        setError("")
        onSubmit(value)
    }

    const isValid = value ? config.validate(value) : true

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Label */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Wallet Address
                </label>
            </div>

            {/* Input field */}
            <div className="relative group">
                <div className={`
                        absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                        ${isFocused ? 'text-primary' : 'text-muted-foreground'}
                    `}>
                    <Search className="h-4 w-4" />
                </div>
                <Input
                    type="text"
                    placeholder={config.placeholder}
                    className={`
                            pl-10 pr-4 h-12 text-sm font-mono
                            transition-all duration-200
                            ${isFocused ? 'border-primary/50 ring-2 ring-primary/10' : ''}
                            ${error ? 'border-destructive focus:border-destructive' : ''}
                            ${value && isValid ? 'border-green-500/50 focus:border-green-500' : ''}
                        `}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        if (error) {
                            setError("")
                            if (clearError) clearError()
                        }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={isLoading}
                />
                {value && isValid && !error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-500 font-medium">
                        <span className="hidden sm:inline">✔ Valid Address</span>
                        <span className="sm:hidden">✔</span>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-start gap-2 text-xs text-destructive animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Submit button */}
            <Button
                type="submit"
                disabled={!value || isLoading}
                className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 shadow-lg shadow-primary/20"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Wallet...
                    </>
                ) : (
                    <>
                        <Search className="mr-2 h-4 w-4" />
                        Analyze Wallet
                    </>
                )}
            </Button>
        </form>
    )
}
