import { formatEther } from 'viem';
import { getStatusLabel, RoundStatus, formatTimeRemaining } from '../hooks/useLottery';

interface RoundCardProps {
  id: number;
  name: string;
  entryFee: bigint;
  endTime: bigint;
  prizePool: bigint;
  status: number;
  participantCount: bigint;
  winner: string;
  winningNumbers: [number, number, number];
  onSelect: (id: number) => void;
  isSelected: boolean;
}

export function RoundCard({
  id,
  name,
  entryFee,
  endTime,
  prizePool,
  status,
  participantCount,
  winner,
  winningNumbers,
  onSelect,
  isSelected,
}: RoundCardProps) {
  const statusLabel = getStatusLabel(status);
  const isActive = status === RoundStatus.Active;
  const isSettled = status === RoundStatus.Settled;
  const isCancelled = status === RoundStatus.Cancelled;

  const getStatusColor = () => {
    switch (status) {
      case RoundStatus.Active: return 'bg-green-500';
      case RoundStatus.Drawing: return 'bg-yellow-500';
      case RoundStatus.Revealing: return 'bg-blue-500';
      case RoundStatus.Settled: return 'bg-purple-500';
      case RoundStatus.Cancelled: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      onClick={() => onSelect(id)}
      className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary-600 ring-2 ring-primary-400'
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-gray-400 text-sm">Round #{id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Entry Fee</span>
          <span className="text-white font-medium">{formatEther(entryFee)} ETH</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Prize Pool</span>
          <span className="text-green-400 font-bold">{formatEther(prizePool)} ETH</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Participants</span>
          <span className="text-white">{participantCount.toString()}</span>
        </div>

        {isActive && (
          <div className="flex justify-between">
            <span className="text-gray-400">Time Left</span>
            <span className="text-yellow-400">{formatTimeRemaining(endTime)}</span>
          </div>
        )}

        {isSettled && winner !== '0x0000000000000000000000000000000000000000' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Winner</span>
              <span className="text-purple-400 font-mono text-sm">
                {winner.slice(0, 6)}...{winner.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Winning Numbers</span>
              <div className="flex gap-2">
                {winningNumbers.map((num, i) => (
                  <span key={i} className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {isCancelled && (
          <p className="text-red-400 text-sm">This round has been cancelled. Refunds available.</p>
        )}
      </div>
    </div>
  );
}
