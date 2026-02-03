# Awaken Connect

A multi-chain transaction tracker and tax label mapper for blockchain transactions. This application fetches transactions from various blockchain networks, categorizes them using Awaken-compatible labels, and exports them to CSV format.

## Features

- **Multi-chain Support**: Track transactions on Creditcoin, Celo, Fuel, and Humanity Protocol networks
- **Automatic Transaction Categorization**: Maps blockchain transactions to Awaken tax labels where possible
- **CSV Export**: Export transactions to CSV format compatible with Awaken
- **Real-time Transaction Fetching**: Fetch transactions directly from blockchain explorers
- **Token Transfer Detection**: Automatically detects and labels token transfers (ERC-20, etc.)
- **Transaction Filtering**: Filter transactions by network, date range, and transaction type

## Supported Networks

| Network | API | Explorer |
|---------|-----|----------|
| **Creditcoin** | Blockscout API | https://creditcoin.blockscout.com/api |
| **Celo** | Celo Explorer API | https://explorer.celo.org/api |
| **Celo Testnet** | Alfajores Explorer API | https://alfajores.explorer.celo.org/api |
| **Fuel** | Fuel GraphQL API | https://mainnet.fuel.network/v1/graphql |
| **Fuel Testnet** | Fuel GraphQL API | https://testnet.fuel.network/v1/graphql |
| **Humanity Protocol** | Alchemy Explorer API | https://humanity-mainnet.explorer.alchemy.com/api |

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
│   │   ├── celo.ts       # Celo network adapter (mainnet + testnet)
│   │   ├── creditcoin.ts # Creditcoin network adapter
│   │   ├── fuel.ts       # Fuel network adapter (mainnet + testnet)
│   │   └── humanity.ts   # Humanity Protocol adapter
│   ├── components/        # React components
│   │   ├── AddressInput.tsx     # Address input with validation
│   │   ├── FilterPanel.tsx      # Transaction filtering controls
│   │   ├── Footer.tsx           # Application footer
│   │   ├── NetworkSelector.tsx  # Network selection dropdown
│   │   ├── SearchBar.tsx        # Search functionality
│   │   ├── SkeletonTable.tsx    # Loading skeleton
│   │   ├── TransactionTable.tsx # Main transaction display
│   │   └── ui/                  # Reusable UI components
│   ├── utils/
│   │   ├── awakenLabels.ts   # Label mapping logic
│   │   ├── csv.ts            # CSV export functionality
│   │   ├── parser.ts         # Transaction parsing utilities
│   │   └── utils.ts          # Utility functions
│   ├── App.tsx            # Main application
│   ├── main.tsx           # Entry point
│   └── style.css          # Global styles
├── package.json
├── tsconfig.json
├── vite.config.js
└── tailwind.config.js
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Blockscout API** - Creditcoin blockchain data
- **GraphQL** - Fuel network data
- **Alchemy Explorer** - Humanity Protocol data

## API Endpoints

### Creditcoin
- Base URL: `https://creditcoin.blockscout.com/api`
- Module: `account`
- Action: `txlist`

### Celo
- Mainnet: `https://explorer.celo.org/api`
- Testnet: `https://alfajores.explorer.celo.org/api`
- Supports both `txlist` (native transactions) and `tokentx` (token transfers)

### Fuel
- Mainnet: `https://mainnet.fuel.network/v1/graphql`
- Testnet: `https://testnet.fuel.network/v1/graphql`
- GraphQL API for transaction queries

### Humanity Protocol
- Base URL: `https://humanity-mainnet.explorer.alchemy.com/api`
- Module: `account`
- Action: `txlist`

## License

MIT License - see LICENSE file for details.
