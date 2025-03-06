import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ReactNode, useMemo } from 'react';

export default function WalletAdapterProvider({ children }: {
  children: ReactNode
}) {
  const wallets = useMemo(() => [], []);

  return (
    <main>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </main>
  )
}
