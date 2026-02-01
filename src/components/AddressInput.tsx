import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Network } from "./NetworkSelector"

interface AddressInputProps {
    network: Network
    onSubmit: (address: string) => void
    isLoading?: boolean
}

export function AddressInput({ network, onSubmit, isLoading }: AddressInputProps) {
    const [value, setValue] = useState("")
    const [error, setError] = useState("")

    // Clear state when network changes
    useEffect(() => {
        setValue("")
        setError("")
    }, [network])

    const validate = (addr: string): boolean => {
        if (!addr) return false

        if (network === 'creditcoin') {
            // EVM-compatible address (0x...)
            return addr.startsWith('0x') && addr.length === 42
        }

        if (network === 'humanity') {
            // Humanity Protocol uses EVM-compatible addresses (0x...)
            return addr.startsWith('0x') && addr.length === 42
        }

        return false
    }

    const getNetworkLabel = (n: Network): string => {
        switch (n) {
            case 'creditcoin':
                return 'Creditcoin'
            case 'humanity':
                return 'Humanity Protocol'
            default:
                return n
        }
    }

    const getPlaceholder = (n: Network): string => {
        switch (n) {
            case 'creditcoin':
                return 'Creditcoin Address (0x...)'
            case 'humanity':
                return 'Humanity Protocol Address (0x...)'
            default:
                return 'Enter address'
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate(value)) {
            setError(`Invalid ${getNetworkLabel(network)} address format`)
            return
        }
        setError("")
        onSubmit(value)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={getPlaceholder(network)}
                    className="pl-9"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        if (error) setError("")
                    }}
                    disabled={isLoading}
                />
            </div>
            {error && <p className="text-xs text-destructive px-1">{error}</p>}

            <Button type="submit" disabled={!value || isLoading} className="w-full">
                {isLoading ? "Fetching Transactions..." : "Load History"}
            </Button>
        </form>
    )
}
