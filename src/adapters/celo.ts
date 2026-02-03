import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

const CELO_MAINNET_API = 'https://explorer.celo.org/api';
const CELO_TESTNET_API = 'https://alfajores.explorer.celo.org/api';

// CORS proxy as fallback (used when direct access is blocked)
const CORS_PROXY = 'https://corsproxy.io/?';

// Celo stablecoin addresses
const CUSD_ADDRESS = '0x765de816845861e75d25f0df739d9e2430c2913e';
const CEUR_ADDRESS = '0xd8763cba276a3738e6df85e191d76a7714b68eb1';

export interface CeloConfig {
    isTestnet?: boolean;
}

async function fetchWithRetry(url: string, maxRetries: number = 2): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'cors'
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            lastError = error;
            console.log(`[Celo Adapter] Attempt ${attempt + 1} failed:`, error.message);

            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
            }
        }
    }

    throw lastError;
}

export async function fetchCeloTransactions(address: string, config: CeloConfig = {}): Promise<ParsedTransaction[]> {
    const apiEndpoint = config.isTestnet ? CELO_TESTNET_API : CELO_MAINNET_API;

    console.log('[Celo Adapter] Fetching transactions for:', address);

    // Fetch all pages for comprehensive transaction history
    const allTransactions = await fetchAllCeloPages(address, apiEndpoint, config.isTestnet);
    console.log('[Celo Adapter] Total transactions fetched:', allTransactions.length);

    return allTransactions.map((tx: any, index: number) => parseCeloTransaction(tx, address, index, config.isTestnet));
}

