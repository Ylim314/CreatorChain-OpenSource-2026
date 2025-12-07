/**
 * CreatorChain 完整合约部署脚本（设计原型 - 不实际使用）
 * 
 * ⚠️ 重要说明：
 * - 此脚本为设计原型，不实际部署
 * - CreatorToken、LicenseManager、CreatorDAO 为设计原型，不部署
 * - 实际项目仅部署 CreatorNFT（版权确权）
 * - 本项目采用链下积分系统，不涉及任何虚拟货币
 * 
 * 实际部署请使用：
 * npx hardhat run scripts/deploy-simple.js --network localhost
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 开始部署 CreatorChain 智能合约体系...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 部署账户:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");
    
    const deployedContracts = {};
    
    // ============ 1. 部署 CreatorToken ============
    console.log("━".repeat(50));
    console.log("📦 [1/4] 部署 CreatorToken (CRT)...");
    
    const CreatorToken = await hre.ethers.getContractFactory("CreatorToken");
    const creatorToken = await CreatorToken.deploy();
    await creatorToken.waitForDeployment();
    
    const tokenAddress = await creatorToken.getAddress();
    deployedContracts.CreatorToken = tokenAddress;
    
    console.log("✅ CreatorToken 部署成功!");
    console.log("   地址:", tokenAddress);
    console.log("   代币名称: CreatorToken (CRT)");
    console.log("   初始供应量: 100,000,000 CRT");
    
    // ============ 2. 部署 CreatorNFT ============
    console.log("\n" + "━".repeat(50));
    console.log("📦 [2/4] 部署 CreatorNFT...");
    
    const CreatorNFT = await hre.ethers.getContractFactory("CreatorNFT");
    const creatorNFT = await CreatorNFT.deploy();
    await creatorNFT.waitForDeployment();
    
    const nftAddress = await creatorNFT.getAddress();
    deployedContracts.CreatorNFT = nftAddress;
    
    console.log("✅ CreatorNFT 部署成功!");
    console.log("   地址:", nftAddress);
    console.log("   NFT名称: CreatorChain NFT (CCNFT)");
    
    // ============ 3. 部署 LicenseManager ============
    console.log("\n" + "━".repeat(50));
    console.log("📦 [3/4] 部署 LicenseManager...");
    
    const LicenseManager = await hre.ethers.getContractFactory("LicenseManager");
    const licenseManager = await LicenseManager.deploy(
        tokenAddress,           // 支付代币地址
        deployer.address        // 平台钱包地址
    );
    await licenseManager.waitForDeployment();
    
    const licenseAddress = await licenseManager.getAddress();
    deployedContracts.LicenseManager = licenseAddress;
    
    console.log("✅ LicenseManager 部署成功!");
    console.log("   地址:", licenseAddress);
    console.log("   支付代币: CRT");
    console.log("   平台费率: 2.5%");
    
    // ============ 4. 部署 CreatorDAO ============
    console.log("\n" + "━".repeat(50));
    console.log("📦 [4/4] 部署 CreatorDAO...");
    
    const CreatorDAO = await hre.ethers.getContractFactory("CreatorDAO");
    const creatorDAO = await CreatorDAO.deploy(
        tokenAddress,           // 治理代币地址
        deployer.address        // 国库地址
    );
    await creatorDAO.waitForDeployment();
    
    const daoAddress = await creatorDAO.getAddress();
    deployedContracts.CreatorDAO = daoAddress;
    
    console.log("✅ CreatorDAO 部署成功!");
    console.log("   地址:", daoAddress);
    console.log("   治理代币: CRT");
    console.log("   提案门槛: 10,000 CRT");
    console.log("   投票期限: 7天");
    
    // ============ 5. 配置合约关系 ============
    console.log("\n" + "━".repeat(50));
    console.log("⚙️  配置合约关系...");
    
    // 为 LicenseManager 授予 MINTER 角色（用于发放奖励）
    const MINTER_ROLE = await creatorToken.MINTER_ROLE();
    await creatorToken.grantRole(MINTER_ROLE, licenseAddress);
    console.log("   ✓ LicenseManager 获得 MINTER_ROLE");
    
    // 为 DAO 授予 GOVERNANCE 角色
    const GOVERNANCE_ROLE = await creatorToken.GOVERNANCE_ROLE();
    await creatorToken.grantRole(GOVERNANCE_ROLE, daoAddress);
    console.log("   ✓ CreatorDAO 获得 GOVERNANCE_ROLE");
    
    // ============ 6. 保存部署信息 ============
    console.log("\n" + "━".repeat(50));
    console.log("💾 保存部署信息...");
    
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: deployedContracts,
        configuration: {
            platformFee: "2.5%",
            defaultRoyalty: "5%",
            votingPeriod: "7 days",
            proposalThreshold: "10000 CRT"
        }
    };
    
    const outputPath = path.join(__dirname, "..", "deployed-contracts.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("   保存至:", outputPath);
    
    // ============ 输出汇总 ============
    console.log("\n" + "═".repeat(50));
    console.log("🎉 CreatorChain 合约部署完成!");
    console.log("═".repeat(50));
    console.log("\n📋 合约地址汇总:");
    console.log("┌" + "─".repeat(48) + "┐");
    console.log("│ CreatorToken:    ", tokenAddress, "│");
    console.log("│ CreatorNFT:      ", nftAddress, "│");
    console.log("│ LicenseManager:  ", licenseAddress, "│");
    console.log("│ CreatorDAO:      ", daoAddress, "│");
    console.log("└" + "─".repeat(48) + "┘");
    
    console.log("\n📝 前端配置 (复制到 client/src/config/contracts.js):");
    console.log("─".repeat(50));
    console.log(`export const CONTRACT_ADDRESSES = {
  ${hre.network.name === 'localhost' ? '1337' : (await hre.ethers.provider.getNetwork()).chainId}: {
    CreatorToken: '${tokenAddress}',
    CreatorNFT: '${nftAddress}',
    LicenseManager: '${licenseAddress}',
    CreatorDAO: '${daoAddress}'
  }
};`);
    
    console.log("\n✨ 部署完成! 现在可以开始使用 CreatorChain 了!");
    
    return deployedContracts;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失败:", error);
        process.exit(1);
    });

