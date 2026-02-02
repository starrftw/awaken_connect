import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

export type Network = 'creditcoin' | 'humanity'

interface NetworkSelectorProps {
    selected: Network
    onSelect: (network: Network) => void
    disabled?: boolean
}

interface NetworkOption {
    id: Network
    name: string
    logo: string
}

const NETWORKS: NetworkOption[] = [
    {
        id: 'creditcoin',
        name: 'Creditcoin',
        logo: '/creditcoin-logo.png'
    },
    {
        id: 'humanity',
        name: 'Humanity Protocol',
        logo: '/humanity-logo.avif'
    }
]

export function NetworkSelector({ selected, onSelect, disabled }: NetworkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedNetwork = NETWORKS.find(n => n.id === selected)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="flex flex-wrap gap-3 items-center">
            {/* Blockchain Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-lg border-2 bg-card transition-all duration-200",
                        "min-w-[180px] justify-between",
                        "hover:border-primary/30 hover:shadow-md",
                        disabled && "pointer-events-none opacity-50"
                    )}
                >
                    {/* Logo and Name */}
                    <div className="flex items-center gap-2">
                        {selectedNetwork && (
                            <img
                                src={selectedNetwork.logo}
                                alt={`${selectedNetwork.name} logo`}
                                className="h-6 w-6 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                }}
                            />
                        )}
                        <span className="font-semibold text-sm">
                            {selectedNetwork?.name || 'Select Network'}
                        </span>
                    </div>
                    <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 z-20 w-[200px] bg-popover border rounded-lg shadow-lg overflow-hidden">
                        {NETWORKS.map((network) => {
                            const isSelected = selected === network.id
                            return (
                                <button
                                    key={network.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(network.id)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                        "hover:bg-muted",
                                        isSelected && "bg-primary/5"
                                    )}
                                >
                                    <img
                                        src={network.logo}
                                        alt={`${network.name} logo`}
                                        className="h-6 w-6 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                    <span className="flex-1 font-medium text-sm">{network.name}</span>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
