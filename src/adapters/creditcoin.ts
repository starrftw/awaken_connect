import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

const API_ENDPOINT = 'https://creditcoin.blockscout.com/api';

export async function fetchCreditcoinTransactions(address: string): Promise<ParsedTransaction[]> {
    const url = `${API_ENDPOINT}?module=account&action=txlist&address=${address}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Creditcoin API Error: ${response.statusText}`);

    const json = await response.json();

    if (json.status === "0" && json.message !== "No transactions found") {
        throw new Error(`Blockscout Error: ${json.message}`);
    }

    const transactions = json.result || [];
    // Blockscout returns oldest last usually, but we sort in UI.

    return transactions.map((tx: any) => parseCreditcoinTransaction(tx, address));
}

function parseCreditcoinTransaction(tx: any, userAddress: string): ParsedTransaction {
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
        id: tx.hash,
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
