const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("\n=== Deploying SimpleCreationRegistry ===");
  const SimpleCreationRegistry = await ethers.getContractFactory("SimpleCreationRegistry");
  const simpleCreationRegistry = await SimpleCreationRegistry.deploy();
  await simpleCreationRegistry.waitForDeployment();
  const contractAddress = await simpleCreationRegistry.getAddress();
  console.log("SimpleCreationRegistry deployed to:", contractAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("SimpleCreationRegistry:", contractAddress);

  const addresses = {
    SimpleCreationRegistry: contractAddress,
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to deployed-addresses.json");

  console.log("\n=== Frontend Configuration ===");
  console.log(`Update your client code with this address: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

