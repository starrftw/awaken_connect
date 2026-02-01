/**
 * Awaken Tax Label Mapping Utility
 * 
 * Maps blockchain transaction method names to Awaken-compatible snake_case labels.
 * 
 * PRINCIPLE: Be conservative - only map when 100% certain. If unsure, return empty string.
 * 
 * Valid Awaken Labels (snake_case):
 * - add_liquidity, remove_liquidity, swap
 * - receive, payment
 * 
 * All other labels are intentionally left EMPTY because they are ambiguous:
 * - staking/unstaking: could be staking or lending
 * - claim_rewards: not reliably detected from providers
 * - lending operations: could be lending or other DeFi
 * - generic contract calls: no clear DeFi action
 */

// Mapping of method names to Awaken labels
// Only include CLEAR cases - everything else returns empty
const METHOD_TO_AWAKEN_LABEL: Record<string, string> = {
    // DEX / Swap operations - DEFINITE swap actions
    'exactInputSingle': 'swap',
    'exactOutputSingle': 'swap',
    'exactInput': 'swap',
    'exactOutput': 'swap',
    'swap': 'swap',

    // Liquidity operations - DEFINITE actions
    'add_liquidity': 'add_liquidity',
    'remove_liquidity': 'remove_liquidity',

    // Token transfers - DEFINITE payment (sending tokens)
    // Note: This is for contract-based token transfers (ERC20 style)
    // Native transfers are handled separately via isNativeTransfer parameter
    'token_transfer': 'payment',
    'token_transferFrom': 'payment',

    // ALL OTHER METHODS RETURN EMPTY - we are conservative
    // The following are intentionally NOT mapped:
    // - multicall: generic operation, context dependent
    // - token_approve: not a taxable event
    // - native_transfer: handled by isNativeTransfer parameter
    // - staking/unstake: could be staking OR lending (ambiguous)
    // - claim/claim_rewards/getReward: not reliably detectable
    // - supply/borrow/repay/withdraw: could be lending or other DeFi (ambiguous)
    // - deposit: could be staking, lending, or general (ambiguous)
    // - transfer_substrate: context dependent (ambiguous)
    // - contract_call: no clear DeFi action
    // - contract_creation: not a taxable event
};

/**
 * Maps a transaction method name to an Awaken-compatible label.
 * Returns empty string if no matching label is found or if uncertain.
 * 
 * @param methodName - The detected method name from transaction input data
 * @param isNativeTransfer - Whether this is a native token transfer (ETH, CTC, HMT, etc.)
 * @param isSender - Whether the user is sending (only used for native_transfer)
 * @returns The Awaken snake_case label or empty string
 */
export function mapToAwakenLabel(
    methodName: string,
    isNativeTransfer: boolean = false,
    isSender: boolean = true
): string {
    if (!methodName) return '';

    // Handle native transfers - these are simple payments/receives
    if (isNativeTransfer) {
        return isSender ? 'payment' : 'receive';
    }

    const label = METHOD_TO_AWAKEN_LABEL[methodName];

    // Return the mapped label, or empty string if not found
    // This ensures we only return labels for clear cases
    return label ?? '';
}

/**
 * All available Awaken labels for reference
 */
export const AWAKEN_LABELS = [
    'add_liquidity',
    'remove_liquidity',
    'swap',
    'receive',
    'payment',
] as const;

export type AwakenLabel = typeof AWAKEN_LABELS[number];
