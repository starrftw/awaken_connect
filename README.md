# Awaken Connect

A multi-chain transaction tracker and tax label mapper for blockchain transactions. This application fetches transactions from various blockchain networks, categorizes them using Awaken-compatible labels, and exports them to CSV format.

## Features

- **Multi-chain Support**: Track transactions on Creditcoin and Humanity Protocol networks
- **Automatic Transaction Categorization**: Maps blockchain transactions to Awaken tax labels where possible
- **CSV Export**: Export transactions to CSV format compatible with Awaken
- **Real-time Transaction Fetching**: Fetch transactions directly from blockchain explorers

## Supported Networks

- **Creditcoin** - Blockscout API (`https://creditcoin.blockscout.com/api`)
- **Humanity Protocol** - Alchemy Explorer API (`https://humanity-mainnet.explorer.alchemy.com/api`)

## Awaken Compatibility

Transactions are tagged with Awaken-compatible labels (snake_case format) where the transaction type can be clearly identified. The labeling follows a conservative approach:

- **Native token transfers** (sending) → `payment`
- **Native token transfers** (receiving) → `receive`
- **DEX swap operations** → `swap`
- **Add liquidity** → `add_liquidity`
- **Remove liquidity** → `remove_liquidity`

All other transaction types return an empty label, as they cannot be reliably categorized without protocol-specific context (e.g., staking vs lending, claim rewards, etc.).

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```
awaken_connect/
├── src/
│   ├── adapters/          # Network-specific API adapters
│   │   ├── creditcoin.ts  # Creditcoin network adapter
│   │   ├── humanity.ts    # Humanity Protocol adapter
│   │   └── fuel.ts        # Fuel network adapter
│   ├── components/        # React components
│   ├── utils/
│   │   ├── awakenLabels.ts # Label mapping logic
│   │   ├── csv.ts          # CSV export functionality
│   │   └── parser.ts       # Transaction parsing utilities
│   ├── App.tsx            # Main application
│   └── main.tsx           # Entry point
├── package.json
└── tsconfig.json
```

## API Endpoints

### Creditcoin
- Base URL: `https://creditcoin.blockscout.com/api`
- Module: `account`
- Action: `txlist`

### Humanity Protocol
- Base URL: `https://humanity-mainnet.explorer.alchemy.com/api`
- Module: `account`
- Action: `txlist`

## License

MIT License - see LICENSE file for details.
