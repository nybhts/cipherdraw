# CipherDraw - FHE-Powered Prize Draw Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-orange.svg)
![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-purple.svg)
![Network](https://img.shields.io/badge/Network-Sepolia-yellow.svg)

A decentralized prize draw platform powered by Fully Homomorphic Encryption (FHE) using Zama's fhEVM 0.9.1. Users pick 3 encrypted numbers (1-9), all entries go into a shared prize pool, and one winner takes all through provably fair on-chain randomness.

## Key Features

### Privacy-First Design
- **Fully Encrypted Numbers**: Your 3-digit combination is encrypted using FHE
- **Zero Knowledge Until Reveal**: Numbers remain encrypted on-chain until the winner is drawn
- **No Trusted Oracle Required**: Self-relaying decryption ensures trustless reveals

### Fair & Transparent
- **On-Chain Randomness**: Winner selection using blockhash for verifiable fairness
- **Shared Prize Pool**: All entry fees accumulate in a single pool per round
- **Winner Takes All**: Single winner receives the entire prize pool
- **Multiple Rounds**: Admin can create rounds with different entry fees and durations

### Technical Excellence
- **Gas Optimized**: Efficient storage and computation patterns
- **Battle Tested**: 41+ unit tests covering core functionality
- **Modern Stack**: React 18, Vite 6, Wagmi 2, RainbowKit 2
- **Type Safe**: Full TypeScript support in frontend

---

## How It Works

### User Journey

```
1. Pick Numbers → 2. Encrypt → 3. Submit Entry → 4. Wait → 5. Winner Drawn → 6. Claim Prize
   [1-9, 1-9, 1-9]    [FHE]      [Pay Fee]      [Until End]   [Random]      [Prize Pool]
```

### Round Lifecycle

```
┌─────────────┐
│   ACTIVE    │ ← Round created, accepting encrypted entries
│             │   Users can submit & update encrypted numbers
└──────┬──────┘
       │ (Time expires)
       ↓
┌─────────────┐
│   DRAWING   │ ← Round ended, selecting winner
│             │   On-chain randomness determines winner
└──────┬──────┘
       │ (Winner selected)
       ↓
┌─────────────┐
│  REVEALING  │ ← Winner's numbers marked for decryption
│             │   FHE decryption process initiated
└──────┬──────┘
       │ (Numbers decrypted)
       ↓
┌─────────────┐
│   SETTLED   │ ← Winner revealed, prize claimable
│             │   Winner can claim full prize pool
└─────────────┘

Alternative:
┌─────────────┐
│   ACTIVE    │
└──────┬──────┘
       │ (Admin cancels)
       ↓
┌─────────────┐
│  CANCELLED  │ ← Refunds available for all participants
└─────────────┘
```

---

## Quick Start

### Prerequisites

```bash
# Node.js 18+
node -v  # Should be ≥ 18.0.0

# npm 9+
npm -v   # Should be ≥ 9.0.0
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/CipherDraw.git
cd CipherDraw

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Environment Setup

Create `.env` file in project root:

```bash
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Private key for deployment (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Contract address (after deployment)
CIPHER_DRAW_ADDRESS=0x...
```

### Local Development

```bash
# Terminal 1: Compile contracts
npx hardhat compile

# Terminal 2: Run tests
npx hardhat test

# Terminal 3: Start frontend
cd frontend && npm run dev
```

Frontend will be available at `http://localhost:5173/`

---

## Deployment Guide

### Step 1: Deploy Contract

```bash
# Compile contract
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
PRIVATE_KEY="your_private_key" \
npx hardhat compile

# Deploy to Sepolia
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
PRIVATE_KEY="your_private_key" \
npx hardhat run scripts/deploy.js --network sepolia
```

### Step 2: Update Frontend Configuration

Edit `frontend/src/lib/contracts.ts`:

```typescript
export const CIPHER_DRAW_ADDRESS = "0x..." as const;
```

### Step 3: Seed Test Rounds

```bash
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" \
PRIVATE_KEY="your_private_key" \
CIPHER_DRAW_ADDRESS="0x..." \
npx hardhat run scripts/seed-rounds.js --network sepolia
```

### Step 4: Build & Deploy Frontend

```bash
# Build production frontend
cd frontend
npm run build

# Deploy to Vercel (or your preferred host)
vercel --prod
```

---

## Smart Contract Architecture

### Core Components

```
CipherDraw
├── State Management
│   ├── rounds (mapping: uint256 => Round)
│   ├── entries (mapping: roundId => address => Entry)
│   ├── roundIds (uint256[])
│   └── roundCount (uint256)
│
├── Access Control
│   └── admin (address)
│
├── Round Struct
│   ├── id, name, exists
│   ├── entryFee, endTime, prizePool
│   ├── status (RoundStatus enum)
│   ├── participantCount, participants[]
│   ├── winner, winningNumber1-3
│   └── numbersRevealed (bool)
│
└── Entry Struct
    ├── exists, claimed
    ├── number1-3 (euint8 - encrypted!)
    └── entryTime
```

### Contract Constants

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `MIN_ENTRY_FEE` | 0.001 ETH | Minimum entry fee |
| `MAX_ENTRY_FEE` | 1 ETH | Maximum entry fee |
| `MIN_DURATION` | 1 hour | Minimum round duration |
| `MAX_DURATION` | 7 days | Maximum round duration |
| `MIN_NUMBER` | 1 | Minimum number |
| `MAX_NUMBER` | 9 | Maximum number |

### Round Status States

```solidity
enum RoundStatus {
    Active,     // 0: Accepting entries
    Drawing,    // 1: Waiting for winner draw
    Revealing,  // 2: Waiting for decryption
    Settled,    // 3: Winner claimed
    Cancelled   // 4: Round cancelled
}
```

---

## FHE Implementation

### Encryption Architecture

CipherDraw uses **euint8** ciphertexts for numbers, providing:
- 8-bit unsigned integers (range 0-255, constrained to 1-9)
- Compact ciphertext size (~2KB per number)
- Fast encryption/decryption (~100ms client-side)
- Homomorphic operations support (comparison, selection)

### FHE Operations Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                           │
├──────────────────────────────────────────────────────────────┤
│ 1. User Input: [5, 3, 9]                                    │
│ 2. FHE Encrypt: euint8(5), euint8(3), euint8(9)            │
│ 3. Generate Proof: ZK proof of correct encryption          │
│ 4. Package: { encNum1, encNum2, encNum3, proof }           │
└───────────────────┬──────────────────────────────────────────┘
                    │ Submit Transaction
                    ↓
┌──────────────────────────────────────────────────────────────┐
│                       ON-CHAIN (EVM)                         │
├──────────────────────────────────────────────────────────────┤
│ 5. Verify Proof: FHE.fromExternal(enc, proof) → euint8     │
│ 6. Store Encrypted: entry.number1 = euint8(5)              │
│ 7. Set Permissions: FHE.allowThis(), FHE.allow()           │
│ 8. State Update: round.prizePool += fee                    │
└───────────────────┬──────────────────────────────────────────┘
                    │ Round Ends
                    ↓
┌──────────────────────────────────────────────────────────────┐
│                    DECRYPTION PHASE                          │
├──────────────────────────────────────────────────────────────┤
│ 9. Mark for Reveal: FHE.makePubliclyDecryptable()          │
│ 10. Self-Relay: Automatic decryption by fhEVM network      │
│ 11. Finalize: Store revealed numbers (5, 3, 9)             │
└──────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

```
┌─────────────────────────────────────┐
│         React 18.3.1                │ ← UI Framework
├─────────────────────────────────────┤
│         Vite 6.0.3                  │ ← Build Tool
├─────────────────────────────────────┤
│         TypeScript 5.6.3            │ ← Type Safety
├─────────────────────────────────────┤
│         Wagmi 2.14.6                │ ← React Hooks for Ethereum
├─────────────────────────────────────┤
│         RainbowKit 2.2.4            │ ← Wallet Connection
├─────────────────────────────────────┤
│         Viem 2.21.54                │ ← Ethereum Interface
├─────────────────────────────────────┤
│         fhevmjs 0.9.1               │ ← FHE Client Library
├─────────────────────────────────────┤
│         Tailwind CSS 3.4.16         │ ← Styling
└─────────────────────────────────────┘
```

### Component Structure

```
src/
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
├── index.css                 # Global styles & Tailwind
│
├── components/
│   ├── Header.tsx           # Navigation & wallet connect
│   ├── RoundCard.tsx        # Individual round display
│   ├── NumberPicker.tsx     # 3-number selection UI
│   └── MyTickets.tsx        # User's entries management
│
├── hooks/
│   ├── useLottery.ts        # Contract interaction hooks
│   └── useFhe.ts            # FHE encryption hooks
│
└── lib/
    ├── contracts.ts         # Contract ABI & address
    ├── wagmi.ts             # Wagmi configuration
    ├── fhe.ts               # FHE utilities
    └── txToast.tsx          # Transaction notifications
```

---

## Testing

### Test Coverage

```
CipherDraw Test Suite
├── Deployment (3 tests)
├── Admin Functions (3 tests)
├── Round Management (14 tests)
├── Entry Management (5 tests)
├── Winner Selection (3 tests)
├── Query Functions (4 tests)
└── Edge Cases & Optimization (9 tests)

Total: 41 tests passing ✓
```

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

---

## Project Structure

```
CipherDraw/
├── contracts/
│   └── CipherDraw.sol               # Main smart contract
│
├── scripts/
│   ├── deploy.js                    # Deployment script
│   └── seed-rounds.js               # Test data seeder
│
├── test/
│   └── CipherDraw.test.js           # Unit tests (41 tests)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   ├── index.css                # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigation header
│   │   │   ├── RoundCard.tsx        # Round display card
│   │   │   ├── NumberPicker.tsx     # Number selection UI
│   │   │   └── MyTickets.tsx        # User entries panel
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLottery.ts        # Contract hooks
│   │   │   └── useFhe.ts            # FHE encryption hooks
│   │   │
│   │   └── lib/
│   │       ├── contracts.ts         # ABI & address
│   │       ├── wagmi.ts             # Wagmi config
│   │       ├── fhe.ts               # FHE utilities
│   │       └── txToast.tsx          # Toast notifications
│   │
│   ├── public/                      # Static assets
│   ├── index.html                   # HTML template
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind config
│   ├── tsconfig.json                # TypeScript config
│   └── package.json                 # Frontend dependencies
│
├── hardhat.config.js                # Hardhat configuration
├── package.json                     # Contract dependencies
├── .env                             # Environment variables
├── deployment.json                  # Deployment info
└── README.md                        # This file
```

---

## Security Considerations

### Smart Contract Security

#### Access Control
- Admin-only functions protected by `onlyAdmin` modifier
- No upgrade mechanism (immutable)
- Admin can only cancel rounds (not modify winners)

#### Re-entrancy Protection
- State updated before external calls
- Uses `call` with explicit gas forwarding
- Prize claiming protected by `claimed` flag

#### Randomness
- Uses `blockhash(block.number - 1)` for winner selection
- Winner index: `randomSeed % participantCount`
- Winning numbers: `(randomSeed >> bits) % 9 + 1`

#### FHE Security
- Numbers encrypted client-side
- ACL prevents unauthorized decryption
- Self-relaying ensures trustless reveals
- No plaintext exposure until settlement

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- **Zama** - For fhEVM and FHE technology
- **Ethereum Foundation** - For Sepolia testnet
- **OpenZeppelin** - For security best practices
- **Hardhat** - For development environment
- **Wagmi/Viem** - For Web3 React hooks

---

**Built with Zama fhEVM 0.9.1**

*Privacy-preserving prize draw, powered by Fully Homomorphic Encryption*
