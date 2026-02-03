import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

// Humanity Protocol uses Alchemy's explorer API
const API_ENDPOINT = 'https://humanity-mainnet.explorer.alchemy.com/api';

export async function fetchHumanityTransactions(address: string): Promise<ParsedTransaction[]> {
    const url = `${API_ENDPOINT}?module=account&action=txlist&address=${address}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Humanity Protocol API Error: ${response.statusText}`);

    const json = await response.json();

    if (json.status === "0" && json.message !== "No transactions found") {
        throw new Error(`Humanity Protocol Explorer Error: ${json.message}`);
    }

    const transactions = json.result || [];
    return transactions.map((tx: any, index: number) => parseHumanityTransaction(tx, address, index));
}

function parseHumanityTransaction(tx: any, userAddress: string, index: number): ParsedTransaction {
    const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();
    const decimals = 18; // Humanity Protocol native token is 18 decimals

    let valueStr = formatUnits(tx.value, decimals);

    const fee = formatUnits((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(), decimals);

    // Status
    let status = TransactionStatus.UNKNOWN;
    if (tx.txreceipt_status === '1') status = TransactionStatus.SUCCESS;
    else if (tx.txreceipt_status === '0') status = TransactionStatus.FAILED;

    // Detect transaction type based on input data and method
    const txType = detectTransactionType(tx);

    // Determine action type
    let actionType = isSender ? ActionType.SEND : ActionType.RECEIVE;
    if (txType.toLowerCase().includes('swap') || txType === 'exactInputSingle' || txType === 'exactOutputSingle') {
        actionType = ActionType.SWAP;
    } else if (txType !== 'native_transfer' && txType !== 'token_transfer') {
        actionType = ActionType.CONTRACT;
    }

    return {
        id: `${tx.hash}_${index}`,
        date: new Date(parseInt(tx.timeStamp) * 1000),
        receivedQuantity: isSender ? "" : valueStr,
        receivedCurrency: isSender ? "" : "HMT",
        sentQuantity: isSender ? valueStr : "",
        sentCurrency: isSender ? "HMT" : "",
        feeAmount: isSender ? fee : "",
        feeCurrency: isSender ? "HMT" : "",
        hash: tx.hash,
        notes: buildNotes(tx, isSender, txType),
        status: status,
        type: actionType,
        link: `https://humanity-mainnet.explorer.alchemy.com/tx/${tx.hash}`,
        tag: mapToAwakenLabel(txType, txType === 'native_transfer', isSender)
    };
}

// Detect transaction type based on input data and contract interactions
function detectTransactionType(tx: any): string {
    const input = tx.input || '0x';
    const methodId = input.slice(0, 10).toLowerCase();

    // Common method signatures
    const methodSignatures: Record<string, string> = {
        '0xa9059cbb': 'token_transfer',
        '0x23b872dd': 'token_transferFrom',
        '0x095ea7b3': 'token_approve',
        '0xd0e30db0': 'deposit',
        '0x2e1a7d4d': 'withdraw',
        '0x414bf389': 'exactInputSingle', // Uniswap V3 swap
        '0xac9650d8': 'multicall',
        '0x88316456': 'exactInput',
        '0xc04b8d59': 'exactOutputSingle',
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
        'deposit': 'Deposit',
        'withdraw': 'Withdraw',
        'exactInputSingle': 'Swap (Exact Input)',
        'exactOutputSingle': 'Swap (Exact Output)',
        'exactInput': 'Swap',
        'multicall': 'Multicall',
        'transfer_substrate': 'Transfer Substrate',
        'claim': 'Claim',
        'mint': 'Mint',
        'claim_rewards': 'Claim Rewards',
        'stake': 'Stake',
        'contract_creation': 'Contract Creation',
        'contract_call': 'Contract Interaction',
        'native_transfer': isSender ? 'Sent HMT' : 'Received HMT'
    };

    return typeLabels[txType] || (isSender ? 'Sent HMT' : 'Received HMT');
}

function formatUnits(value: string, decimals: number): string {
    if (!value || value === "0") return "0";
    if (value.startsWith('-')) return "0";

    const val = BigInt(value);
    if (val === BigInt(0)) return "0";

    const str = val.toString().padStart(decimals + 1, '0');
    const integerPart = str.slice(0, -decimals);
    const fractionalPart = str.slice(-decimals).replace(/0+$/, '');

    return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}
