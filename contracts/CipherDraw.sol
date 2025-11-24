// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint64, externalEuint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title CipherDraw
 * @notice FHE-powered prize draw pool with encrypted number picks
 * @dev Uses Zama fhEVM 0.9.1 for encrypted number selection
 *
 * Core Features:
 * - Users pick 3 numbers (1-9) which remain encrypted until reveal
 * - All entry fees go into a shared prize pool
 * - Random winner selection using blockhash
 * - Winner revealed through FHE decryption process
 */
contract CipherDraw is ZamaEthereumConfig {
    // ==================== Enum Definitions ====================

    enum RoundStatus {
        Active,     // Accepting entries
        Drawing,    // Waiting for winner draw
        Revealing,  // Waiting for decryption
        Settled,    // Winner claimed
        Cancelled   // Round cancelled
    }

    // ==================== Struct Definitions ====================

    /// @notice Entry structure
    struct Entry {
        bool exists;
        bool claimed;
        euint8 number1;      // Encrypted first digit (1-9)
        euint8 number2;      // Encrypted second digit (1-9)
        euint8 number3;      // Encrypted third digit (1-9)
        uint256 entryTime;
    }

    /// @notice Round structure
    struct Round {
        bool exists;
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 endTime;
        uint256 prizePool;
        RoundStatus status;
        uint256 participantCount;
        address[] participants;
        address winner;
        uint8 winningNumber1;
        uint8 winningNumber2;
        uint8 winningNumber3;
        bool numbersRevealed;
    }

    // ==================== State Variables ====================

    // Round storage
    mapping(uint256 => Round) private rounds;
    mapping(uint256 => mapping(address => Entry)) private entries;

    uint256[] private roundIds;
    uint256 public roundCount;

    // Admin
    address public admin;

    // Constant configuration
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    uint256 public constant MAX_ENTRY_FEE = 1 ether;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 7 days;
    uint8 public constant MIN_NUMBER = 1;
    uint8 public constant MAX_NUMBER = 9;

    // ==================== Events ====================

    event RoundCreated(
        uint256 indexed roundId,
        string name,
        uint256 entryFee,
        uint256 endTime
    );
    event EntrySubmitted(uint256 indexed roundId, address indexed player);
    event EntryUpdated(uint256 indexed roundId, address indexed player);
    event WinnerDrawn(uint256 indexed roundId, address indexed winner);
    event NumbersMarkedForReveal(uint256 indexed roundId);
    event RoundSettled(uint256 indexed roundId, address indexed winner, uint256 prize);
    event RoundCancelled(uint256 indexed roundId);
    event PrizeClaimed(uint256 indexed roundId, address indexed winner, uint256 amount);
    event RefundClaimed(uint256 indexed roundId, address indexed player, uint256 amount);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // ==================== Errors ====================

    error NotAdmin();
    error RoundNotFound();
    error RoundNotActive();
    error RoundNotEnded();
    error RoundEnded();
    error AlreadyEntered();
    error NotEntered();
    error InvalidFee();
    error InvalidDuration();
    error InvalidNumber();
    error NotWinner();
    error AlreadyClaimed();
    error NotRefundable();
    error TransferFailed();
    error NoParticipants();
    error AlreadyRevealed();
    error NotRevealed();
    error ZeroAddress();

    // ==================== Modifiers ====================

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ==================== Constructor ====================

    constructor() {
        admin = msg.sender;
    }

    // ==================== Admin Functions ====================

    /// @notice Transfer admin role
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminTransferred(oldAdmin, newAdmin);
    }

    // ==================== Round Management ====================

    /**
     * @notice Create a new round
     * @param name Round name/description
     * @param entryFee Entry fee in wei
     * @param duration Duration in seconds
     * @return roundId ID of the newly created round
     */
    function createRound(
        string calldata name,
        uint256 entryFee,
        uint256 duration
    ) external onlyAdmin returns (uint256) {
        // Parameter validation
        if (entryFee < MIN_ENTRY_FEE || entryFee > MAX_ENTRY_FEE) {
            revert InvalidFee();
        }
        if (duration < MIN_DURATION || duration > MAX_DURATION) {
            revert InvalidDuration();
        }

        uint256 roundId = roundCount++;
        Round storage round = rounds[roundId];

        // Initialize round
        round.exists = true;
        round.id = roundId;
        round.name = name;
        round.entryFee = entryFee;
        round.endTime = block.timestamp + duration;
        round.status = RoundStatus.Active;

        roundIds.push(roundId);

        emit RoundCreated(roundId, name, entryFee, round.endTime);

        return roundId;
    }

    /**
     * @notice Submit encrypted numbers
     * @param roundId Round ID
     * @param encNum1 Encrypted first number (1-9)
     * @param encNum2 Encrypted second number (1-9)
     * @param encNum3 Encrypted third number (1-9)
     * @param proof Zero-knowledge proof
     */
    function submitEntry(
        uint256 roundId,
        externalEuint8 encNum1,
        externalEuint8 encNum2,
        externalEuint8 encNum3,
        bytes calldata proof
    ) external payable {
        Round storage round = rounds[roundId];

        // State validation
        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Active) revert RoundNotActive();
        if (block.timestamp >= round.endTime) revert RoundEnded();
        if (msg.value != round.entryFee) revert InvalidFee();

        Entry storage entry = entries[roundId][msg.sender];
        if (entry.exists) revert AlreadyEntered();

        // Parse encrypted numbers
        euint8 num1 = FHE.fromExternal(encNum1, proof);
        euint8 num2 = FHE.fromExternal(encNum2, proof);
        euint8 num3 = FHE.fromExternal(encNum3, proof);

        // Store entry
        entry.exists = true;
        entry.claimed = false;
        entry.number1 = num1;
        entry.number2 = num2;
        entry.number3 = num3;
        entry.entryTime = block.timestamp;

        // Allow contract to access encrypted values
        FHE.allowThis(num1);
        FHE.allowThis(num2);
        FHE.allowThis(num3);

        // Allow user to view their own numbers
        FHE.allow(num1, msg.sender);
        FHE.allow(num2, msg.sender);
        FHE.allow(num3, msg.sender);

        // Update round
        round.prizePool += msg.value;
        round.participants.push(msg.sender);
        round.participantCount++;

        emit EntrySubmitted(roundId, msg.sender);
    }

    /**
     * @notice Update encrypted numbers (before round ends)
     * @param roundId Round ID
     * @param encNum1 New encrypted first number
     * @param encNum2 New encrypted second number
     * @param encNum3 New encrypted third number
     * @param proof Zero-knowledge proof
     */
    function updateEntry(
        uint256 roundId,
        externalEuint8 encNum1,
        externalEuint8 encNum2,
        externalEuint8 encNum3,
        bytes calldata proof
    ) external {
        Round storage round = rounds[roundId];

        // State validation
        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Active) revert RoundNotActive();
        if (block.timestamp >= round.endTime) revert RoundEnded();

        Entry storage entry = entries[roundId][msg.sender];
        if (!entry.exists) revert NotEntered();

        // Parse new encrypted numbers
        euint8 num1 = FHE.fromExternal(encNum1, proof);
        euint8 num2 = FHE.fromExternal(encNum2, proof);
        euint8 num3 = FHE.fromExternal(encNum3, proof);

        // Update entry
        entry.number1 = num1;
        entry.number2 = num2;
        entry.number3 = num3;

        // Allow contract to access encrypted values
        FHE.allowThis(num1);
        FHE.allowThis(num2);
        FHE.allowThis(num3);

        // Allow user to view their own numbers
        FHE.allow(num1, msg.sender);
        FHE.allow(num2, msg.sender);
        FHE.allow(num3, msg.sender);

        emit EntryUpdated(roundId, msg.sender);
    }

    /**
     * @notice Draw winner using on-chain randomness
     * @param roundId Round ID
     */
    function drawWinner(uint256 roundId) external {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Active) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert RoundNotEnded();
        if (round.participantCount == 0) revert NoParticipants();

        // Generate winning numbers using blockhash (1-9)
        uint256 randomSeed = uint256(blockhash(block.number - 1));
        round.winningNumber1 = uint8((randomSeed % 9) + 1);
        round.winningNumber2 = uint8(((randomSeed >> 8) % 9) + 1);
        round.winningNumber3 = uint8(((randomSeed >> 16) % 9) + 1);

        // Select winner from participants using randomness
        uint256 winnerIndex = randomSeed % round.participantCount;
        round.winner = round.participants[winnerIndex];
        round.status = RoundStatus.Drawing;

        emit WinnerDrawn(roundId, round.winner);
    }

    /**
     * @notice Mark winner's numbers for reveal
     * @param roundId Round ID
     */
    function markNumbersForReveal(uint256 roundId) external {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Drawing) revert RoundNotActive();
        if (round.numbersRevealed) revert AlreadyRevealed();

        Entry storage winnerEntry = entries[roundId][round.winner];

        // Mark winner's numbers for public decryption
        winnerEntry.number1 = FHE.makePubliclyDecryptable(winnerEntry.number1);
        winnerEntry.number2 = FHE.makePubliclyDecryptable(winnerEntry.number2);
        winnerEntry.number3 = FHE.makePubliclyDecryptable(winnerEntry.number3);

        round.numbersRevealed = true;
        round.status = RoundStatus.Revealing;

        emit NumbersMarkedForReveal(roundId);
    }

    /**
     * @notice Finalize round with revealed numbers
     * @param roundId Round ID
     * @param revealedNum1 Revealed first number
     * @param revealedNum2 Revealed second number
     * @param revealedNum3 Revealed third number
     */
    function finalizeRound(
        uint256 roundId,
        uint8 revealedNum1,
        uint8 revealedNum2,
        uint8 revealedNum3
    ) external {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Revealing) revert NotRevealed();

        // Store revealed numbers (for display purposes)
        round.winningNumber1 = revealedNum1;
        round.winningNumber2 = revealedNum2;
        round.winningNumber3 = revealedNum3;
        round.status = RoundStatus.Settled;

        emit RoundSettled(roundId, round.winner, round.prizePool);
    }

    /**
     * @notice Winner claims prize
     * @param roundId Round ID
     */
    function claimPrize(uint256 roundId) external {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Settled) revert NotRevealed();
        if (msg.sender != round.winner) revert NotWinner();

        Entry storage entry = entries[roundId][msg.sender];
        if (entry.claimed) revert AlreadyClaimed();

        entry.claimed = true;
        uint256 prize = round.prizePool;

        (bool success, ) = msg.sender.call{ value: prize }("");
        if (!success) revert TransferFailed();

        emit PrizeClaimed(roundId, msg.sender, prize);
    }

    /**
     * @notice Cancel a round (admin only, before drawing)
     * @param roundId Round ID
     */
    function cancelRound(uint256 roundId) external onlyAdmin {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Active) revert RoundNotActive();

        round.status = RoundStatus.Cancelled;
        emit RoundCancelled(roundId);
    }

    /**
     * @notice Claim refund for cancelled round
     * @param roundId Round ID
     */
    function claimRefund(uint256 roundId) external {
        Round storage round = rounds[roundId];

        if (!round.exists) revert RoundNotFound();
        if (round.status != RoundStatus.Cancelled) revert NotRefundable();

        Entry storage entry = entries[roundId][msg.sender];
        if (!entry.exists) revert NotEntered();
        if (entry.claimed) revert AlreadyClaimed();

        entry.claimed = true;
        uint256 refund = round.entryFee;

        (bool success, ) = msg.sender.call{ value: refund }("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(roundId, msg.sender, refund);
    }

    // ==================== Query Functions ====================

    /// @notice Get all round IDs
    function listRounds() external view returns (uint256[] memory) {
        return roundIds;
    }

    /// @notice Get round information
    function getRound(uint256 roundId)
        external
        view
        returns (
            string memory name,
            uint256 entryFee,
            uint256 endTime,
            uint256 prizePool,
            RoundStatus status,
            uint256 participantCount,
            address winner,
            uint8 winningNumber1,
            uint8 winningNumber2,
            uint8 winningNumber3,
            bool numbersRevealed
        )
    {
        Round storage r = rounds[roundId];
        if (!r.exists) revert RoundNotFound();

        return (
            r.name,
            r.entryFee,
            r.endTime,
            r.prizePool,
            r.status,
            r.participantCount,
            r.winner,
            r.winningNumber1,
            r.winningNumber2,
            r.winningNumber3,
            r.numbersRevealed
        );
    }

    /// @notice Get round participants
    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        if (!rounds[roundId].exists) revert RoundNotFound();
        return rounds[roundId].participants;
    }

    /// @notice Check if user has entered
    function hasEntered(uint256 roundId, address player) external view returns (bool) {
        return entries[roundId][player].exists;
    }

    /// @notice Check if user has claimed
    function hasClaimed(uint256 roundId, address player) external view returns (bool) {
        return entries[roundId][player].claimed;
    }

    /// @notice Get entry time for a player
    function getEntryTime(uint256 roundId, address player) external view returns (uint256) {
        Entry storage entry = entries[roundId][player];
        if (!entry.exists) revert NotEntered();
        return entry.entryTime;
    }

    /// @notice Check if round exists
    function roundExists(uint256 roundId) external view returns (bool) {
        return rounds[roundId].exists;
    }
}