async function fetchAllCeloPages(address: string, apiEndpoint: string, isTestnet?: boolean): Promise<any[]> {
    const allTransactions: any[] = [];
    let page = 1;
    const offset = 1000;
    const proxyBase = CORS_PROXY;

    while (page <= 100) {
        const directUrl = `${apiEndpoint}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}`;
        const proxyUrl = `${proxyBase}${encodeURIComponent(directUrl)}`;

        try {
            const response = await fetchWithRetry(proxyUrl);
            if (!response.ok) break;
            const json = await response.json();

            if (json.status === "1" && Array.isArray(json.result) && json.result.length > 0) {
                allTransactions.push(...json.result);
                page++;
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }

    // Also fetch token transfers
    const tokenTransactions = await fetchCeloTokenTransfers(address, apiEndpoint, isTestnet);
    return [...allTransactions, ...tokenTransactions];
}

async function fetchCeloTokenTransfers(address: string, apiEndpoint: string, _isTestnet?: boolean): Promise<any[]> {
    const allTokenTxs: any[] = [];
    let page = 1;
    const offset = 1000;
    const proxyBase = CORS_PROXY;

    while (page <= 100) {
        const directUrl = `${apiEndpoint}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}`;
        const proxyUrl = `${proxyBase}${encodeURIComponent(directUrl)}`;

        try {
            const response = await fetchWithRetry(proxyUrl);
            if (!response.ok) break;
            const json = await response.json();

            if (json.status === "1" && Array.isArray(json.result) && json.result.length > 0) {
                const tokenTxsWithFlag = json.result.map((tx: any) => ({
                    ...tx,
                    isTokenTransfer: true
                }));
                allTokenTxs.push(...tokenTxsWithFlag);
                page++;
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }

    return allTokenTxs;
}

export function parseCeloTransaction(tx: any, userAddress: string, index: number, isTestnet?: boolean): ParsedTransaction {
    const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();
    const isTokenTransfer = tx.isTokenTransfer === true;
    const decimals = isTokenTransfer && tx.tokenDecimal ? parseInt(tx.tokenDecimal) : 18;
    const tokenSymbol = tx.tokenSymbol || 'TOKEN';
    const valueField = tx.value;
    let valueStr = formatUnits(valueField, decimals);

    const fee = !isTokenTransfer && tx.gasUsed && tx.gasPrice
        ? formatUnits((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), 18)
        : '';

    let status = TransactionStatus.UNKNOWN;
    if (tx.txreceipt_status === '1' || tx.isError === '0') {
        status = TransactionStatus.SUCCESS;
    } else if (tx.txreceipt_status === '0' || tx.isError === '1') {
        status = TransactionStatus.FAILED;
    } else {
        status = TransactionStatus.SUCCESS;
    }

    const txType = detectCeloTransactionType(tx);
    let actionType = isSender ? ActionType.SEND : ActionType.RECEIVE;
    if (txType === 'swap' || txType === 'exactInputSingle' || txType === 'exactInput') {
        actionType = ActionType.SWAP;
    } else if (txType !== 'native_transfer' && txType !== 'token_transfer') {
        actionType = ActionType.CONTRACT;
    }

    let currency = 'CELO';
    if (isTokenTransfer) {
        currency = normalizeTokenSymbol(tokenSymbol || 'TOKEN');
    } else if (txType === 'token_transfer') {
        currency = normalizeTokenSymbol(detectTokenSymbol(tx.contractAddress) || 'TOKEN');
    }

    const explorerUrl = isTestnet
        ? `https://alfajores.explorer.celo.org/tx/${tx.hash}`
        : `https://explorer.celo.org/tx/${tx.hash}`;

    return {
        id: `${tx.hash}_${index}`,
        date: new Date(parseInt(tx.timeStamp) * 1000),
        receivedQuantity: isSender ? "" : valueStr,
        receivedCurrency: isSender ? "" : currency,
        sentQuantity: isSender ? valueStr : "",
        sentCurrency: isSender ? currency : "",
        feeAmount: !isSender || !fee ? "" : fee,
        feeCurrency: !isSender || !fee ? "" : "CELO",
        hash: tx.hash,
        notes: buildCeloNotes(tx, isSender, txType, isTokenTransfer),
        status: status,
        type: actionType,
        link: explorerUrl,
        tag: mapToAwakenLabel(txType, txType === 'native_transfer', isSender)
    };
}

export function detectCeloTransactionType(tx: any): string {
    const input = tx.input || '0x';
    const methodId = input.slice(0, 10).toLowerCase();

    const methodSignatures: Record<string, string> = {
        '0xa9059cbb': 'token_transfer',
        '0x23b872dd': 'token_transferFrom',
        '0x095ea7b3': 'token_approve',
        '0x414bf389': 'exactInputSingle',
        '0x88316456': 'exactInput',
        '0xc04b8d59': 'exactOutputSingle',
        '0x09b81346': 'exactOutput',
        '0x5ae401dc': 'multicall',
        '0xf28c0498': 'swap',
        '0x00f55d9d': 'celo_transfer',
    };

    if (!tx.to || tx.to === '') return 'contract_creation';
    if (input && input !== '0x' && input.length > 2) {
        return methodSignatures[methodId] || 'contract_call';
    }
    return 'native_transfer';
}

export function validateCeloAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function detectTokenSymbol(contractAddress: string): string | null {
    const address = contractAddress?.toLowerCase();
    if (address === CUSD_ADDRESS.toLowerCase()) return 'cUSD';
    if (address === CEUR_ADDRESS.toLowerCase()) return 'cEUR';
    return null;
}

function normalizeTokenSymbol(symbol: string): string {
    if (symbol === 'cUSD' || symbol === 'cEUR') return symbol;
    return symbol.toUpperCase();
}

function buildCeloNotes(tx: any, isSender: boolean, txType: string, isTokenTransfer?: boolean): string {
    const typeLabels: Record<string, string> = {
        'token_transfer': 'Token Transfer',
        'token_transferFrom': 'Token Transfer From',
        'token_approve': 'Token Approval',
        'celo_transfer': 'CELO Transfer',
        'exactInputSingle': 'Swap (Exact Input Single)',
        'exactInput': 'Swap (Exact Input)',
        'swap': 'Swap',
        'contract_creation': 'Contract Creation',
        'contract_call': 'Contract Interaction',
        'native_transfer': isSender ? 'Sent CELO' : 'Received CELO'
    };

    if (isTokenTransfer && tx.tokenSymbol) {
        return isSender ? `Sent ${tx.tokenSymbol}` : `Received ${tx.tokenSymbol}`;
    }

    if (txType === 'token_transfer') {
        const tokenSymbol = detectTokenSymbol(tx.contractAddress);
        if (tokenSymbol) return isSender ? `Sent ${tokenSymbol}` : `Received ${tokenSymbol}`;
    }

    return typeLabels[txType] || (isSender ? 'Sent CELO' : 'Received CELO');
}

function formatUnits(value: string, decimals: number): string {
    if (!value || value === "0") return "0";
    const val = BigInt(value);
    const str = val.toString().padStart(decimals + 1, '0');
    const integerPart = str.slice(0, -decimals);
    const fractionalPart = str.slice(-decimals).replace(/0+$/, '');
    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}
