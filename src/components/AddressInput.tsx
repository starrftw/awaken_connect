import { useState, useEffect } from "react"
import { Search, Wallet, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Network } from "./NetworkSelector"

interface AddressInputProps {
    network: Network
    onSubmit: (address: string) => void
    isLoading?: boolean
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
    humanity: {
        label: "Humanity Protocol",
        placeholder: "Enter Humanity address (0x...)",
        description: "Proof of humanity on blockchain",
        validate: (addr: string) => addr.startsWith('0x') && addr.length === 42,
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    fuel: {
        label: "Fuel Network",
        placeholder: "Enter Fuel address",
        description: "Modular execution layer",
        validate: (addr: string) => addr.length >= 40,
        example: "fuel1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
    }
}

export function AddressInput({ network, onSubmit, isLoading }: AddressInputProps) {
    const [value, setValue] = useState("")
    const [error, setError] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const config = NETWORK_CONFIGS[network]

    // Clear state when network changes
    useEffect(() => {
        setValue("")
        setError("")
    }, [network])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!config.validate(value)) {
            setError(`Invalid ${config.label} address format. Expected format: ${config.example}`)
            return
        }
        setError("")
        onSubmit(value)
    }

    const isValid = value ? config.validate(value) : true

    return (
        <TooltipProvider>
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Label with tooltip */}
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        Wallet Address
                    </label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <AlertCircle className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{config.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Example: {config.example}
                            </p>
                        </TooltipContent>
                    </Tooltip>
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
                            if (error) setError("")
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading}
                    />
                    {value && isValid && !error && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
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

                {/* Helper text */}
                {!error && !value && (
                    <p className="text-xs text-muted-foreground">
                        Enter your {config.label} wallet address to view transaction history
                    </p>
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
                            Fetching Transactions...
                        </>
                    ) : (
                        <>
                            <Search className="mr-2 h-4 w-4" />
                            Load Transaction History
                        </>
                    )}
                </Button>
            </form>
        </TooltipProvider>
    )
}
