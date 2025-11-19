import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVoting } from '../hooks/useVoting';

export default function CreatePoll() {
  const wallet = useWallet();
  const { createPoll: createPollTx } = useVoting();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await createPollTx(title, description, options, durationDays);
      
      console.log('Poll created:', result.signature);
      setSuccess(`Poll created successfully! Transaction: ${result.signature.slice(0, 8)}...`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setDurationDays(7);

      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      console.error('Error creating poll:', err);
      setError(err.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const isValid = 
    title.length > 0 &&
    description.length > 0 &&
    options.every(opt => opt.length > 0) &&
    options.length >= 2;

  if (!wallet.connected) {
    return (
      <div className="card">
        <h2>Create New Poll</h2>
        <p className="muted">Connect your wallet to create a poll</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Create New Poll</h2>
      
      <div className="form-group">
        <label>Poll Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Favorite Programming Language"
          maxLength={100}
        />
        <small>{title.length}/100</small>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide details about this poll..."
          maxLength={500}
          rows={3}
        />
        <small>{description.length}/500</small>
      </div>

      <div className="form-group">
        <label>Options</label>
        {options.map((option, index) => (
          <div key={index} className="option-input">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              maxLength={50}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="btn-icon"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button type="button" onClick={addOption} className="btn-secondary">
            + Add Option
          </button>
        )}
      </div>

      <div className="form-group">
        <label>Duration (days)</label>
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          min={1}
          max={365}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <button
        onClick={handleCreatePoll}
        disabled={!isValid || loading}
        className="btn-primary"
      >
        {loading ? 'Creating...' : 'Create Poll'}
      </button>
    </div>
  );
}