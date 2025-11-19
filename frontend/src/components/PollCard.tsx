import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { getProgram, getVoteRecordPDA, PROGRAM_ID } from '../utils/anchor';

interface PollCardProps {
  pollPubkey: string;
  poll: any;
  onUpdate: () => void;
}

export default function PollCard({ pollPubkey, poll, onUpdate }: PollCardProps) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const pollId = (poll.pollId as anchor.BN).toNumber();
  const totalVotes = (poll.totalVotes as anchor.BN).toNumber();
  const startTime = (poll.startTime as anchor.BN).toNumber();
  const endTime = (poll.endTime as anchor.BN).toNumber();
  const now = Math.floor(Date.now() / 1000);

  const isCreator = wallet.publicKey?.equals(poll.creator);
  const hasStarted = now >= startTime;
  const hasEnded = now > endTime;
  const canVote = poll.isActive && hasStarted && !hasEnded && !hasVoted;

  const vote = async (optionIndex: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) return;

    setVoting(true);
    setError('');

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

      console.log('Vote cast:', tx);
      setHasVoted(true);
      onUpdate();
    } catch (err: any) {
      console.error('Error voting:', err);
      if (err.message.includes('already in use')) {
        setError('You have already voted in this poll');
        setHasVoted(true);
      } else {
        setError(err.message || 'Failed to vote');
      }
    } finally {
      setVoting(false);
    }
  };

  const closePoll = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) return;

    setClosing(true);
    setError('');

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

      console.log('Poll closed:', tx);
      onUpdate();
    } catch (err: any) {
      console.error('Error closing poll:', err);
      setError(err.message || 'Failed to close poll');
    } finally {
      setClosing(false);
    }
  };

  const getPercentage = (votes: anchor.BN) => {
    if (totalVotes === 0) return 0;
    return ((votes.toNumber() / totalVotes) * 100).toFixed(1);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className={`poll-card ${!poll.isActive ? 'closed' : ''}`}>
      <div className="poll-header">
        <h3>{poll.title}</h3>
        <span className={`status ${poll.isActive ? 'active' : 'closed'}`}>
          {poll.isActive ? '🟢 Active' : '🔴 Closed'}
        </span>
      </div>

      <p className="poll-description">{poll.description}</p>

      <div className="poll-info">
        <div className="info-item">
          <span className="label">Total Votes:</span>
          <span className="value">{totalVotes}</span>
        </div>
        <div className="info-item">
          <span className="label">Ends:</span>
          <span className="value">{formatDate(endTime)}</span>
        </div>
      </div>

      <div className="options">
        {poll.options.map((option: string, index: number) => {
          const votes = poll.votes[index];
          const percentage = getPercentage(votes);

          return (
            <div key={index} className="option">
              <div className="option-header">
                <span className="option-text">{option}</span>
                <span className="option-stats">
                  {votes.toNumber()} votes ({percentage}%)
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {canVote && (
                <button
                  onClick={() => vote(index)}
                  disabled={voting}
                  className="btn-vote"
                >
                  {voting ? 'Voting...' : 'Vote'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {hasVoted && <div className="voted-badge">✓ You voted</div>}

      {!hasStarted && (
        <div className="alert alert-info">
          Poll starts on {formatDate(startTime)}
        </div>
      )}

      {hasEnded && poll.isActive && (
        <div className="alert alert-warning">
          Poll has ended but not yet closed
        </div>
      )}

      {isCreator && poll.isActive && (
        <button
          onClick={closePoll}
          disabled={closing}
          className="btn-danger"
        >
          {closing ? 'Closing...' : 'Close Poll'}
        </button>
      )}
    </div>
  );
}