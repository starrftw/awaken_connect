import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

const API_ENDPOINT = 'https://creditcoin.blockscout.com/api';
const TESTNET_API_ENDPOINT = 'https://creditcoin-testnet.blockscout.com/api';

// Creditcoin Testnet Configuration
export const CREDITCOIN_TESTNET = {
    chainId: 333777,
    chainName: 'Creditcoin Testnet',
    rpcUrls: ['https://rpc.cc3-testnet.creditcoin.network'],
    contractAddress: '0x21E95B92a07B00e7f410Ba170aE17763971D9F60',
    blockExplorerUrl: 'https://creditcoin-testnet.blockscout.com',
    nativeCurrency: {
        name: 'Creditcoin',
        symbol: 'CTC',
        decimals: 18,
    },
};

// Creditcoin Mainnet Configuration
export const CREDITCOIN_MAINNET = {
    chainId: 2031,
    chainName: 'Creditcoin',
    rpcUrl: 'https://rpc.creditcoin.org',
    contractAddress: '0x...',
    blockExplorerUrl: 'https://creditcoin.blockscout.com',
    nativeCurrency: {
        name: 'Creditcoin',
        symbol: 'CTC',
        decimals: 18,
    },
};

// ABI for signing export hash - function selector for 'signExport(bytes32)'
const SIGNING_FUNCTION_SELECTOR = '0x12345678'; // User will provide actual selector

/**
 * Sign an export hash on the Creditcoin blockchain using personal_sign
 * This avoids the complexity of eth_sendTransaction and its authorization issues
 * @param exportHash - The hash of the exported data to sign
 * @param walletAddress - The wallet address to sign with
 * @returns Signature if successful
 */
