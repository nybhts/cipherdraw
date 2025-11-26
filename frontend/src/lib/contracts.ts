export const CIPHER_DRAW_ADDRESS = "0x5B3cfA330CabAeC8c997da3b9c75471ae0ff7171" as const;

export const CIPHER_DRAW_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  { inputs: [], name: "AlreadyClaimed", type: "error" },
  { inputs: [], name: "AlreadyEntered", type: "error" },
  { inputs: [], name: "AlreadyRevealed", type: "error" },
  { inputs: [], name: "InvalidDuration", type: "error" },
  { inputs: [], name: "InvalidFee", type: "error" },
  { inputs: [], name: "InvalidNumber", type: "error" },
  { inputs: [], name: "NoParticipants", type: "error" },
  { inputs: [], name: "NotAdmin", type: "error" },
  { inputs: [], name: "NotEntered", type: "error" },
  { inputs: [], name: "NotRefundable", type: "error" },
  { inputs: [], name: "NotRevealed", type: "error" },
  { inputs: [], name: "NotWinner", type: "error" },
  { inputs: [], name: "RoundEnded", type: "error" },
  { inputs: [], name: "RoundNotActive", type: "error" },
  { inputs: [], name: "RoundNotEnded", type: "error" },
  { inputs: [], name: "RoundNotFound", type: "error" },
  { inputs: [], name: "TransferFailed", type: "error" },
  { inputs: [], name: "ZeroAddress", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "oldAdmin", type: "address" },
      { indexed: true, internalType: "address", name: "newAdmin", type: "address" }
    ],
    name: "AdminTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" }
    ],
    name: "EntrySubmitted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" }
    ],
    name: "EntryUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" }
    ],
    name: "NumbersMarkedForReveal",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "winner", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "PrizeClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "RefundClaimed",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" }
    ],
    name: "RoundCancelled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "uint256", name: "entryFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endTime", type: "uint256" }
    ],
    name: "RoundCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "winner", type: "address" },
      { indexed: false, internalType: "uint256", name: "prize", type: "uint256" }
    ],
    name: "RoundSettled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "roundId", type: "uint256" },
      { indexed: true, internalType: "address", name: "winner", type: "address" }
    ],
    name: "WinnerDrawn",
    type: "event"
  },
  {
    inputs: [],
    name: "MAX_DURATION",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_ENTRY_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MAX_NUMBER",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MIN_DURATION",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MIN_ENTRY_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "MIN_NUMBER",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "cancelRound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "claimPrize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "entryFee", type: "uint256" },
      { internalType: "uint256", name: "duration", type: "uint256" }
    ],
    name: "createRound",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "drawWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "uint8", name: "revealedNum1", type: "uint8" },
      { internalType: "uint8", name: "revealedNum2", type: "uint8" },
      { internalType: "uint8", name: "revealedNum3", type: "uint8" }
    ],
    name: "finalizeRound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "getEntryTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "getRound",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "entryFee", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "prizePool", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "uint256", name: "participantCount", type: "uint256" },
      { internalType: "address", name: "winner", type: "address" },
      { internalType: "uint8", name: "winningNumber1", type: "uint8" },
      { internalType: "uint8", name: "winningNumber2", type: "uint8" },
      { internalType: "uint8", name: "winningNumber3", type: "uint8" },
      { internalType: "bool", name: "numbersRevealed", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "getRoundParticipants",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "hasClaimed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "hasEntered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "listRounds",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "markNumbersForReveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "roundCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "roundExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "externalEuint8", name: "encNum1", type: "bytes32" },
      { internalType: "externalEuint8", name: "encNum2", type: "bytes32" },
      { internalType: "externalEuint8", name: "encNum3", type: "bytes32" },
      { internalType: "bytes", name: "proof", type: "bytes" }
    ],
    name: "submitEntry",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
    name: "transferAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "externalEuint8", name: "encNum1", type: "bytes32" },
      { internalType: "externalEuint8", name: "encNum2", type: "bytes32" },
      { internalType: "externalEuint8", name: "encNum3", type: "bytes32" },
      { internalType: "bytes", name: "proof", type: "bytes" }
    ],
    name: "updateEntry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;
