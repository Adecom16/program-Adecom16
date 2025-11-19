import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletButton() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="wallet-button">
      <WalletMultiButton />
      {connected && publicKey && (
        <div className="wallet-info">
          <span className="wallet-address">
            {publicKey.toString().slice(0, 4)}...
            {publicKey.toString().slice(-4)}
          </span>
        </div>
      )}
    </div>
  );
}