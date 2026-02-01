export interface ParsedTransaction {
    id: string; // Unique ID for React keys
    date: Date;
    receivedQuantity?: string;
    receivedCurrency?: string;
    sentQuantity?: string;
    sentCurrency?: string;
    feeAmount?: string;
    feeCurrency?: string;
    hash: string;
    notes: string;
    status: TransactionStatus;
    type: ActionType;
    link: string;
    tag?: string; // Transaction type tag for Awaken CSV export
}

export enum TransactionStatus {
    SUCCESS = 'Success',
    FAILED = 'Failed',
    PENDING = 'Pending',
    UNKNOWN = 'Unknown'
}

export enum ActionType {
    SEND = 'send',
    RECEIVE = 'receive',
    SWAP = 'swap',
    CONTRACT = 'contract_interaction',
    UNKNOWN = 'unknown'
}

// Awaken standard CSV headers
const HEADERS = [
    "Date",
    "Received Quantity",
    "Received Currency",
    "Sent Quantity",
    "Sent Currency",
    "Fee Amount",
    "Fee Currency",
    "Notes",
    "Tag",
    "Transaction Hash"
];

export function downloadCSV(transactions: ParsedTransaction[], filename: string = "awaken_export.csv") {
    const csvContent = [
        HEADERS.join(","),
        ...transactions.map(tx => {
            // Format notes with link included
            const notesWithLink = `${tx.notes} | Link: ${tx.link}`;

            return [
                formatDate(tx.date),
                tx.receivedQuantity || "",
                tx.receivedCurrency || "",
                tx.sentQuantity || "",
                tx.sentCurrency || "",
                tx.feeAmount || "",
                tx.feeCurrency || "",
                `"${notesWithLink.replace(/"/g, '""')}"`,
                tx.tag || "",
                tx.hash
            ].join(",");
        })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    // @ts-ignore - IE hack if needed, or standard link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Format date as MM/DD/YYYY HH:MM:SS in UTC (Awaken standard)
function formatDate(dateInput: Date | string | number): string {
    const d = new Date(dateInput);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const month = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const year = d.getUTCFullYear();
    const hours = pad(d.getUTCHours());
    const minutes = pad(d.getUTCMinutes());
    const seconds = pad(d.getUTCSeconds());

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}
