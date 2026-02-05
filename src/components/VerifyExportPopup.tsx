import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { AlertCircle, Check, Loader2, ExternalLink } from 'lucide-react'

interface VerifyExportPopupProps {
    isOpen: boolean
    onClose: () => void
    onVerifyAndDownload: () => Promise<void>
    onDownloadOnly: () => void
    blockchain: string
    transactionCount: number
    isLoading?: boolean
    error?: string | null
}

export function VerifyExportPopup({
    isOpen,
    onClose,
    onVerifyAndDownload,
    onDownloadOnly,
    blockchain,
    transactionCount,
    isLoading = false,
    error = null,
}: VerifyExportPopupProps) {
    const [selectedOption, setSelectedOption] = useState<'verify' | 'download' | null>(null)

    if (!isOpen) return null

    const handleVerifyAndDownload = async () => {
        setSelectedOption('verify')
        await onVerifyAndDownload()
    }

    const handleDownloadOnly = () => {
        setSelectedOption('download')
        onDownloadOnly()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md border-border/50 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <img
                            src="/creditcoin-logo.png"
                            alt="Creditcoin"
                            className="h-6 w-6"
                        />
                        Export to {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
                    </CardTitle>
                    <CardDescription>
                        You are about to export {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                        <h4 className="font-medium text-sm">Choose export option:</h4>

                        {/* Verify & Download Option */}
                        <button
                            onClick={handleVerifyAndDownload}
                            disabled={isLoading}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedOption === 'verify'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {isLoading && selectedOption === 'verify' ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    ) : (
                                        <Check className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Verify & Download</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sign the export hash on the Creditcoin blockchain and download.
                                        This provides cryptographic proof of your export.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Download Only Option */}
                        <button
                            onClick={handleDownloadOnly}
                            disabled={isLoading}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedOption === 'download'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {selectedOption === 'download' ? (
                                        <Check className="h-5 w-5 text-primary" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Download Only</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Download the CSV without blockchain verification.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <a
                        href="https://creditcoin.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                </CardFooter>
            </Card>
        </div>
    )
}
