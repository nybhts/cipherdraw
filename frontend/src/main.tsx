import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { Toaster } from 'sonner';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App';
import './index.css';
import { config } from './lib/wagmi';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#d946ef',
          accentColorForeground: 'white',
          borderRadius: 'large',
        })}>
          <App />
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            toastOptions={{
              style: {
                background: 'rgba(17, 17, 27, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
