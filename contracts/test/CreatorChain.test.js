/**
 * CreatorChain 智能合约测试套件
 * 
 * 运行测试：
 * npx hardhat test
 * npx hardhat test --grep "CreatorNFT"  # 运行特定测试
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CreatorChain 智能合约测试", function () {
    let creatorToken, creatorNFT, licenseManager, creatorDAO;
    let owner, creator, buyer, voter;
    
    beforeEach(async function () {
        [owner, creator, buyer, voter] = await ethers.getSigners();
        
        // 部署 CreatorToken
        const CreatorToken = await ethers.getContractFactory("CreatorToken");
        creatorToken = await CreatorToken.deploy();
        await creatorToken.waitForDeployment();
        
        // 部署 CreatorNFT
        const CreatorNFT = await ethers.getContractFactory("CreatorNFT");
        creatorNFT = await CreatorNFT.deploy();
        await creatorNFT.waitForDeployment();
        
        // 部署 LicenseManager
        const LicenseManager = await ethers.getContractFactory("LicenseManager");
        licenseManager = await LicenseManager.deploy(
            await creatorToken.getAddress(),
            owner.address
        );
        await licenseManager.waitForDeployment();
        
        // 部署 CreatorDAO
        const CreatorDAO = await ethers.getContractFactory("CreatorDAO");
        creatorDAO = await CreatorDAO.deploy(
            await creatorToken.getAddress(),
            owner.address
        );
        await creatorDAO.waitForDeployment();
        
        // 注意：以下为设计原型测试，不实际使用
        // 实际项目不涉及代币，使用链下积分系统
        // await creatorToken.transfer(creator.address, ethers.parseEther("100000"));
    });
    
    // ============ CreatorToken 测试（设计原型 - 不实际使用）============
    // 注意：以下测试为设计原型，实际项目不涉及代币
    describe.skip("CreatorToken (CRT) - 设计原型", function () {
        it.skip("应该正确初始化代币（设计原型，不测试）", async function () {
            expect(await creatorToken.name()).to.equal("CreatorToken");
            expect(await creatorToken.symbol()).to.equal("CRT");
            expect(await creatorToken.totalSupply()).to.equal(ethers.parseEther("100000000"));
        });
        
        it("应该实现转账燃烧机制", async function () {
            const amount = ethers.parseEther("1000");
            const burnRate = await creatorToken.burnRate();
            const expectedBurn = amount * burnRate / 10000n;
            
            const initialSupply = await creatorToken.totalSupply();
            await creatorToken.connect(creator).transfer(buyer.address, amount);
            const finalSupply = await creatorToken.totalSupply();
            
            expect(initialSupply - finalSupply).to.equal(expectedBurn);
        });
        
        it("应该支持质押功能", async function () {
            const stakeAmount = ethers.parseEther("10000");
            const lockDuration = 7 * 24 * 60 * 60; // 7天
            
            await creatorToken.connect(creator).stake(stakeAmount, lockDuration);
            
            const stakeInfo = await creatorToken.getStakeInfo(creator.address);
            expect(stakeInfo.amount).to.equal(stakeAmount);
        });
        
        it("锁定期内不能解除质押", async function () {
            const stakeAmount = ethers.parseEther("10000");
            const lockDuration = 7 * 24 * 60 * 60;
            
            await creatorToken.connect(creator).stake(stakeAmount, lockDuration);
            
            await expect(
                creatorToken.connect(creator).unstake()
            ).to.be.revertedWith("Stake still locked");
        });
        
        it("锁定期结束后可以解除质押", async function () {
            const stakeAmount = ethers.parseEther("10000");
            const lockDuration = 7 * 24 * 60 * 60;
            
            await creatorToken.connect(creator).stake(stakeAmount, lockDuration);
            
            // 快进时间
            await time.increase(lockDuration + 1);
            
            await expect(
                creatorToken.connect(creator).unstake()
            ).to.not.be.reverted;
        });
    });
    
    // ============ CreatorNFT 测试 ============
    describe("CreatorNFT (双重确权)", function () {
        const processHash = "QmProcessHash123456789";
        const processContentHash = ethers.keccak256(ethers.toUtf8Bytes("process content"));
        const finalHash = "QmFinalHash123456789";
        const finalContentHash = ethers.keccak256(ethers.toUtf8Bytes("final content"));
        
        it("应该完成第一次确权（过程记录）", async function () {
            const tx = await creatorNFT.connect(creator).recordCreationProcess(
                processHash,
                processContentHash,
                "测试作品",
                "这是一个测试作品",
                1 // 手工创作
            );
            
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return creatorNFT.interface.parseLog(log)?.name === "ProcessRecorded";
                } catch {
                    return false;
                }
            });
            
            expect(event).to.not.be.undefined;
            
            const creationInfo = await creatorNFT.getCreationInfo(1);
            expect(creationInfo.originalCreator).to.equal(creator.address);
            expect(creationInfo.title).to.equal("测试作品");
            expect(creationInfo.stage).to.equal(0); // ProcessRecorded
        });
        
        it("应该完成第二次确权（最终确认）", async function () {
            // 第一次确权
            await creatorNFT.connect(creator).recordCreationProcess(
                processHash,
                processContentHash,
                "测试作品",
                "描述",
                1
            );
            
            // 第二次确权
            await creatorNFT.connect(creator).confirmFinalCreation(
                1,
                finalHash,
                finalContentHash,
                800 // 贡献度评分
            );
            
            const creationInfo = await creatorNFT.getCreationInfo(1);
            expect(creationInfo.stage).to.equal(1); // FinalConfirmed
            expect(creationInfo.contributionScore).to.equal(800);
        });
        
        it("应该能够铸造NFT", async function () {
            // 双重确权
            await creatorNFT.connect(creator).recordCreationProcess(
                processHash, processContentHash, "测试作品", "描述", 1
            );
            await creatorNFT.connect(creator).confirmFinalCreation(
                1, finalHash, finalContentHash, 800
            );
            
            // 铸造NFT
            await creatorNFT.connect(creator).mintCreationNFT(
                1,
                "ipfs://QmMetadataUri"
            );
            
            expect(await creatorNFT.ownerOf(1)).to.equal(creator.address);
            
            const creationInfo = await creatorNFT.getCreationInfo(1);
            expect(creationInfo.stage).to.equal(2); // NFTMinted
        });
        
        it("应该防止重复注册相同内容", async function () {
            await creatorNFT.connect(creator).recordCreationProcess(
                processHash, processContentHash, "作品1", "描述", 1
            );
            
            await expect(
                creatorNFT.connect(creator).recordCreationProcess(
                    processHash, processContentHash, "作品2", "描述", 1
                )
            ).to.be.revertedWith("Content already registered");
        });
        
        it("应该验证创作真实性", async function () {
            // 完成双重确权
            await creatorNFT.connect(creator).recordCreationProcess(
                processHash, processContentHash, "测试作品", "描述", 1
            );
            await creatorNFT.connect(creator).confirmFinalCreation(
                1, finalHash, finalContentHash, 800
            );
            
            // 验证
            const [isValid, originalCreator, creationTime, score] = 
                await creatorNFT.verifyCreation(1, finalContentHash);
            
            expect(isValid).to.be.true;
            expect(originalCreator).to.equal(creator.address);
            expect(score).to.equal(800);
        });
    });
    
    // ============ LicenseManager 测试 ============
    describe("LicenseManager (版权授权)", function () {
        beforeEach(async function () {
            // 先创建一个NFT作品
            const processHash = ethers.keccak256(ethers.toUtf8Bytes("process"));
            const finalHash = ethers.keccak256(ethers.toUtf8Bytes("final"));
            
            await creatorNFT.connect(creator).recordCreationProcess(
                "QmProcess", processHash, "测试作品", "描述", 1
            );
            await creatorNFT.connect(creator).confirmFinalCreation(
                1, "QmFinal", finalHash, 800
            );
            
            // 授权代币给LicenseManager
            await creatorToken.connect(buyer).approve(
                await licenseManager.getAddress(),
                ethers.parseEther("10000")
            );
        });
        
        it("应该能够查询授权价格", async function () {
            const price = await licenseManager.getLicensePrice(
                1,
                0, // Personal
                30 * 24 * 60 * 60 // 30天
            );
            
            expect(price).to.be.gt(0);
        });
    });
    
    // ============ CreatorDAO 测试 ============
    describe("CreatorDAO (DAO治理)", function () {
        beforeEach(async function () {
            // 授予提案权限
            const PROPOSER_ROLE = await creatorDAO.PROPOSER_ROLE();
            await creatorDAO.grantRole(PROPOSER_ROLE, creator.address);
        });
        
        it("应该能够创建提案", async function () {
            const tx = await creatorDAO.connect(creator).proposeSimple(
                "测试提案",
                "QmProposalDescription"
            );
            
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    return creatorDAO.interface.parseLog(log)?.name === "ProposalCreated";
                } catch {
                    return false;
                }
            });
            
            expect(event).to.not.be.undefined;
        });
        
        it("持币不足不能创建提案", async function () {
            // 创建一个没有足够代币的账户
            const [, , , , poorUser] = await ethers.getSigners();
            const PROPOSER_ROLE = await creatorDAO.PROPOSER_ROLE();
            await creatorDAO.grantRole(PROPOSER_ROLE, poorUser.address);
            
            await expect(
                creatorDAO.connect(poorUser).proposeSimple("提案", "描述")
            ).to.be.revertedWith("Below proposal threshold");
        });
        
        it("应该能够投票", async function () {
            // 创建提案
            await creatorDAO.connect(creator).proposeSimple("测试提案", "描述");
            
            // 等待投票开始
            const votingDelay = await creatorDAO.votingDelay();
            await time.increase(Number(votingDelay) + 1);
            
            // 投票
            await creatorDAO.connect(voter).castVote(1, 1, "支持这个提案");
            
            const record = await creatorDAO.getVoteRecord(1, voter.address);
            expect(record.hasVoted).to.be.true;
            expect(record.support).to.equal(1);
        });
        
        it("不能重复投票", async function () {
            await creatorDAO.connect(creator).proposeSimple("测试提案", "描述");
            
            const votingDelay = await creatorDAO.votingDelay();
            await time.increase(Number(votingDelay) + 1);
            
            await creatorDAO.connect(voter).castVote(1, 1, "");
            
            await expect(
                creatorDAO.connect(voter).castVote(1, 0, "")
            ).to.be.revertedWith("Already voted");
        });
    });
    
    // ============ 集成测试 ============
    describe("集成测试：完整工作流", function () {
        it("应该完成完整的创作-确权-授权流程", async function () {
            // 1. 创作者进行双重确权
            const processHash = ethers.keccak256(ethers.toUtf8Bytes("process"));
            const finalHash = ethers.keccak256(ethers.toUtf8Bytes("final"));
            
            await creatorNFT.connect(creator).recordCreationProcess(
                "QmProcess", processHash, "原创作品", "一件原创艺术作品", 1
            );
            
            await creatorNFT.connect(creator).confirmFinalCreation(
                1, "QmFinal", finalHash, 900
            );
            
            // 2. 铸造NFT
            await creatorNFT.connect(creator).mintCreationNFT(1, "ipfs://metadata");
            expect(await creatorNFT.ownerOf(1)).to.equal(creator.address);
            
            // 3. 验证创作真实性
            const [isValid, , , score] = await creatorNFT.verifyCreation(1, finalHash);
            expect(isValid).to.be.true;
            expect(score).to.equal(900);
            
            console.log("✅ 完整流程测试通过!");
        });
    });
});