export async function signExportOnCreditcoin(
    exportHash: string,
    walletAddress: string
): Promise<string | null> {
    console.log('[DEBUG] signExportOnCreditcoin called with:', { exportHash, walletAddress });
    try {
        // Check if MetaMask or compatible wallet is available
        console.log('[DEBUG] Checking for window.ethereum:', typeof window.ethereum);
        console.log('[DEBUG] Checking for (window as any).privy:', typeof (window as any).privy);

        if (!window.ethereum && !(window as any).privy) {
            console.error('[DEBUG] No wallet detected');
            throw new Error('No Ethereum wallet detected. Please install MetaMask or a compatible wallet.');
        }

        // Get the wallet provider - prioritize Privy if available
        const walletProvider = (window as any).privy?.ethereum || window.ethereum;
        console.log('[DEBUG] Using wallet provider:', walletProvider ? 'found' : 'not found');

        // Dynamically fetch the active account to handle account switching
        const accounts = await walletProvider.request({ method: 'eth_accounts' });
        let activeAddress = accounts[0];

        // If no accounts returned, request authorization
        if (!activeAddress) {
            const authorizedAccounts = await walletProvider.request({ method: 'eth_requestAccounts' });
            if (authorizedAccounts.length === 0) {
                throw new Error('No wallet accounts authorized. Please connect your wallet.');
            }
            activeAddress = authorizedAccounts[0];
        }

        console.log('[DEBUG] Using active address:', activeAddress);

        // Convert hash to proper format for personal_sign
        // personal_sign expects the message to be hex-encoded
        let messageHash = exportHash;
        if (!messageHash.startsWith('0x')) {
            messageHash = '0x' + messageHash;
        }

        // Ensure it's a valid hex string
        if (messageHash.length !== 66) {
            // Pad to 66 chars (0x + 64 hex chars)
            messageHash = '0x' + messageHash.slice(2).padStart(64, '0');
        }

        console.log('[DEBUG] Using personal_sign with hash:', messageHash);

        // Use personal_sign instead of eth_sendTransaction
        // This is simpler and doesn't require chain configuration or gas
        const signature = await walletProvider.request({
            method: 'personal_sign',
            params: [messageHash, activeAddress],
        });

        console.log('[DEBUG] Personal sign result:', signature);

        // Return the signature as the "transaction hash"
        // In production, you would verify this signature on-chain
        return signature;
    } catch (error: any) {
        console.error('[DEBUG] Error signing export on Creditcoin:', error);
        console.error('[DEBUG] Error code:', error.code);
        console.error('[DEBUG] Error message:', error.message);

        // If personal_sign fails, fall back to eth_sendTransaction
        console.log('[DEBUG] personal_sign failed, falling back to eth_sendTransaction...');

        try {
            // Get the wallet provider
            const walletProvider = (window as any).privy?.ethereum || window.ethereum;

            // Get fresh accounts after authorization - use the authorized account
            const freshAccounts = await walletProvider.request({
                method: 'eth_requestAccounts'
            });

            if (freshAccounts.length === 0) {
                throw new Error('No wallet accounts authorized. Please connect your wallet.');
            }

            // Use the first authorized account as the active address
            const activeAddress = freshAccounts[0];

            // Ensure chain is added
            try {
                await walletProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: `0x${CREDITCOIN_TESTNET.chainId.toString(16)}`,
                            chainName: CREDITCOIN_TESTNET.chainName,
                            rpcUrls: CREDITCOIN_TESTNET.rpcUrls,
                            blockExplorerUrls: [CREDITCOIN_TESTNET.blockExplorerUrl],
                            nativeCurrency: CREDITCOIN_TESTNET.nativeCurrency,
                        },
                    ],
                });
            } catch (e) {
                // Chain already exists, continue
            }

            // Switch to Creditcoin Testnet
            try {
                await walletProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${CREDITCOIN_TESTNET.chainId.toString(16)}` }],
                });
            } catch (e) {
                // Already on the chain, continue
            }

            // Create transaction params - use the dynamically obtained active address
            const hashBytes = exportHash.startsWith('0x') ? exportHash : `0x${exportHash}`;
            const txParams = {
                from: activeAddress,
                to: CREDITCOIN_TESTNET.contractAddress,
                data: `${SIGNING_FUNCTION_SELECTOR}${hashBytes.slice(2).padStart(64, '0')}`,
            };

            console.log('[DEBUG] Sending fallback transaction with params:', txParams);

            const result = await walletProvider.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });

            console.log('[DEBUG] Fallback transaction sent successfully:', result);
            return result;
        } catch (fallbackError: any) {
            throw new Error(`Failed to sign export: ${fallbackError.message}`);
        }
    }
}

/**
 * Generate a hash for the export data
 * @param transactions - The transactions being exported
 * @param blockchain - The blockchain network
 * @param walletAddress - The wallet address
 * @returns A hash string representing the export
 */
export function generateExportHash(
    transactions: ParsedTransaction[],
    blockchain: string,
    walletAddress: string
): string {
    const exportData = {
        transactions: transactions.map(tx => ({
            hash: tx.hash,
            date: tx.date.toISOString(),
            amount: tx.sentQuantity || tx.receivedQuantity,
            type: tx.type,
        })),
        blockchain,
        walletAddress,
        timestamp: new Date().toISOString(),
    };

    // Create a simple hash (in production, use a proper cryptographic hash)
    const dataString = JSON.stringify(exportData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex string
    const hashHex = Math.abs(hash).toString(16).padStart(64, '0');
    return `0x${hashHex}`;
}

export async function fetchCreditcoinTransactions(address: string, isTestnet: boolean = false): Promise<ParsedTransaction[]> {
    const endpoint = isTestnet ? TESTNET_API_ENDPOINT : API_ENDPOINT;
    const url = `${endpoint}?module=account&action=txlist&address=${address}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Creditcoin API Error: ${response.statusText}`);

    const json = await response.json();

    if (json.status === "0" && json.message !== "No transactions found") {
        throw new Error(`Blockscout Error: ${json.message}`);
    }

    const transactions = json.result || [];
    return transactions.map((tx: any, index: number) => parseCreditcoinTransaction(tx, address, index));
}

function parseCreditcoinTransaction(tx: any, userAddress: string, index: number): ParsedTransaction {
    const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();
    const decimals = 18; // CTC is 18 decimals

    let valueStr = formatUnits(tx.value, decimals);

    // Fix Negative Zero issue: formatUnits generally won't return -0 from BigInt string, 
    // but if we were doing float math it might.
    // Using string/sem-bigint parsing logic below acts on absolute strings.

    const fee = formatUnits((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), decimals);

    // Status
    // Blockscout: txreceipt_status '1' = success, '0' = fail, '' = pending sometimes
    let status = TransactionStatus.UNKNOWN;
    if (tx.txreceipt_status === '1') status = TransactionStatus.SUCCESS;
    else if (tx.txreceipt_status === '0') status = TransactionStatus.FAILED;

    // Detect transaction type based on input data and method
    const txType = detectTransactionType(tx);

    // Determine action type based on transaction characteristics
    let actionType = isSender ? ActionType.SEND : ActionType.RECEIVE;
    if (txType === 'exactInputSingle' || txType === 'exactOutputSingle' || txType === 'exactInput' || txType === 'swap') {
        actionType = ActionType.SWAP;
    } else if (txType !== 'native_transfer' && txType !== 'token_transfer') {
        actionType = ActionType.CONTRACT;
    }

    return {
        id: `${tx.hash}_${index}`,
        date: new Date(parseInt(tx.timeStamp) * 1000),
        receivedQuantity: isSender ? "" : valueStr,
        receivedCurrency: isSender ? "" : "CTC",
        sentQuantity: isSender ? valueStr : "",
        sentCurrency: isSender ? "CTC" : "",
        feeAmount: isSender ? fee : "",
        feeCurrency: isSender ? "CTC" : "",
        hash: tx.hash,
        notes: buildNotes(tx, isSender, txType),
        status: status,
        type: actionType,
        link: `https://creditcoin.blockscout.com/tx/${tx.hash}`,
        tag: mapToAwakenLabel(txType, txType === 'native_transfer', isSender)
    };
}

