const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 部署SimpleCreationRegistry合约
  console.log("\n=== Deploying SimpleCreationRegistry ===");
  const SimpleCreationRegistry = await ethers.getContractFactory("SimpleCreationRegistry");
  const simpleCreationRegistry = await SimpleCreationRegistry.deploy();
  await simpleCreationRegistry.waitForDeployment();
  const contractAddress = await simpleCreationRegistry.getAddress();
  console.log("SimpleCreationRegistry deployed to:", contractAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("SimpleCreationRegistry:", contractAddress);

  // 保存合约地址到文件
  const addresses = {
    SimpleCreationRegistry: contractAddress,
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to deployed-addresses.json");

  // 输出前端需要的地址
  console.log("\n=== Frontend Configuration ===");
  console.log(`Update your client code with this address: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });