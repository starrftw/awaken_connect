import type { PrivyClientConfig } from '@privy-io/react-auth'

// Creditcoin Testnet Configuration (chain ID 333777)
export const CREDITCOIN_CHAIN = {
    id: 333_777,
    name: 'Creditcoin Testnet',
    rpc: ['https://rpc.testnet.creditcoin.org'],
    currency: 'CTC',
    blockExplorer: 'https://creditcoin-testnet.blockscout.com',
    nativeCurrency: {
        name: 'Creditcoin',
        symbol: 'CTC',
        decimals: 18,
    },
}

// Creditcoin Mainnet Configuration (for scanning only - NOT for wallet connection)
export const CREDITCOIN_MAINNET_CHAIN = {
    id: 203,
    name: 'Creditcoin',
    rpc: ['https://rpc.creditcoin.org'],
    currency: 'CTC',
    blockExplorer: 'https://creditcoin.blockscout.com',
    nativeCurrency: {
        name: 'Creditcoin',
        symbol: 'CTC',
        decimals: 18,
    },
}

// Only Creditcoin Testnet for wallet connection (as per requirements)
export const SUPPORTED_CHAINS = [CREDITCOIN_CHAIN]

// Privy configuration - Creditcoin Testnet ONLY for wallet connection
// Network selector allows both Mainnet and Testnet for scanning
export const PRIVY_CONFIG: PrivyClientConfig = {
    appearance: {
        logo: 'https://awaken.tax/logo.png',
    },
    // Enable embedded wallets for non-custodial experience
    embeddedWallets: {
        ethereum: {
            createOnLogin: 'users-without-wallets' as const,
        },
    },
    // Mfa configuration (optional)
    mfa: {
        noPromptOnMfaRequired: false,
    },
}

// Chain ID to chain info mapping (for both Mainnet and Testnet scanning)
export const CHAIN_INFO: Record<number, typeof CREDITCOIN_CHAIN> = {
    [CREDITCOIN_MAINNET_CHAIN.id]: CREDITCOIN_MAINNET_CHAIN,
    [CREDITCOIN_CHAIN.id]: CREDITCOIN_CHAIN,
}

// Helper function to get chain info by chain ID
export function getChainInfo(chainId: number) {
    return CHAIN_INFO[chainId] || null
}

// Helper function to detect wallet type from chain ID
export function detectWalletType(chainId: number): 'creditcoin' | 'creditcoin-testnet' | 'other' {
    if (chainId === CREDITCOIN_MAINNET_CHAIN.id) return 'creditcoin'
    if (chainId === CREDITCOIN_CHAIN.id) return 'creditcoin-testnet'
    return 'other'
}