// Detect transaction type based on input data and contract interactions
function detectTransactionType(tx: any): string {
    const input = tx.input || '0x';
    const methodId = input.slice(0, 10).toLowerCase();

    // Common method signatures for DeFi and token operations
    const methodSignatures: Record<string, string> = {
        // ERC20 Token methods
        '0xa9059cbb': 'token_transfer',
        '0x23b872dd': 'token_transferFrom',
        '0x095ea7b3': 'token_approve',
        '0x70a08231': 'token_balanceOf',
        '0xdd62ed3e': 'token_allowance',
        '0x06fdde03': 'token_name',
        '0x95d89b41': 'token_symbol',
        '0x313ce567': 'token_decimals',
        '0x40c10f19': 'token_mint',
        '0x42966c68': 'token_burn',

        // Uniswap V3 / DEX methods
        '0x414bf389': 'exactInputSingle',
        '0x88316456': 'exactInput',
        '0xc04b8d59': 'exactOutputSingle',
        '0x09b81346': 'exactOutput',
        '0x5ae401dc': 'multicall',
        '0xac9650d8': 'multicall',
        '0xf28c0498': 'swap',
        '0x128acb08': 'swap',

        // Lending/Borrowing
        '0xe8eda9df': 'borrow',
        '0xa415bcad': 'repay',
        '0x617ba037': 'supply',
        '0x69328dec': 'withdraw',
        '0x2e1a7d4d': 'withdraw',
        '0xd0e30db0': 'deposit',

        // Staking
        '0xa694fc3a': 'stake',
        '0x4e71d92d': 'claim',
        '0x3d18b912': 'getReward',
        '0xe9fad8ee': 'exit',

        // Creditcoin specific
        '0xddde0930': 'transfer_substrate',
        '0x469451e0': 'claim',
        '0x6a627842': 'mint',
        '0x9012c4a8': 'claim_rewards',
        '0x751fd179': 'stake',
    };

    // Check for contract creation
    if (!tx.to || tx.to === '') {
        return 'contract_creation';
    }

    // Check for contract interaction (non-empty input)
    if (input && input !== '0x' && input.length > 2) {
        const detectedMethod = methodSignatures[methodId];
        if (detectedMethod) {
            return detectedMethod;
        }
        return 'contract_call';
    }

    // Native token transfer
    return 'native_transfer';
}

function buildNotes(_tx: any, isSender: boolean, txType: string): string {
    const typeLabels: Record<string, string> = {
        'token_transfer': 'Token Transfer',
        'token_transferFrom': 'Token Transfer From',
        'token_approve': 'Token Approval',
        'token_mint': 'Token Mint',
        'token_burn': 'Token Burn',
        'deposit': 'Deposit',
        'withdraw': 'Withdraw',
        'supply': 'Supply',
        'borrow': 'Borrow',
        'repay': 'Repay',
        'exactInputSingle': 'Swap (Exact Input Single)',
        'exactOutputSingle': 'Swap (Exact Output Single)',
        'exactInput': 'Swap (Exact Input)',
        'exactOutput': 'Swap (Exact Output)',
        'swap': 'Swap',
        'multicall': 'Multicall',
        'stake': 'Stake',
        'claim': 'Claim',
        'getReward': 'Get Reward',
        'exit': 'Exit',
        'transfer_substrate': 'Transfer Substrate',
        'claim_rewards': 'Claim Rewards',
        'contract_creation': 'Contract Creation',
        'contract_call': 'Contract Interaction',
        'native_transfer': isSender ? 'Sent CTC' : 'Received CTC'
    };

    return typeLabels[txType] || (isSender ? 'Sent CTC' : 'Received CTC');
}

function formatUnits(value: string, decimals: number): string {
    if (!value || value === "0") return "0";
    // Safety check for negative values if API ever returns them (unlikely for uint256 but robust code)
    if (value.startsWith('-')) return "0"; // Or handle logic, but crypto values usually unsigned

    const val = BigInt(value);
    if (val === BigInt(0)) return "0";

    const str = val.toString().padStart(decimals + 1, '0');
    const integerPart = str.slice(0, -decimals);
    const fractionalPart = str.slice(-decimals).replace(/0+$/, '');

    // Ensure we don't return "-0" via some edge case (though string slicing on unsigned BigInt is safe)
    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}
