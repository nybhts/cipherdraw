import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, Trophy, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  useRoundIds,
  useRounds,
  useUserEntries,
  useUserClaims,
  RoundStatus,
  getStatusLabel,
  formatTimeRemaining,
} from '../hooks/useLottery';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CIPHER_DRAW_ADDRESS, CIPHER_DRAW_ABI } from '../lib/contracts';
import { showTxSubmitted, showTxSuccess, showTxError } from '../lib/txToast';
import { useEffect, useRef } from 'react';

type TabType = 'active' | 'pending' | 'ended';

interface MyTicketRound {
  id: bigint;
  index: number;
  name: string;
  entryFee: bigint;
  endTime: bigint;
  prizePool: bigint;
  status: number;
  participantCount: bigint;
  winner: string;
  winningNumbers: [number, number, number];
  hasClaimed: boolean;
}

export function MyTickets() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: roundIds, isLoading: loadingIds, refetch: refetchRoundIds } = useRoundIds();
  const { data: roundsData, isLoading: loadingRounds, refetch: refetchRounds } = useRounds(roundIds ? [...roundIds] : []);
  const { data: entriesData, refetch: refetchEntries } = useUserEntries(roundIds ? [...roundIds] : []);
  const { data: claimsData, refetch: refetchClaims } = useUserClaims(roundIds ? [...roundIds] : []);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const currentActionRef = useRef<string>('Transaction');

  // Refetch all data
  const refetchAll = () => {
    refetchRoundIds();
    refetchRounds();
    refetchEntries();
    refetchClaims();
  };

  // Toast notifications
  useEffect(() => {
    if (txHash) {
      showTxSubmitted(txHash, `${currentActionRef.current} Submitted`);
    }
  }, [txHash]);

  useEffect(() => {
    if (isSuccess && txHash) {
      showTxSuccess(txHash, `${currentActionRef.current} Confirmed`);
      // Refetch data after successful transaction
      refetchAll();
    }
  }, [isSuccess, txHash]);

  useEffect(() => {
    if (isTxError && txHash) {
      showTxError(txHash, `${currentActionRef.current} Failed`, 'Transaction reverted on chain');
    }
  }, [isTxError, txHash]);

  // Build user's participated rounds
  const myRounds = useMemo(() => {
    if (!roundIds || !roundsData || !entriesData || !claimsData) return [];

    const rounds: MyTicketRound[] = [];

    roundIds.forEach((id, index) => {
      const roundData = roundsData[index];
      const hasEntered = entriesData[index];
      const hasClaimed = claimsData[index];

      if (
        roundData?.status === 'success' &&
        hasEntered?.status === 'success' &&
        hasEntered.result === true
      ) {
        const [name, entryFee, endTime, prizePool, status, participantCount, winner, num1, num2, num3] = roundData.result;

        rounds.push({
          id,
          index,
          name,
          entryFee,
          endTime,
          prizePool,
          status,
          participantCount,
          winner,
          winningNumbers: [num1, num2, num3],
          hasClaimed: hasClaimed?.status === 'success' ? hasClaimed.result as boolean : false,
        });
      }
    });

    return rounds;
  }, [roundIds, roundsData, entriesData, claimsData]);

  // Filter rounds by category
  const activeRounds = myRounds.filter(r => r.status === RoundStatus.Active);
  const pendingRounds = myRounds.filter(r =>
    r.status === RoundStatus.Drawing || r.status === RoundStatus.Revealing
  );
  const endedRounds = myRounds.filter(r =>
    r.status === RoundStatus.Settled || r.status === RoundStatus.Cancelled
  );

  const currentRounds = activeTab === 'active'
    ? activeRounds
    : activeTab === 'pending'
    ? pendingRounds
    : endedRounds;

  const handleClaimPrize = (roundId: bigint) => {
    currentActionRef.current = 'Claim Prize';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'claimPrize',
      args: [roundId],
    });
  };

  const handleClaimRefund = (roundId: bigint) => {
    currentActionRef.current = 'Claim Refund';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'claimRefund',
      args: [roundId],
    });
  };

  if (!isConnected) {
    return null;
  }

  const isLoading = loadingIds || loadingRounds;

  return (
    <motion.div
      className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white font-orbitron">My Tickets</h3>
            <p className="text-sm text-gray-400">{myRounds.length} entries total</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tabs */}
            <div className="flex border-t border-gray-800">
              <TabButton
                active={activeTab === 'active'}
                onClick={() => setActiveTab('active')}
                icon={<Clock className="w-4 h-4" />}
                label="Active"
                count={activeRounds.length}
                color="green"
              />
              <TabButton
                active={activeTab === 'pending'}
                onClick={() => setActiveTab('pending')}
                icon={<Clock className="w-4 h-4" />}
                label="Pending"
                count={pendingRounds.length}
                color="yellow"
              />
              <TabButton
                active={activeTab === 'ended'}
                onClick={() => setActiveTab('ended')}
                icon={<Trophy className="w-4 h-4" />}
                label="Ended"
                count={endedRounds.length}
                color="purple"
              />
            </div>

            {/* Round List */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-3 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin" />
                </div>
              ) : currentRounds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {activeTab === 'active' ? '🎯' : activeTab === 'pending' ? '⏳' : '📜'}
                  </div>
                  <p className="text-gray-400">
                    {activeTab === 'active'
                      ? 'No active entries'
                      : activeTab === 'pending'
                      ? 'No rounds pending settlement'
                      : 'No ended rounds yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentRounds.map((round) => (
                    <MyTicketCard
                      key={round.id.toString()}
                      round={round}
                      address={address!}
                      onClaimPrize={() => handleClaimPrize(round.id)}
                      onClaimRefund={() => handleClaimRefund(round.id)}
                      isProcessing={isPending || isConfirming}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    green: 'text-green-400 border-green-400',
    yellow: 'text-yellow-400 border-yellow-400',
    purple: 'text-purple-400 border-purple-400',
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all border-b-2 ${
        active
          ? `${colorClasses[color]} bg-gray-800/30`
          : 'text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
          active ? 'bg-gray-700' : 'bg-gray-800'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function MyTicketCard({
  round,
  address,
  onClaimPrize,
  onClaimRefund,
  isProcessing,
}: {
  round: MyTicketRound;
  address: string;
  onClaimPrize: () => void;
  onClaimRefund: () => void;
  isProcessing: boolean;
}) {
  const isWinner = round.winner.toLowerCase() === address.toLowerCase();
  const isSettled = round.status === RoundStatus.Settled;
  const isCancelled = round.status === RoundStatus.Cancelled;
  const canClaimPrize = isSettled && isWinner && !round.hasClaimed;
  const canClaimRefund = isCancelled && !round.hasClaimed;

  const statusColors: Record<number, string> = {
    [RoundStatus.Active]: 'bg-green-500/20 text-green-400',
    [RoundStatus.Drawing]: 'bg-yellow-500/20 text-yellow-400',
    [RoundStatus.Revealing]: 'bg-orange-500/20 text-orange-400',
    [RoundStatus.Settled]: 'bg-purple-500/20 text-purple-400',
    [RoundStatus.Cancelled]: 'bg-red-500/20 text-red-400',
  };

  return (
    <motion.div
      className={`p-4 rounded-xl border ${
        canClaimPrize
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-gray-700/50 bg-gray-800/30'
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold">Round #{round.id.toString()}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[round.status]}`}>
              {getStatusLabel(round.status)}
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate max-w-[200px]">{round.name}</p>
        </div>

        {isWinner && isSettled && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold">WINNER!</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Prize Pool</p>
          <p className="text-sm font-mono font-semibold text-green-400">
            {formatEther(round.prizePool)} ETH
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Participants</p>
          <p className="text-sm font-mono font-semibold text-purple-400">
            {round.participantCount.toString()}
          </p>
        </div>
        {round.status === RoundStatus.Active && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Time Remaining</p>
            <p className="text-sm font-mono font-semibold text-yellow-400">
              {formatTimeRemaining(round.endTime)}
            </p>
          </div>
        )}
        {isSettled && round.winningNumbers[0] > 0 && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1">Winning Numbers</p>
            <div className="flex gap-2">
              {round.winningNumbers.map((num, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-bold"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canClaimPrize && (
        <motion.button
          onClick={onClaimPrize}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Trophy className="w-4 h-4" />
          {isProcessing ? 'Processing...' : `Claim Prize (${formatEther(round.prizePool)} ETH)`}
        </motion.button>
      )}

      {canClaimRefund && (
        <motion.button
          onClick={onClaimRefund}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <XCircle className="w-4 h-4" />
          {isProcessing ? 'Processing...' : `Claim Refund (${formatEther(round.entryFee)} ETH)`}
        </motion.button>
      )}

      {round.hasClaimed && (isSettled || isCancelled) && (
        <div className="py-2 text-center text-sm text-gray-500">
          {isWinner ? 'Prize claimed' : 'Refund claimed'}
        </div>
      )}

      {isSettled && !isWinner && !isCancelled && (
        <div className="py-2 text-center text-sm text-gray-500">
          Better luck next time!
        </div>
      )}
    </motion.div>
  );
}
