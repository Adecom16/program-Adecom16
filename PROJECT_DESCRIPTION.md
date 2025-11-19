# Decentralized Voting dApp

**Deployed Frontend URL:** http://localhost:5173 (Local Development)

**Solana Program ID:** `GwLxstntnDEmYcqP7suzhp6Ui2HK3S4ctHTtqvo8mTef`

## Project Overview

### Description
This is a fully decentralized voting application built on Solana that enables users to create polls, cast votes, and view real-time results in a transparent and tamper-proof manner. The dApp leverages Solana's high-speed blockchain to provide instant voting confirmation and uses Program Derived Addresses (PDAs) to ensure data integrity and prevent double voting.

The application consists of a Solana smart contract (program) written in Rust using the Anchor framework, and a React-based frontend that interacts with the blockchain through wallet adapters. All voting data is stored on-chain, making it publicly verifiable and immutable.

### Key Features

- **Create Polls:** Users can create custom polls with multiple options (2-10 choices), set start/end times, and add descriptions
- **Cast Votes:** Wallet-connected users can vote on active polls with one vote per wallet address enforced on-chain
- **Real-time Results:** View live vote counts and percentages as votes are cast
- **Poll Management:** Poll creators can close their polls early if needed
- **Time-based Validation:** Polls automatically enforce start and end times, preventing votes outside the valid period
- **Double-vote Prevention:** Smart contract enforces one vote per wallet per poll using PDAs
- **Transparent & Immutable:** All votes are recorded on Solana blockchain and cannot be altered

### How to Use the dApp

1. **Connect Wallet**
   - Click "Select Wallet" button in the top right
   - Choose your Solana wallet (Phantom, Solflare, etc.)
   - Approve the connection request
   - Ensure you're connected to Devnet

2. **Create a Poll**
   - Fill in the poll title (max 100 characters)
   - Add a description (max 500 characters)
   - Enter at least 2 options (max 10 options, 50 characters each)
   - Set the duration in days (1-365 days)
   - Click "Create Poll" and approve the transaction
   - Wait for confirmation (~400ms on Solana)

3. **Vote on a Poll**
   - Browse available polls in the poll list
   - Click on a poll to view details
   - Select your preferred option
   - Click "Vote" and approve the transaction
   - Your vote is recorded on-chain immediately

4. **Close a Poll (Creator Only)**
   - Navigate to a poll you created
   - Click "Close Poll" button
   - Approve the transaction to deactivate the poll

## Program Architecture

The Solana program is built using Anchor framework and implements a decentralized voting system with three main instructions: `initialize_poll`, `vote`, and `close_poll`. The program uses PDAs to derive deterministic addresses for polls and vote records, ensuring data integrity and preventing duplicate votes.

### PDA Usage

The program implements two types of PDAs to manage state and enforce voting rules:

**PDAs Used:**

- **Poll PDA:** Derived using seeds `["poll", poll_id]`
  - Purpose: Stores poll data including title, description, options, votes, and metadata
  - Ensures each poll has a unique, deterministic address based on its ID
  - Allows efficient lookup and prevents address collisions

- **Vote Record PDA:** Derived using seeds `["vote_record", poll_pubkey, voter_pubkey]`
  - Purpose: Records individual votes to prevent double voting
  - Creates a unique record for each voter-poll combination
  - Attempting to vote twice will fail as the PDA already exists

### Program Instructions

**Instructions Implemented:**

- **initialize_poll:** Creates a new poll with specified parameters
  - Validates title, description, and options lengths
  - Ensures at least 2 options and maximum 10 options
  - Validates time range (start < end, end > current time)
  - Initializes vote counters to zero
  - Stores creator's public key for authorization

- **vote:** Records a vote for a specific poll option
  - Validates poll is active and within time window
  - Checks option index is valid
  - Creates vote record PDA (fails if already voted)
  - Increments vote count for selected option
  - Records timestamp and voter information

- **close_poll:** Deactivates a poll (creator only)
  - Validates caller is the poll creator
  - Sets poll status to inactive
  - Prevents further votes on the poll

### Account Structure

```rust
#[account]
pub struct Poll {
    pub poll_id: u64,              // Unique identifier for the poll
    pub creator: Pubkey,           // Public key of poll creator
    pub title: String,             // Poll title (max 100 chars)
    pub description: String,       // Poll description (max 500 chars)
    pub options: Vec<String>,      // Vote options (2-10 options, max 50 chars each)
    pub votes: Vec<u64>,           // Vote counts for each option
    pub start_time: i64,           // Unix timestamp when voting starts
    pub end_time: i64,             // Unix timestamp when voting ends
    pub is_active: bool,           // Whether poll is currently active
    pub total_votes: u64,          // Total number of votes cast
    pub bump: u8,                  // PDA bump seed
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,             // Public key of the voter
    pub poll_id: u64,              // ID of the poll voted on
    pub option_index: u8,          // Index of selected option
    pub timestamp: i64,            // Unix timestamp of vote
    pub bump: u8,                  // PDA bump seed
}
```

## Testing

### Test Coverage

The program includes comprehensive tests covering both successful operations and error scenarios to ensure robustness and security.

**Happy Path Tests:**
- Create poll with valid parameters
- Vote on an active poll within time window
- Close poll as creator
- Multiple users voting on same poll
- View poll results and vote counts

**Unhappy Path Tests:**
- Attempt to create poll with title too long (>100 chars)
- Attempt to create poll with description too long (>500 chars)
- Attempt to create poll with only 1 option (minimum is 2)
- Attempt to create poll with more than 10 options
- Attempt to vote on inactive poll
- Attempt to vote before poll start time
- Attempt to vote after poll end time
- Attempt to vote twice on same poll (double voting prevention)
- Attempt to vote with invalid option index
- Attempt to close poll as non-creator (unauthorized)

### Running Tests

```bash
# Navigate to the Anchor project directory
cd anchor_project/voting-dapp

# Run all tests
anchor test

# Run tests with detailed logs
anchor test -- --nocapture
```

### Additional Notes for Evaluators

- The program is deployed on Solana Devnet at address `GwLxstntnDEmYcqP7suzhp6Ui2HK3S4ctHTtqvo8mTef`
- Frontend uses React with TypeScript and Solana wallet adapters for seamless wallet integration
- All validation is performed on-chain to ensure security and prevent manipulation
- The program uses Anchor 0.32.1 and is compatible with Solana CLI 3.0.10
- Poll IDs are generated using timestamps to ensure uniqueness
- The frontend includes error handling and user-friendly feedback for all operations
- Vote records are permanent and cannot be deleted, ensuring vote integrity
- The program implements proper space allocation for dynamic data (strings and vectors)
- All monetary transactions (poll creation, voting) require SOL for rent and transaction fees
