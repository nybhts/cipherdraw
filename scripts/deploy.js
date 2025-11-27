const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔐 Deploying CipherDraw Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const CipherDraw = await ethers.getContractFactory("CipherDraw");
  console.log("Deploying contract...");

  const cipherDraw = await CipherDraw.deploy();
  await cipherDraw.waitForDeployment();

  const address = await cipherDraw.getAddress();
  console.log("\n✅ CipherDraw deployed to:", address);

  // Save deployment info
  const deployment = {
    contractAddress: address,
    deployer: deployer.address,
    network: network.name,
    chainId: network.config.chainId,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deployment, null, 2));
  console.log("\n📄 Deployment info saved to deployment.json");

  console.log("\n📋 Configuration:");
  console.log("==================");
  console.log(`Contract Address: ${address}`);
  console.log(`Min Entry Fee: 0.001 ETH`);
  console.log(`Max Entry Fee: 1 ETH`);
  console.log(`Min Duration: 1 hour`);
  console.log(`Max Duration: 7 days`);
  console.log(`Number Range: 1-9`);

  console.log("\n🔧 Frontend Config:");
  console.log(`export const CIPHER_DRAW_ADDRESS = "${address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
