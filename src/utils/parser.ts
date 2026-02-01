export interface ParsedTransaction {
    date: Date;
    receivedQuantity?: string;
    receivedCurrency?: string;
    sentQuantity?: string;
    sentCurrency?: string;
    feeAmount?: string;
    feeCurrency?: string;
    hash: string;
    notes: string;
}

export const TransactionType = {
    SEND: 'SEND',
    RECEIVE: 'RECEIVE',
    UNKNOWN: 'UNKNOWN'
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
