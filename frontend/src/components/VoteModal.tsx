import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { 
  getProgram, 
  getPollPDA, 
  getVoteRecordPDA, 
  PROGRAM_ID 
} from '../utils/anchor';
import { PollWithKey, PollAccount } from '../types/voting';

export const useVoting = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [polls, setPolls] = useState<PollWithKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all polls
  const loadPolls = useCallback(async () => {
    if (!wallet.publicKey) {
      setPolls([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const program = getProgram(wallet as any, connection);
      // @ts-ignore - Anchor program type
      const pollAccounts = await program.account.poll.all();

      const pollsData = pollAccounts.map((poll: any) => ({
        publicKey: poll.publicKey.toString(),
        account: poll.account as PollAccount,
      }));

      // Sort by poll ID (newest first)
      pollsData.sort((a: any, b: any) => {
        const aId = (a.account.pollId as anchor.BN).toNumber();
        const bId = (b.account.pollId as anchor.BN).toNumber();
        return bId - aId;
      });

      setPolls(pollsData);
    } catch (err: any) {
      console.error('Error loading polls:', err);
      setError(err.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey, connection]);

  // Create a new poll
  const createPoll = async (
    title: string,
    description: string,
    options: string[],
    durationDays: number
  ) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const program = getProgram(wallet as any, connection);
      const [counterPda] = getPollCounterPDA(PROGRAM_ID);

      // Generate poll ID using timestamp
      const pollId = Date.now();

      const [pollPda] = getPollPDA(pollId, PROGRAM_ID);

      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now);
      const endTime = new anchor.BN(now + durationDays * 24 * 60 * 60);

      const tx = await program.methods
        .initializePoll(title, description, options, startTime, endTime)
        .accounts({
          poll: pollPda,
          pollCounter: counterPda,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, 'confirmed');
      await loadPolls();

      return { success: true, signature: tx };
    } catch (err: any) {
      console.error('Error creating poll:', err);
      throw new Error(err.message || 'Failed to create poll');
    }
  };

  // Vote on a poll
  const vote = async (pollPubkey: string, pollId: number, optionIndex: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const program = getProgram(wallet as any, connection);
      const pollPubkeyObj = new PublicKey(pollPubkey);

      const [voteRecordPda] = getVoteRecordPDA(
        pollPubkeyObj,
        wallet.publicKey,
        PROGRAM_ID
      );

      const tx = await program.methods
        .vote(new anchor.BN(pollId), optionIndex)
        .accounts({
          poll: pollPubkeyObj,
          voteRecord: voteRecordPda,
          voter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, 'confirmed');
      await loadPolls();

      return { success: true, signature: tx };
    } catch (err: any) {
      console.error('Error voting:', err);
      if (err.message.includes('already in use')) {
        throw new Error('You have already voted in this poll');
      }
      throw new Error(err.message || 'Failed to vote');
    }
  };

  // Close a poll
  const closePoll = async (pollPubkey: string, pollId: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const program = getProgram(wallet as any, connection);
      const pollPubkeyObj = new PublicKey(pollPubkey);

      const tx = await program.methods
        .closePoll(new anchor.BN(pollId))
        .accounts({
          poll: pollPubkeyObj,
          creator: wallet.publicKey,
        })
        .rpc();

      await connection.confirmTransaction(tx, 'confirmed');
      await loadPolls();

      return { success: true, signature: tx };
    } catch (err: any) {
      console.error('Error closing poll:', err);
      throw new Error(err.message || 'Failed to close poll');
    }
  };

  // Check if user has voted
  const checkIfVoted = async (pollPubkey: string): Promise<boolean> => {
    if (!wallet.publicKey) return false;

    try {
      const program = getProgram(wallet as any, connection);
      const pollPubkeyObj = new PublicKey(pollPubkey);

      const [voteRecordPda] = getVoteRecordPDA(
        pollPubkeyObj,
        wallet.publicKey,
        PROGRAM_ID
      );

      // @ts-ignore - Anchor program type
      const voteRecord = await program.account.voteRecord.fetch(voteRecordPda);
      return !!voteRecord;
    } catch (err) {
      return false;
    }
  };

  // Get poll by ID
  const getPollById = async (pollId: number): Promise<PollWithKey | null> => {
    if (!wallet.publicKey) return null;

    try {
      const program = getProgram(wallet as any, connection);
      const [pollPda] = getPollPDA(pollId, PROGRAM_ID);

      // @ts-ignore - Anchor program type
      const pollAccount = await program.account.poll.fetch(pollPda);

      return {
        publicKey: pollPda.toString(),
        account: pollAccount as PollAccount,
      };
    } catch (err) {
      console.error('Error fetching poll:', err);
      return null;
    }
  };

  // Load polls on mount and wallet change
  useEffect(() => {
    if (wallet.connected) {
      loadPolls();
    }
  }, [wallet.connected, loadPolls]);

  return {
    polls,
    loading,
    error,
    createPoll,
    vote,
    closePoll,
    loadPolls,
    checkIfVoted,
    getPollById,
  };
};
function getPollCounterPDA(_PROGRAM_ID: PublicKey): [any] {
  throw new Error('Function not implemented.');
}

