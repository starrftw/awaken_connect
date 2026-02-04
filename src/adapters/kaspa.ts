/**
 * Kaspa Blockchain Adapter for Awaken Connect
 * 
 * Uses Kaspa API (api.kaspa.org) with:
 * - Pagination for full transaction history
 * - Rate limiting (500ms delay between requests)
 * - Retry logic for 429 errors (wait 5s, retry)
 */

import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

// Kaspa-specific constants
const KASPA_SYMBOL = 'KAS';
const KASPA_DECIMALS = 8;
const KASPA_API_BASE = 'https://api.kaspa.org';
const KASPA_ADDRESS_PREFIX = 'kaspa:';

// Pagination and rate limiting
const PAGE_SIZE = 50;
const REQUEST_DELAY_MS = 500;
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;

/**
 * Validates Kaspa address format
 */
export function validateKaspaAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
        return false;
    }

    const lowerAddress = address.toLowerCase().trim();

    if (!lowerAddress.startsWith(KASPA_ADDRESS_PREFIX)) {
        return false;
    }

    const rawAddress = lowerAddress.replace(KASPA_ADDRESS_PREFIX, '');

    if (!/^[a-z0-9]+$/.test(rawAddress)) {
        return false;
    }

    if (rawAddress.length < 50 || rawAddress.length > 70) {
        return false;
    }

    return true;
}

export function normalizeKaspaAddress(address: string): string {
    return address.toLowerCase().trim();
}

