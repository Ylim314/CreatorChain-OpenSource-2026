const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 部署ProofOfCreation合约
  console.log("\n=== Deploying ProofOfCreation ===");
  const ProofOfCreation = await ethers.getContractFactory("ProofOfCreation");
  const proofOfCreation = await ProofOfCreation.deploy();
  await proofOfCreation.deployed();
  console.log("ProofOfCreation deployed to:", proofOfCreation.address);

  // 部署CreationRegistry合约
  console.log("\n=== Deploying CreationRegistry ===");
  const CreationRegistry = await ethers.getContractFactory("CreationRegistry");
  const creationRegistry = await CreationRegistry.deploy();
  await creationRegistry.deployed();
  console.log("CreationRegistry deployed to:", creationRegistry.address);

  // 部署CreatorDAO合约
  console.log("\n=== Deploying CreatorDAO ===");
  const CreatorDAO = await ethers.getContractFactory("CreatorDAO");
  const creatorDAO = await CreatorDAO.deploy();
  await creatorDAO.deployed();
  console.log("CreatorDAO deployed to:", creatorDAO.address);

  // 部署LicenseManager合约
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

  // 保存合约地址到文件
  const addresses = {
    ProofOfCreation: proofOfCreation.address,
    CreationRegistry: creationRegistry.address,
    CreatorDAO: creatorDAO.address,
    LicenseManager: licenseManager.address,
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });