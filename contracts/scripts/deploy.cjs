const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  console.log("\n=== Deploying ProofOfCreation ===");
  const ProofOfCreation = await ethers.getContractFactory("ProofOfCreation");
  const proofOfCreation = await ProofOfCreation.deploy();
  await proofOfCreation.deployed();
  console.log("ProofOfCreation deployed to:", proofOfCreation.address);

  console.log("\n=== Deploying CreationRegistry ===");
  const CreationRegistry = await ethers.getContractFactory("CreationRegistry");
  const creationRegistry = await CreationRegistry.deploy();
  await creationRegistry.deployed();
  console.log("CreationRegistry deployed to:", creationRegistry.address);

  console.log("\n=== Deploying CreatorDAO ===");
  const CreatorDAO = await ethers.getContractFactory("CreatorDAO");
  const creatorDAO = await CreatorDAO.deploy();
  await creatorDAO.deployed();
  console.log("CreatorDAO deployed to:", creatorDAO.address);

  console.log("\n=== Deploying LicenseManager ===");
  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy();
  await licenseManager.deployed();
  console.log("LicenseManager deployed to:", licenseManager.address);

  console.log("\n=== Deployment Summary ===");
  console.log("ProofOfCreation:", proofOfCreation.address);
  console.log("CreationRegistry:", creationRegistry.address);
  console.log("CreatorDAO:", creatorDAO.address);
  console.log("LicenseManager:", licenseManager.address);

  const addresses = {
    ProofOfCreation: proofOfCreation.address,
    CreationRegistry: creationRegistry.address,
    CreatorDAO: creatorDAO.address,
    LicenseManager: licenseManager.address,
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

