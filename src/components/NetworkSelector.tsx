import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export type Network = 'creditcoin' | 'humanity' | 'fuel'

interface NetworkSelectorProps {
    selected: Network
    onSelect: (network: Network) => void
    disabled?: boolean
}

interface NetworkOption {
    id: Network
    name: string
    description: string
    logo: string
    color: string
    bgColor: string
}

const NETWORKS: NetworkOption[] = [
    {
        id: 'creditcoin',
        name: 'Creditcoin',
        description: 'Via Blockscout',
        logo: '/creditcoin-logo.svg',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10'
    },
    {
        id: 'humanity',
        name: 'Humanity Protocol',
        description: 'Via Alchemy',
        logo: '/humanity-logo.svg',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
    },
    {
        id: 'fuel',
        name: 'Fuel Network',
        description: 'Via Fuel Explorer',
        logo: '/fuel-logo.svg',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10'
    }
]

// Fallback icon component when logo fails to load
function NetworkIcon({ network, className }: { network: Network; className?: string }) {
    const icons = {
        creditcoin: (
            <svg viewBox="0 0 32 32" className={className} fill="currentColor">
                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M16 8v8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
        ),
        humanity: (
            <svg viewBox="0 0 32 32" className={className} fill="currentColor">
                <circle cx="16" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        fuel: (
            <svg viewBox="0 0 32 32" className={className} fill="currentColor">
                <path d="M16 4l10 8-10 8-10-8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M6 16l10 8 10-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 12v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        )
    }
    return icons[network]
}

export function NetworkSelector({ selected, onSelect, disabled }: NetworkSelectorProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {NETWORKS.map((network) => {
                const isSelected = selected === network.id
                return (
                    <Card
                        key={network.id}
                        className={cn(
                            "cursor-pointer p-4 transition-all duration-200 relative overflow-hidden group",
                            "border-2",
                            isSelected
                                ? `border-primary bg-gradient-to-br from-primary/5 to-primary/10 ring-1 ring-primary/50 shadow-lg shadow-primary/10`
                                : "border-border/50 bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
                            disabled && "pointer-events-none opacity-50"
                        )}
                        onClick={() => onSelect(network.id)}
                    >
                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute top-2 right-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                            {/* Logo container */}
                            <div
                                className={cn(
                                    "rounded-xl p-3 transition-all duration-200",
                                    "ring-1 ring-border/50",
                                    isSelected
                                        ? `${network.bgColor} ring-primary/30 scale-110`
                                        : "bg-muted/50 group-hover:bg-muted group-hover:scale-105"
                                )}
                            >
                                <NetworkIcon
                                    network={network.id}
                                    className={cn(
                                        "h-8 w-8 transition-colors duration-200",
                                        isSelected ? network.color : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />
                            </div>

                            {/* Text content */}
                            <div className="space-y-0.5">
                                <h3
                                    className={cn(
                                        "font-semibold text-sm transition-colors",
                                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                >
                                    {network.name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {network.description}
                                </p>
                            </div>
                        </div>

                        {/* Hover gradient overlay */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-200",
                                !isSelected && "group-hover:opacity-100"
                            )}
                        />
                    </Card>
                )
            })}
        </div>
    )
}
