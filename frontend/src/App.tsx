import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import WalletButton from './components/WalletButton';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="app">
            <header className="header">
              <h1>🗳️ Voting DApp</h1>
              <p>Decentralized voting on Solana</p>
              <WalletButton />
            </header>

            <main className="main">
              <CreatePoll />
              <PollList />
            </main>

            <footer className="footer">
              <p>Built on Solana • Powered by Anchor</p>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;