import { useReadContract, useReadContracts, useWriteContract, useAccount } from 'wagmi';
import { CIPHER_DRAW_ADDRESS, CIPHER_DRAW_ABI } from '../lib/contracts';
import { formatEther } from 'viem';

export const RoundStatus = {
  Active: 0,
  Drawing: 1,
  Revealing: 2,
  Settled: 3,
  Cancelled: 4,
} as const;

export const getStatusLabel = (status: number): string => {
  switch (status) {
    case RoundStatus.Active: return 'Active';
    case RoundStatus.Drawing: return 'Drawing';
    case RoundStatus.Revealing: return 'Revealing';
    case RoundStatus.Settled: return 'Settled';
    case RoundStatus.Cancelled: return 'Cancelled';
    default: return 'Unknown';
  }
};

export interface Round {
  id: number;
  name: string;
  entryFee: bigint;
  endTime: bigint;
  prizePool: bigint;
  status: number;
  participantCount: bigint;
  winner: string;
  winningNumber1: number;
  winningNumber2: number;
  winningNumber3: number;
  numbersRevealed: boolean;
}

export function useRoundIds() {
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'listRounds',
  });
}

export function useRound(roundId: number) {
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'getRound',
    args: [BigInt(roundId)],
  });
}

export function useRounds(roundIds: bigint[]) {
  const contracts = roundIds.map((id) => ({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'getRound' as const,
    args: [id],
  }));

  return useReadContracts({
    contracts,
    query: {
      enabled: roundIds.length > 0,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });
}

export function useHasEntered(roundId: number) {
  const { address } = useAccount();
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'hasEntered',
    args: address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useHasClaimed(roundId: number) {
  const { address } = useAccount();
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'hasClaimed',
    args: address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useAdmin() {
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'admin',
  });
}

export function useRoundCount() {
  return useReadContract({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'roundCount',
  });
}

export function useSubmitEntry() {
  return useWriteContract();
}

export function useClaimPrize() {
  return useWriteContract();
}

export function useClaimRefund() {
  return useWriteContract();
}

export function useDrawWinner() {
  return useWriteContract();
}

export function formatPrize(wei: bigint): string {
  return formatEther(wei);
}

export function formatTimeRemaining(endTime: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const remaining = end - now;

  if (remaining <= 0) return 'Ended';

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

// Batch check if user has entered multiple rounds
export function useUserEntries(roundIds: bigint[]) {
  const { address } = useAccount();

  const contracts = roundIds.map((id) => ({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'hasEntered' as const,
    args: address ? [id, address] : undefined,
  }));

  return useReadContracts({
    contracts,
    query: {
      enabled: !!address && roundIds.length > 0,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });
}

// Batch check if user has claimed from multiple rounds
export function useUserClaims(roundIds: bigint[]) {
  const { address } = useAccount();

  const contracts = roundIds.map((id) => ({
    address: CIPHER_DRAW_ADDRESS,
    abi: CIPHER_DRAW_ABI,
    functionName: 'hasClaimed' as const,
    args: address ? [id, address] : undefined,
  }));

  return useReadContracts({
    contracts,
    query: {
      enabled: !!address && roundIds.length > 0,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });
}
