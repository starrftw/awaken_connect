import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({
    value,
    onChange,
    placeholder = "Search by hash, address, or asset..."
}: SearchBarProps) {
    const handleClear = () => {
        onChange("")
    }

    return (
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="h-4 w-4" />
            </div>
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 pr-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
            {value && (
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
