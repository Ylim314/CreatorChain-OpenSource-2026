import hre from "hardhat";

async function main() {
  console.log("🚀 Starting CreatorChain contract deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy CreatorChainRegistry
  console.log("\n📦 Deploying CreatorChainRegistry...");
  const CreatorChainRegistry = await hre.ethers.getContractFactory("CreatorChainRegistry");
  const registry = await CreatorChainRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("✅ CreatorChainRegistry deployed to:", registryAddress);

  // Grant roles to deployer
  console.log("\n🔐 Setting up roles...");
  const CREATOR_ROLE = await registry.CREATOR_ROLE();
  const VERIFIER_ROLE = await registry.VERIFIER_ROLE();

  // Grant creator and verifier roles to deployer for testing
  await registry.grantRole(CREATOR_ROLE, deployer.address);
  await registry.grantRole(VERIFIER_ROLE, deployer.address);
  console.log("✅ Granted CREATOR_ROLE and VERIFIER_ROLE to deployer");

  // Deploy CreationMarketplace if it exists
  let marketplaceAddress = null;
  try {
    console.log("\n📦 Deploying CreationMarketplace...");
    const CreationMarketplace = await hre.ethers.getContractFactory("CreationMarketplace");
    const marketplace = await CreationMarketplace.deploy(registryAddress);
    await marketplace.waitForDeployment();

    marketplaceAddress = await marketplace.getAddress();
    console.log("✅ CreationMarketplace deployed to:", marketplaceAddress);

    // Set marketplace address in registry
    await registry.setContractAddress("CreationMarketplace", marketplaceAddress);
    console.log("✅ Marketplace address registered in registry");
  } catch (error) {
    console.log("⚠️ CreationMarketplace not found or failed to deploy:", error.message);
  }

  // Output deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("==================");
  console.log("CreatorChainRegistry:", registryAddress);
  if (marketplaceAddress) {
    console.log("CreationMarketplace:", marketplaceAddress);
  }
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await hre.ethers.provider.getNetwork()).name);

  // Save deployment addresses
  const deploymentInfo = {
    registryAddress,
    marketplaceAddress,
    deployerAddress: deployer.address,
    network: (await hre.ethers.provider.getNetwork()).name,
    deploymentTime: new Date().toISOString()
  };

  const fs = await import('fs');
  fs.writeFileSync('./deployment-addresses.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment addresses saved to deployment-addresses.json");

  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });