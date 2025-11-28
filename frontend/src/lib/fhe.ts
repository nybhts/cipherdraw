import { CIPHER_DRAW_ADDRESS } from './contracts';
import { bytesToHex, getAddress } from 'viem';
import type { Address } from 'viem';

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;

/**
 * Get SDK from window (loaded via static script tag in HTML)
 */
const getSDK = () => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error('Relayer SDK not loaded. Ensure the CDN script tag is present in index.html');
  }
  return sdk;
};

/**
 * Initialize FHE instance (singleton pattern)
 */
export const initializeFHE = async (provider?: any) => {
  if (fheInstance) return fheInstance;

  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }

  const ethereumProvider =
    provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;

  if (!ethereumProvider) {
    throw new Error('No wallet provider detected. Connect a wallet first.');
  }

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;
  await initSDK();
  const config = { ...SepoliaConfig, network: ethereumProvider };
  fheInstance = await createInstance(config);
  return fheInstance;
};

/**
 * Get instance or initialize if needed
 */
const getInstance = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  return initializeFHE(provider);
};

/**
 * Get FHE instance if it exists
 */
export const getFHEInstance = (): any => {
  return fheInstance;
};

/**
 * Check if FHE is ready
 */
export const isFheReady = (): boolean => {
  return fheInstance !== null;
};

/**
 * Reset FHE instance (useful for wallet changes)
 */
export const resetFHEInstance = () => {
  fheInstance = null;
};

/**
 * Encrypt lottery numbers (3 numbers from 1-9)
 * @param numbers - Array of 3 numbers [1-9, 1-9, 1-9]
 * @param userAddress - The user's wallet address
 * @param provider - Optional provider
 * @returns Encrypted number handles and proof
 */
export async function encryptLotteryNumbers(
  numbers: [number, number, number],
  userAddress: Address,
  provider?: any
): Promise<{
  encNum1: `0x${string}`;
  encNum2: `0x${string}`;
  encNum3: `0x${string}`;
  proof: `0x${string}`;
}> {
  if (!CIPHER_DRAW_ADDRESS) {
    throw new Error('Contract address not configured');
  }

  const instance = await getInstance(provider);
  const contractAddr = getAddress(CIPHER_DRAW_ADDRESS);
  const userAddr = getAddress(userAddress);

  // Validate number range (1-9)
  const validNumbers = numbers.map(n => Math.max(1, Math.min(9, Math.floor(n))));

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add8(validNumbers[0]); // euint8 for number 1
  input.add8(validNumbers[1]); // euint8 for number 2
  input.add8(validNumbers[2]); // euint8 for number 3

  const { handles, inputProof } = await input.encrypt();

  return {
    encNum1: bytesToHex(handles[0]) as `0x${string}`,
    encNum2: bytesToHex(handles[1]) as `0x${string}`,
    encNum3: bytesToHex(handles[2]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
}

/**
 * Decrypt publicly available handles using the relayer SDK
 * Can be used to reveal numbers after settlement
 */
export async function publicDecryptHandles(handles: `0x${string}`[], provider?: any) {
  if (handles.length === 0) {
    throw new Error('No handles provided for public decryption');
  }

  const instance = await getInstance(provider);
  const result = await instance.publicDecrypt(handles);

  const normalized: Record<string, number | boolean> = {};
  Object.entries(result.clearValues || {}).forEach(([handle, value]) => {
    const key = handle.toLowerCase();
    normalized[key] = typeof value === 'bigint' ? Number(value) : (value as number | boolean);
  });

  const values = handles.map((handle) => normalized[handle.toLowerCase()] ?? 0);

  return {
    values,
    abiEncoded: result.abiEncodedClearValues as `0x${string}`,
    proof: result.decryptionProof as `0x${string}`,
  };
}