function formatUnits(sompi: string, decimals: number = KASPA_DECIMALS): string {
    if (!sompi || sompi === '0') return '0';

    const val = BigInt(sompi);
    if (val === BigInt(0)) return '0';

    const str = val.toString().padStart(decimals + 1, '0');
    const integerPart = str.slice(0, -decimals);
    const fractionalPart = str.slice(-decimals).replace(/0+$/, '');

    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries: number = MAX_RETRIES): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);

            if (response.status === 429 && attempt < retries) {
                console.log(`[Kaspa Adapter] Rate limited (429), waiting ${RETRY_DELAY_MS}ms before retry ${attempt + 1}/${retries}`);
                await sleep(RETRY_DELAY_MS);
                continue;
            }

            return response;
        } catch (error: any) {
            lastError = error;
            console.log(`[Kaspa Adapter] Fetch error: ${error.message}, attempt ${attempt + 1}/${retries}`);

            if (attempt < retries) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Fetch all transactions for an address with pagination
 */
async function fetchAllTransactionsPaginated(address: string): Promise<any[]> {
    const allTransactions: any[] = [];
    let offset = 0;
    let hasMore = true;

    console.log(`[Kaspa Adapter] Starting pagination fetch for ${address}`);

    while (hasMore) {
        const url = `${KASPA_API_BASE}/addresses/${address}/full-transactions?offset=${offset}&limit=${PAGE_SIZE}`;

        console.log(`[Kaspa Adapter] Fetching page: offset=${offset}, limit=${PAGE_SIZE}`);

        try {
            const response = await fetchWithRetry(url);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                console.log(`[Kaspa Adapter] Response is not an array, stopping pagination`);
                hasMore = false;
                continue;
            }

            if (data.length === 0) {
                console.log(`[Kaspa Adapter] No more data at offset=${offset}, pagination complete`);
                hasMore = false;
                continue;
            }

            allTransactions.push(...data);
            console.log(`[Kaspa Adapter] Got ${data.length} transactions, total: ${allTransactions.length}`);

            if (data.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                offset += PAGE_SIZE;
                console.log(`[Kaspa Adapter] Waiting ${REQUEST_DELAY_MS}ms before next request`);
                await sleep(REQUEST_DELAY_MS);
            }

            if (allTransactions.length >= 50000) {
                console.log(`[Kaspa Adapter] Reached safety limit of 50000 transactions`);
                hasMore = false;
            }

        } catch (error: any) {
            console.error(`[Kaspa Adapter] Error fetching page at offset=${offset}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`[Kaspa Adapter] Pagination complete. Total transactions: ${allTransactions.length}`);
    return allTransactions;
}

/**
 * Main function to fetch Kaspa transactions
 */
export async function fetchKaspaTransactions(
    address: string,
    _config: { isTestnet?: boolean } = {}
): Promise<ParsedTransaction[]> {
    console.log('[Kaspa Adapter] Starting transaction fetch for:', address);

    if (!validateKaspaAddress(address)) {
        throw new Error(`Invalid Kaspa address format: ${address}`);
    }

    try {
        const transactions = await fetchAllTransactionsPaginated(address);
        console.log('[Kaspa Adapter] Parsing', transactions.length, 'transactions');

        if (transactions.length === 0) {
            return [];
        }

        const parsedTransactions = await Promise.all(
            transactions.map((tx, index) => parseKaspaTransaction(tx, address, index))
        );

        return parsedTransactions;

    } catch (error: any) {
        console.error('[Kaspa Adapter] Error:', error.message);
        throw new Error(`Kaspa API Error: ${error.message}`);
    }
}

/**
 * Fetch a single transaction by ID
 */
async function fetchTransaction(txId: string): Promise<any> {
    const url = `${KASPA_API_BASE}/transactions/${txId}`;
    const response = await fetchWithRetry(url);
    if (response.ok) {
        return response.json();
    }
    return null;
}

/**
 * Get total input amounts by tracing previous transactions
 * Fee = sum(inputs) - sum(outputs)
 */
async function getInputAmounts(inputs: any[]): Promise<bigint> {
    let totalInputAmount = BigInt(0);

    for (const input of inputs) {
        const prevTxId = input.previous_outpoint_hash || input.previousOutpointHash;
        if (prevTxId) {
            const prevTx = await fetchTransaction(prevTxId);
            if (prevTx && prevTx.outputs && prevTx.outputs.length > 0) {
                const outputIndex = input.previous_outpoint_index || input.previousOutpointIndex || 0;
                if (prevTx.outputs[outputIndex]) {
                    totalInputAmount += BigInt(prevTx.outputs[outputIndex].amount || prevTx.outputs[outputIndex].value || 0);
                }
            }
        }
        // Rate limit between API calls
        await sleep(REQUEST_DELAY_MS);
    }
    return totalInputAmount;
}

/**
 * Parse Kaspa transaction to ParsedTransaction format
 * 
 * UTXO Model Logic:
 * - User is RECEIVER if their address appears in outputs (script_public_key_address)
 * - User is SENDER if there are outputs going to OTHER addresses (funded by user)
 */
async function parseKaspaTransaction(tx: any, userAddress: string, index: number): Promise<ParsedTransaction> {
    const normalizedUserAddress = normalizeKaspaAddress(userAddress);

    // Extract fields from snake_case response
    const txId = tx.transaction_id || tx.transactionId || '';
    const blockTime = tx.block_time || tx.blockTime || tx.accepting_block_time || Date.now();
    const isAccepted = tx.is_accepted || tx.isAccepted || false;
    const subnetworkId = tx.subnetwork_id || tx.subnetworkId || '0';

    // Extract inputs and outputs
    const inputs = tx.inputs || [];
    const outputs = tx.outputs || [];

    // Calculate user's received value and outputs to others
    let totalReceived = BigInt(0);
    let userOutputCount = 0;
    let otherOutputValue = BigInt(0);

    for (const output of outputs) {
        const outputAddress = (output.script_public_key_address || output.scriptPublicKeyAddress || '').toLowerCase();
        const amount = BigInt(output.amount || output.value || 0);

        if (outputAddress === normalizedUserAddress) {
            totalReceived += amount;
            userOutputCount++;
        } else {
            otherOutputValue += amount;
        }
    }

    // Detect SEND vs RECEIVE
    // User RECEIVED if they have outputs
    // User SENT if there are outputs to OTHER addresses (they funded this tx)
    const isReceiver = userOutputCount > 0;
    const isSender = otherOutputValue > BigInt(0);

    // Calculate total output value
    let totalOutputValue = BigInt(0);
    for (const output of outputs) {
        totalOutputValue += BigInt(output.amount || output.value || 0);
    }

    // Determine net values
    let netSent: bigint;
    let netReceived: bigint;

    if (isSender && !isReceiver) {
        // Pure SEND - user sent to others, no outputs to self
        netSent = totalOutputValue;
        netReceived = BigInt(0);
    } else if (!isSender && isReceiver) {
        // Pure RECEIVE - only user received, no outputs to others
        netSent = BigInt(0);
        netReceived = totalReceived;
    } else if (isSender && isReceiver) {
        // Complex tx - sent to others AND received change back
        netSent = otherOutputValue;
        netReceived = totalReceived;
    } else {
        // Edge case - shouldn't happen
        netSent = BigInt(0);
        netReceived = BigInt(0);
    }

    // Calculate fee by tracing input amounts
    let feeSompi = '0';
    if (inputs.length > 0 && isSender) {
        try {
            const totalInputAmount = await getInputAmounts(inputs);
            const fee = totalInputAmount - totalOutputValue;
            if (fee > BigInt(0)) {
                feeSompi = fee.toString();
            }
        } catch (error: any) {
            console.log(`[Kaspa Adapter] Could not calculate fee for tx ${txId}: ${error.message}`);
        }
    }

    // Determine transaction type
    const txType = detectKaspaTxType(subnetworkId, tx.payload);

    // Determine action type and display amounts (single amount only)
    let actionType: ActionType;
    let displaySent: string;
    let displayReceived: string;

    if (txType === 'native_transfer') {
        if (isSender && !isReceiver) {
            // Pure SEND
            actionType = ActionType.SEND;
            displaySent = formatUnits(netSent.toString());
            displayReceived = '';
        } else if (!isSender && isReceiver) {
            // Pure RECEIVE
            actionType = ActionType.RECEIVE;
            displaySent = '';
            displayReceived = formatUnits(netReceived.toString());
        } else {
            // Send to others + change back to self → treat as SEND
            actionType = ActionType.SEND;
            displaySent = formatUnits(netSent.toString());
            displayReceived = '';
        }
    } else if (txType === 'contract_call') {
        actionType = ActionType.CONTRACT;
        displaySent = '';
        displayReceived = '';
    } else {
        actionType = isSender ? ActionType.SEND : ActionType.RECEIVE;
        if (actionType === ActionType.SEND) {
            displaySent = formatUnits(netSent.toString());
            displayReceived = '';
        } else {
            displaySent = '';
            displayReceived = formatUnits(netReceived.toString());
        }
    }

    // Build notes
    const notes = buildKaspaNotes(isSender, isReceiver, txType, netSent, netReceived);

    // Explorer link
    const explorerBase = 'https://explorer.kaspa.org';

    return {
        id: `${txId}_${index}`,
        date: new Date(blockTime),
        receivedQuantity: displayReceived,
        receivedCurrency: displayReceived ? KASPA_SYMBOL : '',
        sentQuantity: displaySent,
        sentCurrency: displaySent ? KASPA_SYMBOL : '',
        feeAmount: feeSompi !== '0' ? formatUnits(feeSompi) : '',
        feeCurrency: feeSompi !== '0' ? KASPA_SYMBOL : '',
        hash: txId,
        notes: notes,
        status: isAccepted ? TransactionStatus.SUCCESS : TransactionStatus.PENDING,
        type: actionType,
        link: `${explorerBase}/tx/${txId}`,
        tag: mapToAwakenLabel(txType, txType === 'native_transfer', isSender)
    };
}

function detectKaspaTxType(subnetworkId: string, payload: any): string {
    if (subnetworkId && subnetworkId !== '0' && subnetworkId !== '0000000000000000000000000000000000000000') {
        return 'contract_call';
    }

    if (payload) {
        return 'data_attachment';
    }

    return 'native_transfer';
}

function buildKaspaNotes(isSender: boolean, isReceiver: boolean, txType: string, netSent: bigint, netReceived: bigint): string {
    const sentStr = netSent > BigInt(0) ? formatUnits(netSent.toString()) : '';
    const receivedStr = netReceived > BigInt(0) ? formatUnits(netReceived.toString()) : '';

    if (txType === 'native_transfer') {
        if (isSender && !isReceiver) {
            return `Sent ${sentStr} KAS`;
        } else if (!isSender && isReceiver) {
            return `Received ${receivedStr} KAS`;
        } else if (isSender && isReceiver) {
            // Complex: sent to others + received change back - show as SEND only
            return `Sent ${sentStr} KAS`;
        }
    }

    const typeLabels: Record<string, string> = {
        'contract_call': 'Kaspa Contract Interaction',
        'data_attachment': 'KAS with Data',
        'native_transfer': 'KAS Transfer',
    };

    return typeLabels[txType] || `Kaspa ${txType}`;
}

/**
 * Utility: Get UTXOs for an address
 */
export async function fetchKaspaUtxos(address: string): Promise<any[]> {
    if (!validateKaspaAddress(address)) {
        return [];
    }

    try {
        const url = `${KASPA_API_BASE}/addresses/${address}/utxos`;
        const response = await fetch(url);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];

    } catch (error: any) {
        console.error('[Kaspa Adapter] UTXO fetch error:', error.message);
        return [];
    }
}
