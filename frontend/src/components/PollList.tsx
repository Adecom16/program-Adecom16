import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '../utils/anchor';
import PollCard from './PollCard';

interface Poll {
  publicKey: string;
  account: any;
}

export default function PollList() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('active');

  useEffect(() => {
    loadPolls();
  }, [wallet.connected]);

  const loadPolls = async () => {
    if (!wallet.publicKey) {
      setPolls([]);
      setLoading(false);
      return;
    }

    try {
      const program = getProgram(wallet as any, connection);
      
      // Get all poll accounts
      // @ts-ignore - Anchor program type
      const pollAccounts = await program.account.poll.all();
      
      setPolls(
        pollAccounts.map((poll: any) => ({
          publicKey: poll.publicKey.toString(),
          account: poll.account,
        }))
      );
    } catch (err) {
      console.error('Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolls = polls.filter((poll) => {
    if (filter === 'all') return true;
    if (filter === 'active') return poll.account.isActive;
    if (filter === 'closed') return !poll.account.isActive;
    return true;
  });

  if (!wallet.connected) {
    return (
      <div className="card">
        <h2>Active Polls</h2>
        <p className="muted">Connect your wallet to view and vote on polls</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Loading Polls...</h2>
      </div>
    );
  }

  return (
    <div className="poll-list">
      <div className="poll-list-header">
        <h2>Polls</h2>
        <div className="filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            All ({polls.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'active' : ''}
          >
            Active ({polls.filter(p => p.account.isActive).length})
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={filter === 'closed' ? 'active' : ''}
          >
            Closed ({polls.filter(p => !p.account.isActive).length})
          </button>
        </div>
      </div>

      {filteredPolls.length === 0 ? (
        <div className="card">
          <p className="muted">No polls found</p>
        </div>
      ) : (
        <div className="polls-grid">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.publicKey}
              pollPubkey={poll.publicKey}
              poll={poll.account}
              onUpdate={loadPolls}
            />
          ))}
        </div>
      )}
    </div>
  );
}