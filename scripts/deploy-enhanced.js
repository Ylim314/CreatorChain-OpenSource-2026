// 部署脚本（增强版）
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("部署合约的账户:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  // 首先部署ProofOfCreation合约
  console.log("正在部署ProofOfCreation合约...");
  const ProofOfCreation = await ethers.getContractFactory("ProofOfCreation");
  const proofOfCreation = await ProofOfCreation.deploy();
  await proofOfCreation.deployed();
  console.log("ProofOfCreation部署地址:", proofOfCreation.address);

  // 部署MultiLayerRights合约
  console.log("正在部署MultiLayerRights合约...");
  const MultiLayerRights = await ethers.getContractFactory("MultiLayerRights");
  const multiLayerRights = await MultiLayerRights.deploy();
  await multiLayerRights.deployed();
  console.log("MultiLayerRights部署地址:", multiLayerRights.address);

  // 部署CreationRegistry合约（需要传入依赖合约地址）
  console.log("正在部署CreationRegistry合约...");
  const CreationRegistry = await ethers.getContractFactory("CreationRegistry");
  const creationRegistry = await CreationRegistry.deploy(
    proofOfCreation.address,
    multiLayerRights.address
  );
  await creationRegistry.deployed();
  console.log("CreationRegistry部署地址:", creationRegistry.address);

  // 部署LicenseManager合约
  console.log("正在部署LicenseManager合约...");
  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy(creationRegistry.address);
  await licenseManager.deployed();
  console.log("LicenseManager部署地址:", licenseManager.address);

  // 部署CreatorDAO合约
  console.log("正在部署CreatorDAO合约...");
  const CreatorDAO = await ethers.getContractFactory("CreatorDAO");
  const creatorDAO = await CreatorDAO.deploy(creationRegistry.address);
  await creatorDAO.deployed();
  console.log("CreatorDAO部署地址:", creatorDAO.address);

  // 部署CreationMarketplace合约
  console.log("正在部署CreationMarketplace合约...");
  const CreationMarketplace = await ethers.getContractFactory("CreationMarketplace_CN");
  const creationMarketplace = await CreationMarketplace.deploy(creationRegistry.address);
  await creationMarketplace.deployed();
  console.log("CreationMarketplace部署地址:", creationMarketplace.address);

  // 设置权限
  console.log("正在设置合约权限...");
  
  // 为MultiLayerRights合约设置RIGHTS_MANAGER_ROLE权限给CreationRegistry
  const RIGHTS_MANAGER_ROLE = await multiLayerRights.RIGHTS_MANAGER_ROLE();
  await multiLayerRights.grantRole(RIGHTS_MANAGER_ROLE, creationRegistry.address);
  console.log("已授权CreationRegistry管理版权");

  console.log("所有合约部署完成！");

  // 将部署地址保存到文件
  const fs = require("fs");
  const deploymentData = {
    proofOfCreation: proofOfCreation.address,
    multiLayerRights: multiLayerRights.address,
    creationRegistry: creationRegistry.address,
    licenseManager: licenseManager.address,
    creatorDAO: creatorDAO.address,
    creationMarketplace: creationMarketplace.address,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    network: await ethers.provider.getNetwork()
  };

  fs.writeFileSync(
    "./client/src/contracts/contract-addresses.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("部署地址已保存到 contract-addresses.json");
  
  // 显示部署总结
  console.log("\n=== 部署总结 ===");
  console.log("ProofOfCreation:", proofOfCreation.address);
  console.log("MultiLayerRights:", multiLayerRights.address);
  console.log("CreationRegistry:", creationRegistry.address);
  console.log("LicenseManager:", licenseManager.address);
  console.log("CreatorDAO:", creatorDAO.address);
  console.log("CreationMarketplace:", creationMarketplace.address);
  console.log("==================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
