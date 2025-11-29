import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { RoundCard } from './components/RoundCard';
import { NumberPicker } from './components/NumberPicker';
import { MyTickets } from './components/MyTickets';
import {
  useRoundIds,
  useRounds,
  useHasEntered,
  RoundStatus,
  getStatusLabel,
  formatTimeRemaining
} from './hooks/useLottery';
import { useFheInit, useEncryptNumbers } from './hooks/useFhe';
import { CIPHER_DRAW_ADDRESS, CIPHER_DRAW_ABI } from './lib/contracts';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { showTxSubmitted, showTxSuccess, showTxError, showSubmitError } from './lib/txToast';

function App() {
  const { address, isConnected } = useAccount();
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<[number, number, number]>([1, 1, 1]);

  // FHE initialization
  const { isInitialized: fheReady, isInitializing: fheLoading, error: fheError } = useFheInit();
  const { encrypt, isEncrypting } = useEncryptNumbers();

  const { data: roundIds, isLoading: loadingIds } = useRoundIds();
  const { data: roundsData, isLoading: loadingRounds } = useRounds(roundIds ? [...roundIds] : []);
  const { data: hasEntered } = useHasEntered(selectedRound ?? 0);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Track the current action for toast messages
  const currentActionRef = useRef<string>('Transaction');

  // Show toast when transaction is submitted
  useEffect(() => {
    if (txHash) {
      showTxSubmitted(txHash, `${currentActionRef.current} Submitted`);
    }
  }, [txHash]);

  // Show toast when transaction is confirmed
  useEffect(() => {
    if (isSuccess && txHash) {
      showTxSuccess(txHash, `${currentActionRef.current} Confirmed`);
    }
  }, [isSuccess, txHash]);

  // Show toast when transaction fails on-chain
  useEffect(() => {
    if (isTxError && txHash) {
      showTxError(txHash, `${currentActionRef.current} Failed`, 'Transaction reverted on chain');
    }
  }, [isTxError, txHash]);

  // Show toast when wallet rejects or submission fails
  useEffect(() => {
    if (writeError) {
      const errorMsg = writeError.message?.includes('User rejected')
        ? 'Transaction rejected by user'
        : writeError.message?.slice(0, 100) || 'Unknown error';
      showSubmitError(`${currentActionRef.current} Failed`, errorMsg);
    }
  }, [writeError]);

  const handleSubmitEntry = async () => {
    if (selectedRound === null || !roundsData || !fheReady) return;

    const roundData = roundsData[selectedRound];
    if (!roundData || roundData.status !== 'success') return;

    const entryFee = roundData.result[1];

    // Encrypt the lottery numbers using FHE
    const encrypted = await encrypt(selectedNumbers);
    if (!encrypted) {
      showSubmitError('Encryption Failed', 'Failed to encrypt lottery numbers');
      return;
    }

    currentActionRef.current = 'Submit Entry';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'submitEntry',
      args: [
        BigInt(selectedRound),
        encrypted.encNum1,
        encrypted.encNum2,
        encrypted.encNum3,
        encrypted.proof,
      ],
      value: entryFee,
    });
  };

  // @ts-ignore - Reserved for admin functionality
  const handleDrawWinner = async () => {
    if (selectedRound === null) return;

    currentActionRef.current = 'Draw Winner';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'drawWinner',
      args: [BigInt(selectedRound)],
    });
  };

  const handleClaimPrize = async () => {
    if (selectedRound === null) return;

    currentActionRef.current = 'Claim Prize';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'claimPrize',
      args: [BigInt(selectedRound)],
    });
  };

  const handleClaimRefund = async () => {
    if (selectedRound === null) return;

    currentActionRef.current = 'Claim Refund';
    writeContract({
      address: CIPHER_DRAW_ADDRESS,
      abi: CIPHER_DRAW_ABI,
      functionName: 'claimRefund',
      args: [BigInt(selectedRound)],
    });
  };

  const isLoading = loadingIds || loadingRounds;
  const selectedRoundData = selectedRound !== null && roundsData?.[selectedRound]?.status === 'success'
    ? roundsData[selectedRound].result
    : null;

  // Calculate stats
  const stats = roundsData ? {
    activeRounds: roundsData.filter(r => r.status === 'success' && r.result[4] === RoundStatus.Active).length,
    totalRounds: roundIds?.length || 0,
    totalPrizePool: roundsData.reduce((sum, r) => {
      if (r.status === 'success') {
        return sum + Number(formatEther(r.result[3]));
      }
      return sum;
    }, 0),
    totalParticipants: roundsData.reduce((sum, r) => {
      if (r.status === 'success') {
        return sum + Number(r.result[5]);
      }
      return sum;
    }, 0),
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-violet-400 bg-clip-text text-transparent font-orbitron tracking-tight">
            CIPHERDRAW
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Pick 3 secret numbers encrypted with <span className="text-fuchsia-400 font-semibold">Fully Homomorphic Encryption</span>.
            <br />
            All entries go into a shared prize pool. <span className="text-purple-400 font-semibold">One winner takes all!</span>
          </p>
        </motion.div>

        {/* Stats Bar */}
        {stats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StatCard label="Active Rounds" value={stats.activeRounds.toString()} color="fuchsia" />
            <StatCard label="Total Rounds" value={stats.totalRounds.toString()} color="purple" />
            <StatCard label="Total Pool" value={`${stats.totalPrizePool.toFixed(3)} ETH`} color="green" />
            <StatCard label="Participants" value={stats.totalParticipants.toString()} color="blue" />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left: Round List */}
          <div className="xl:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-orbitron">Draw Rounds</h2>
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-sm font-medium">
                  {roundIds?.length || 0} Rounds
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
                  </div>
                </div>
              ) : roundIds?.length === 0 ? (
                <motion.div
                  className="text-center py-20 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-6xl mb-4">🎰</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Rounds Available</h3>
                  <p className="text-gray-500">Check back later for new draw rounds.</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {roundIds?.map((id, index) => {
                      const data = roundsData?.[index];
                      if (!data || data.status !== 'success') return null;

                      const [name, entryFee, endTime, prizePool, status, participantCount, winner, num1, num2, num3] = data.result;

                      return (
                        <motion.div
                          key={id.toString()}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <RoundCard
                            id={Number(id)}
                            name={name}
                            entryFee={entryFee}
                            endTime={endTime}
                            prizePool={prizePool}
                            status={status}
                            participantCount={participantCount}
                            winner={winner}
                            winningNumbers={[num1, num2, num3]}
                            onSelect={setSelectedRound}
                            isSelected={selectedRound === Number(id)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Action Panel */}
          <div className="xl:col-span-5">
            <motion.div
              className="sticky top-24 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {selectedRound !== null && selectedRoundData ? (
                <>
                  {/* Selected Round Info */}
                  <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white font-orbitron">
                        Round #{selectedRound}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedRoundData[4] === RoundStatus.Active
                          ? 'bg-green-500/20 text-green-400 animate-pulse'
                          : selectedRoundData[4] === RoundStatus.Settled
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getStatusLabel(selectedRoundData[4])}
                      </span>
                    </div>

                    <h4 className="text-lg text-gray-300 mb-4">{selectedRoundData[0]}</h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-xl bg-gray-800/50">
                        <p className="text-sm text-gray-500 mb-1">Entry Fee</p>
                        <p className="text-xl font-mono font-bold text-white">{formatEther(selectedRoundData[1])} ETH</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-800/50">
                        <p className="text-sm text-gray-500 mb-1">Prize Pool</p>
                        <p className="text-xl font-mono font-bold text-green-400">{formatEther(selectedRoundData[3])} ETH</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-800/50">
                        <p className="text-sm text-gray-500 mb-1">Participants</p>
                        <p className="text-xl font-mono font-bold text-purple-400">{selectedRoundData[5].toString()}</p>
                      </div>
                      {selectedRoundData[4] === RoundStatus.Active && (
                        <div className="p-4 rounded-xl bg-gray-800/50">
                          <p className="text-sm text-gray-500 mb-1">Time Left</p>
                          <p className="text-xl font-mono font-bold text-yellow-400">{formatTimeRemaining(selectedRoundData[2])}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Section */}
                  {!isConnected ? (
                    <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl text-center">
                      <div className="text-5xl mb-4">🔗</div>
                      <p className="text-gray-400 text-lg">Connect your wallet to participate</p>
                    </div>
                  ) : selectedRoundData[4] === RoundStatus.Active ? (
                    <>
                      <NumberPicker
                        onNumbersSelected={setSelectedNumbers}
                        disabled={hasEntered || isPending || isConfirming}
                      />

                      {hasEntered ? (
                        <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/10 text-center">
                          <div className="text-4xl mb-2">✅</div>
                          <p className="text-green-400 font-semibold">You have entered this round!</p>
                          <p className="text-sm text-green-400/70 mt-1">Good luck!</p>
                        </div>
                      ) : !fheReady ? (
                        <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-yellow-500/30 border-t-yellow-500 animate-spin" />
                            <p className="text-yellow-400 font-semibold">
                              {fheLoading ? 'Initializing FHE encryption...' : fheError || 'FHE not ready'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <motion.button
                          onClick={handleSubmitEntry}
                          disabled={isPending || isConfirming || isEncrypting || !fheReady}
                          className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isEncrypting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              Encrypting Numbers...
                            </span>
                          ) : isPending ? (
                            'Confirm in Wallet...'
                          ) : isConfirming ? (
                            'Processing...'
                          ) : (
                            `Enter Draw (${formatEther(selectedRoundData[1])} ETH)`
                          )}
                        </motion.button>
                      )}

                      {isSuccess && (
                        <motion.div
                          className="p-4 rounded-2xl border border-green-500/30 bg-green-500/10 text-center"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <p className="text-green-400 font-semibold">Entry submitted successfully! 🎉</p>
                        </motion.div>
                      )}
                    </>
                  ) : selectedRoundData[4] === RoundStatus.Settled && selectedRoundData[6] === address ? (
                    <motion.button
                      onClick={handleClaimPrize}
                      disabled={isPending || isConfirming}
                      className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🏆 Claim Your Prize ({formatEther(selectedRoundData[3])} ETH)
                    </motion.button>
                  ) : selectedRoundData[4] === RoundStatus.Cancelled && hasEntered ? (
                    <motion.button
                      onClick={handleClaimRefund}
                      disabled={isPending || isConfirming}
                      className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      💰 Claim Refund
                    </motion.button>
                  ) : null}
                </>
              ) : (
                <div className="p-12 rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a Round</h3>
                  <p className="text-gray-500">Choose a draw round from the list to participate.</p>
                </div>
              )}

              {/* My Tickets Section */}
              {isConnected && <MyTickets />}
            </motion.div>
          </div>
        </div>

        {/* How It Works */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-10 font-orbitron">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard step={1} title="Pick Numbers" description="Choose 3 numbers between 1-9" icon="🎲" />
            <StepCard step={2} title="Encrypt & Submit" description="Numbers encrypted with FHE" icon="🔐" />
            <StepCard step={3} title="Wait for Draw" description="Random winner selected on-chain" icon="⏳" />
            <StepCard step={4} title="Claim Prize" description="Winner takes the entire pool" icon="🏆" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`p-6 rounded-2xl border bg-gradient-to-br backdrop-blur-sm ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className={`text-3xl font-mono font-bold mb-1 ${colorClasses[color as keyof typeof colorClasses].split(' ').pop()}`}>
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function StepCard({ step, title, description, icon }: { step: number; title: string; description: string; icon: string }) {
  return (
    <div className="relative p-6 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm text-center group hover:border-purple-500/50 transition-all">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/25">
        {step}
      </div>
      <div className="text-4xl mb-4 mt-2">{icon}</div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

export default App;
