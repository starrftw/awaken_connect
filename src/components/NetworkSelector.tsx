import { Coins, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export type Network = 'creditcoin' | 'humanity'

interface NetworkSelectorProps {
    selected: Network
    onSelect: (network: Network) => void
    disabled?: boolean
}

export function NetworkSelector({ selected, onSelect, disabled }: NetworkSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Card
                className={cn(
                    "cursor-pointer p-4 transition-all hover:border-primary/50",
                    selected === 'creditcoin' ? "border-primary bg-primary/5 ring-1 ring-primary" : "opacity-80 hover:opacity-100",
                    disabled && "pointer-events-none opacity-50"
                )}
                onClick={() => onSelect('creditcoin')}
            >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="rounded-full bg-background p-2 ring-1 ring-border">
                        <Coins className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Creditcoin</h3>
                        <p className="text-xs text-muted-foreground">Via Blockscout</p>
                    </div>
                </div>
            </Card>

            <Card
                className={cn(
                    "cursor-pointer p-4 transition-all hover:border-primary/50",
                    selected === 'humanity' ? "border-primary bg-primary/5 ring-1 ring-primary" : "opacity-80 hover:opacity-100",
                    disabled && "pointer-events-none opacity-50"
                )}
                onClick={() => onSelect('humanity')}
            >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="rounded-full bg-background p-2 ring-1 ring-border">
                        <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Humanity Protocol</h3>
                        <p className="text-xs text-muted-foreground">Mainnet</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
