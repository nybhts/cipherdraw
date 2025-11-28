const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔐 Seeding CipherDraw with prize draw rounds...\n");

  // Read deployment information
  let contractAddress;
  if (process.env.CIPHER_DRAW_ADDRESS) {
    contractAddress = process.env.CIPHER_DRAW_ADDRESS;
  } else if (fs.existsSync("deployment.json")) {
    const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
    contractAddress = deployment.contractAddress;
  } else {
    console.error("No contract address found. Please deploy first or set CIPHER_DRAW_ADDRESS env variable.");
    process.exit(1);
  }

  console.log("Contract Address:", contractAddress);

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log("Network:", network.name, "\n");

  // Get contract instance
  const CipherDraw = await ethers.getContractFactory("CipherDraw");
  const draw = CipherDraw.attach(contractAddress);

  // Verify signer is admin
  const admin = await draw.admin();
  if (admin.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("Signer is not the admin. Only admin can create rounds.");
    process.exit(1);
  }

  console.log("Admin verified\n");

  // Define prize draw rounds
  const rounds = [
    {
      name: "Daily Lucky Draw",
      entryFee: ethers.parseEther("0.001"),
      duration: 24 * 60 * 60 // 1 day
    },
    {
      name: "Weekly Jackpot",
      entryFee: ethers.parseEther("0.005"),
      duration: 7 * 24 * 60 * 60 // 7 days
    },
    {
      name: "Express Draw",
      entryFee: ethers.parseEther("0.002"),
      duration: 2 * 60 * 60 // 2 hours
    },
    {
      name: "Premium Pool",
      entryFee: ethers.parseEther("0.01"),
      duration: 3 * 24 * 60 * 60 // 3 days
    },
    {
      name: "Midnight Special",
      entryFee: ethers.parseEther("0.003"),
      duration: 12 * 60 * 60 // 12 hours
    }
  ];

  console.log("Creating draw rounds...\n");

  const createdRounds = [];

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    try {
      console.log(`Creating round ${i + 1}/${rounds.length}: ${round.name}`);
      console.log(`  Entry Fee: ${ethers.formatEther(round.entryFee)} ETH`);
      console.log(`  Duration: ${round.duration / 3600} hours`);

      const tx = await draw.createRound(
        round.name,
        round.entryFee,
        round.duration
      );
      const receipt = await tx.wait();

      // Parse round ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = draw.interface.parseLog(log);
          return parsed && parsed.name === "RoundCreated";
        } catch {
          return false;
        }
      });

      let roundId = i;
      if (event) {
        const parsed = draw.interface.parseLog(event);
        roundId = parsed.args.roundId;
      }

      console.log(`  Round ID: ${roundId}`);
      console.log(`  Tx: ${receipt.hash}\n`);

      createdRounds.push({
        id: Number(roundId),
        name: round.name,
        entryFee: ethers.formatEther(round.entryFee),
        duration: round.duration
      });
    } catch (error) {
      console.error(`  Failed to create round: ${error.message}\n`);
    }
  }

  // Print summary
  console.log("==========================================");
  console.log("               SUMMARY");
  console.log("==========================================\n");

  const roundCount = await draw.roundCount();
  console.log(`Total Rounds Created: ${roundCount}`);
  console.log(`Network: ${network.name}`);
  console.log(`Contract: ${contractAddress}\n`);

  console.log("Created Rounds:");
  for (const r of createdRounds) {
    console.log(`  [${r.id}] ${r.name} - ${r.entryFee} ETH entry`);
  }

  console.log("\nHow to participate:");
  console.log("1. Pick 3 numbers (1-9) for your draw entry");
  console.log("2. Encrypt numbers using fhevmjs");
  console.log("3. Call submitEntry() with encrypted numbers + entry fee");
  console.log("4. Wait for round to end and winner to be drawn");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
