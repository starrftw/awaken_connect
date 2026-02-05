import { useEffect, useState, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { db, type ConnectedWallet, type ExportHistory } from '../lib/supabase'
import { CREDITCOIN_CHAIN } from '../lib/privy'
import { getDisplayName, truncateAddress } from '../lib/utils'
import { Wallet, ExternalLink, LogOut, User, Copy, Check, Download, Shield, ShieldCheck } from 'lucide-react'

export default function ProfileDashboard() {
    const { user, logout, ready, authenticated } = usePrivy()
    const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([])
    const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [username, setUsername] = useState<string | null>(null)

    useEffect(() => {
        if (ready && authenticated && user) {
            loadProfileData()
        } else if (ready && !authenticated) {
            setLoading(false)
        }
    }, [ready, authenticated, user])

    const loadProfileData = useCallback(async () => {
        if (!user?.id) return

        setLoading(true)
        try {
            // Load profile to get username
            const profile = await db.getProfile(user.id)
            if (profile) {
                setUsername(profile.username || null)
            }

            // Load connected wallets
            const wallets = await db.getConnectedWallets(user.id)
            setConnectedWallets(wallets || [])

            // Load export history
            const exports = await db.getExportHistory(user.id)
            setExportHistory(exports || [])
        } catch (error) {
            console.error('Error loading profile data:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'creditcoin':
                return '/creditcoin-logo.png'
            case 'kaspa':
                return '/kaspa-logo.svg'
            default:
                return null
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getSignedBadge = (isSigned: boolean) => {
        if (isSigned) {
            return (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Signed
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Not Signed
            </Badge>
        )
    }

    if (!ready || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-border/50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Sign In Required</CardTitle>
                        <CardDescription>
                            Please sign in to view your profile dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        <p>Use the login button in the header to authenticate with your wallet or email.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your connected wallets and activity</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => logout()}
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </header>

                {/* User Info Card */}
                <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Username</label>
                            <p className="mt-1 text-lg font-semibold">
                                {getDisplayName(username, user?.id)}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">User ID</label>
                            <div className="mt-1 flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                    {user?.id?.replace('did:privy:', '') || 'N/A'}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(user?.id || '')}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="mt-1 text-sm">
                                {user?.email?.address || 'Not provided'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Connected Wallets Card */}
                <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Connected Wallets
                        </CardTitle>
                        <CardDescription>
                            Wallets linked to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {connectedWallets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <Wallet className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No wallets connected yet</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Connect a wallet through the authentication flow
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {connectedWallets.map((wallet) => (
                                    <div
                                        key={wallet.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getWalletIcon(wallet.wallet_type) ? (
                                                <img
                                                    src={getWalletIcon(wallet.wallet_type)!}
                                                    alt={wallet.wallet_type}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Wallet className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-sm capitalize">
                                                    {wallet.wallet_type}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {truncateAddress(wallet.wallet_address)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {wallet.wallet_type === 'creditcoin' ? CREDITCOIN_CHAIN.name : 'Other Wallet'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(wallet.connected_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export History Card */}
                <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export History
                        </CardTitle>
                        <CardDescription>
                            Your exported transaction history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exportHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="rounded-full bg-muted p-4 mb-4">
                                    <Download className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No exports yet</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your export history will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exportHistory.map((exportItem) => (
                                    <div
                                        key={exportItem.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                                {exportItem.blockchain}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {exportItem.transaction_count} transactions
                                            </p>
                                            {getSignedBadge(exportItem.is_signed)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {exportItem.transaction_hash && (
                                                <a
                                                    href={`https://creditcoin.blockscout.com/tx/${exportItem.transaction_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-muted-foreground font-mono hover:text-primary flex items-center gap-1"
                                                >
                                                    {truncateAddress(exportItem.transaction_hash)}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                                {formatDate(exportItem.timestamp)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
