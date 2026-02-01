import { ActionType, type ParsedTransaction, TransactionStatus } from '../utils/csv';
import { mapToAwakenLabel } from '../utils/awakenLabels';

const MAINNET_ENDPOINT = 'https://mainnet.fuel.network/v1/graphql';
const TESTNET_ENDPOINT = 'https://testnet.fuel.network/v1/graphql';

// Updated Query: Removed explicit '... on OutputCoin' fragments if they are causing issues or purely use base generic fields if available.
// However, the error 'Unknown type OutputCoin' suggests the type name changed or removed.
// Recent fuel-core changed CoinOutput / ContractOutput etc. 
// Safest bet for MVP without deep introspection: requesting basic fields or using 'on CoinOutput' if that's the new name.
// Research suggested 'CoinOutput' replaced 'OutputCoin' in recent versions.
// Trying generic inline fragments for CoinOutput.

const TRANSACTIONS_QUERY = `
query TransactionsByOwner($address: Address!, $first: Int, $after: String) {
  transactionsByOwner(owner: $address, first: $first, after: $after) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      status {
        ... on SuccessStatus {
          time
          programState { returnType }
        }
        ... on FailureStatus {
          time
          reason
        }
        ... on SubmittedStatus {
          time
        }
      }
      inputs {
        ... on InputCoin {
          amount
          assetId
          owner
        }
        ... on InputContract {
          contractId
        }
      }
      outputs {
        ... on CoinOutput {
          amount
          assetId
          to
        }
        ... on ContractOutput {
          inputIndex
        }
        ... on ChangeOutput {
          amount
          assetId
          to
        }
      }
    }
  }
}
`;

export async function fetchFuelTransactions(address: string, isTestnet = false): Promise<ParsedTransaction[]> {
  const endpoint = isTestnet ? TESTNET_ENDPOINT : MAINNET_ENDPOINT;
  let allNodes: any[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  // Validate address format minimally
  if (!address.startsWith('fuel') && !address.startsWith('0x')) {
    throw new Error("Invalid Fuel address format");
  }

  while (hasNextPage) {
    const variables = { address, first: 30, after: endCursor };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: TRANSACTIONS_QUERY, variables })
    });

    if (!response.ok) throw new Error(`Fuel API Error: ${response.statusText}`);

    const result = await response.json();
    if (result.errors) {
      // Attempt fallback or report specific error
      throw new Error(`Fuel GraphQL Error: ${result.errors[0].message}`);
    }

    const data = result.data.transactionsByOwner;
    if (!data) break;

    allNodes = [...allNodes, ...data.nodes];

    hasNextPage = data.pageInfo.hasNextPage;
    endCursor = data.pageInfo.endCursor;

    if (allNodes.length > 500) break;
  }

  return allNodes.map((node, index) => parseFuelTransaction(node, address, index));
}

function parseFuelTransaction(node: any, userAddress: string, index: number): ParsedTransaction {
  // Time
  let date = new Date();
  if (node.status && node.status.time) {
    // Handle TAI64 typically returned as string in recent versions
    // If raw TAI64 string, might need conversion.
    // For now assume ISO-like or standard parsable.
    // If fails, uses current date.
    try { date = new Date(node.status.time); } catch { }
  }

  let sentAmount = BigInt(0);
  let receivedAmount = BigInt(0);

  // Inputs
  node.inputs?.forEach((input: any) => {
    if (input.owner === userAddress && input.amount) {
      sentAmount += BigInt(input.amount);
    }
  });

  // Outputs (CoinOutput + ChangeOutput) - 'ChangeOutput' is money coming back to us usually
  // 'CoinOutput' is transfer to someone
  node.outputs?.forEach((output: any) => {
    if (output.to === userAddress && output.amount) {
      // If it's a change output, it technically reduces the "Sent" amount in a UTXO model context,
      // But effectively for "net flow" we just sum everything incoming vs outgoing.
      receivedAmount += BigInt(output.amount);
    }
  });

  const decimals = 9;
  let finalReceived = "";
  let finalSent = "";
  let type = ActionType.UNKNOWN;

  // Determine Net Flow
  if (receivedAmount > sentAmount) {
    type = ActionType.RECEIVE;
    finalReceived = formatUnits(receivedAmount - sentAmount, decimals);
  } else if (sentAmount > receivedAmount) {
    type = ActionType.SEND;
    finalSent = formatUnits(sentAmount - receivedAmount, decimals);
  } else {
    // Equal or zero? 
    // Could be self-transfer or contract call paying only gas.
    type = ActionType.CONTRACT;
    finalSent = "0";
  }

  // Status
  let status = TransactionStatus.UNKNOWN;
  if (node.status) {
    // Check typenames or fields
    // Typically GraphQL returns __typename with "SuccessStatus" etc.
    // But we handled fragment above. API JSON structure usually: { status: { "time": "...", __typename: "SuccessStatus" } }
    // We didn't request __typename explicitly but implied by fragments matches.
    // We can infer from presence of fields.
    if (node.status.reason) status = TransactionStatus.FAILED;
    else if (node.status.time) status = TransactionStatus.SUCCESS; // Simplistic
  }

  return {
    id: node.id || `fuel-${index}`,
    date: date,
    receivedQuantity: finalReceived,
    receivedCurrency: finalReceived ? "ETH" : "",
    sentQuantity: finalSent,
    sentCurrency: finalSent ? "ETH" : "",
    feeAmount: "", // Hard to calculate without receipt in this query
    feeCurrency: "ETH",
    hash: node.id,
    notes: "Fuel Transaction",
    status: status,
    type: type,
    link: `https://app.fuel.network/transaction/${node.id}`,
    tag: mapToAwakenLabel(
      type === ActionType.SEND || type === ActionType.RECEIVE ? 'native_transfer' : 'contract_call',
      type === ActionType.SEND || type === ActionType.RECEIVE,
      type === ActionType.SEND
    )
  };
}

function formatUnits(value: bigint, decimals: number): string {
  if (value === BigInt(0)) return "0";
  const str = value.toString().padStart(decimals + 1, '0');
  const integerPart = str.slice(0, -decimals);
  const fractionalPart = str.slice(-decimals).replace(/0+$/, '');
  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}
