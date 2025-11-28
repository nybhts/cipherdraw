import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { initializeFHE, isFheReady, encryptLotteryNumbers, resetFHEInstance } from '../lib/fhe';

export interface FheState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

export function useFheInit() {
  const [state, setState] = useState<FheState>({
    isInitialized: false,
    isInitializing: false,
    error: null,
  });
  const { isConnected, address } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      // Reset state when disconnected
      setState({ isInitialized: false, isInitializing: false, error: null });
      resetFHEInstance();
      return;
    }

    if (isFheReady()) {
      setState({ isInitialized: true, isInitializing: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    initializeFHE()
      .then(() => {
        setState({ isInitialized: true, isInitializing: false, error: null });
        console.log('FHE SDK initialized successfully');
      })
      .catch((err) => {
        console.error('Failed to initialize FHE:', err);
        setState({
          isInitialized: false,
          isInitializing: false,
          error: err.message || 'Failed to initialize FHE SDK',
        });
      });
  }, [isConnected, address]);

  return state;
}

export interface EncryptedEntry {
  encNum1: `0x${string}`;
  encNum2: `0x${string}`;
  encNum3: `0x${string}`;
  proof: `0x${string}`;
}

export function useEncryptNumbers() {
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encrypt = useCallback(
    async (numbers: [number, number, number]): Promise<EncryptedEntry | null> => {
      if (!address) {
        setError('Wallet not connected');
        return null;
      }

      if (!isFheReady()) {
        setError('FHE not initialized. Please wait...');
        return null;
      }

      setIsEncrypting(true);
      setError(null);

      try {
        const encrypted = await encryptLotteryNumbers(numbers, address);
        return encrypted;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Encryption failed';
        setError(message);
        console.error('Encryption error:', err);
        return null;
      } finally {
        setIsEncrypting(false);
      }
    },
    [address]
  );

  return { encrypt, isEncrypting, error };
}
