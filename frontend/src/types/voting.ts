import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export interface PollAccount {
  pollId: anchor.BN;
  creator: PublicKey;
  title: string;
  description: string;
  options: string[];
  votes: anchor.BN[];
  startTime: anchor.BN;
  endTime: anchor.BN;
  isActive: boolean;
  totalVotes: anchor.BN;
  bump: number;
}

export interface VoteRecordAccount {
  voter: PublicKey;
  pollId: anchor.BN;
  optionIndex: number;
  timestamp: anchor.BN;
  bump: number;
}

export interface PollCounterAccount {
  count: anchor.BN;
  bump: number;
}

export interface PollWithKey {
  publicKey: string;
  account: PollAccount;
}

export enum PollStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CLOSED = 'closed',
}

export interface VoteOption {
  text: string;
  votes: number;
  percentage: number;
}

export interface PollStats {
  totalVotes: number;
  leadingOption: number | null;
  timeRemaining: number | null;
  status: PollStatus;
}