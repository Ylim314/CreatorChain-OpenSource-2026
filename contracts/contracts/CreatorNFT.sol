// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreatorNFT
 * @author CreatorChain Team
 * @notice 创作版权NFT - 代表作品的数字版权证书
 * @dev ERC-721实现，特性包括：
 *      1. 双重确权机制（过程记录 + 最终确认）
 *      2. 版税机制（ERC-2981）
 *      3. 贡献度记录
 *      4. 可枚举（支持查询用户所有NFT）
 * 
 * 区块链技术要点：
 * - ERC-721标准 + 扩展
 * - 链上元数据存储
 * - 版税自动分配
 * - 防伪溯源
 */
contract CreatorNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    ERC721Royalty,
    AccessControl, 
    ReentrancyGuard 
{
    // ============ 角色定义 ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // ============ 创作状态 ============
    enum CreationStage {
        ProcessRecorded,    // 过程已记录（第一次确权）
        FinalConfirmed,     // 最终已确认（第二次确权）
        NFTMinted,          // NFT已铸造
        Listed,             // 已上架交易
        Transferred         // 已转移
    }
    
    // ============ 创作信息结构 ============
    struct CreationInfo {
        uint256 tokenId;
        address originalCreator;     // 原始创作者
        address currentOwner;        // 当前所有者
        
        // 第一次确权信息
        string processIpfsHash;      // 创作过程IPFS哈希
        bytes32 processContentHash;  // 创作过程内容哈希
        uint256 processTimestamp;    // 过程记录时间
        
        // 第二次确权信息
        string finalIpfsHash;        // 最终作品IPFS哈希
        bytes32 finalContentHash;    // 最终作品内容哈希
        uint256 confirmTimestamp;    // 最终确认时间
        
        // 元数据
        string title;
        string description;
        uint256 creationType;        // 0=AI创作, 1=手工创作
        uint256 contributionScore;   // 贡献度评分 (0-1000)
        
        CreationStage stage;
        uint256 transferCount;       // 转移次数
    }
    
    // ============ 存储 ============
    mapping(uint256 => CreationInfo) public creationInfos;
    mapping(bytes32 => uint256) public contentHashToTokenId;  // 防止重复注册
    mapping(address => uint256[]) private _creatorTokens;     // 创作者的所有作品
    
    uint256 private _tokenIdCounter;
    uint256 public defaultRoyaltyBps = 500;  // 默认版税 5%
    
    // ============ 事件 ============
    event ProcessRecorded(
        uint256 indexed tokenId,
        address indexed creator,
        string processIpfsHash,
        bytes32 processContentHash,
        uint256 timestamp
    );
    
    event FinalConfirmed(
        uint256 indexed tokenId,
        address indexed creator,
        string finalIpfsHash,
        bytes32 finalContentHash,
        uint256 contributionScore,
        uint256 timestamp
    );
    
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string title,
        uint256 creationType
    );
    
    event CreationTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 transferCount
    );
    
    event RoyaltyUpdated(
        uint256 indexed tokenId,
        address receiver,
        uint256 royaltyBps
    );
    
    // ============ 构造函数 ============
    constructor() ERC721("CreatorChain NFT", "CCNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    // ============ 双重确权流程 ============
    
    /**
     * @notice 第一步：记录创作过程（第一次确权）
     * @dev 在创作过程中调用，记录中间状态
     * @param processIpfsHash 创作过程的IPFS哈希
     * @param processContentHash 过程内容的keccak256哈希
     * @param title 作品标题
     * @param description 作品描述
     * @param creationType 创作类型 (0=AI, 1=手工)
     * @return tokenId 预分配的Token ID
     */
    function recordCreationProcess(
        string memory processIpfsHash,
        bytes32 processContentHash,
        string memory title,
        string memory description,
        uint256 creationType
    ) external returns (uint256) {
        require(bytes(processIpfsHash).length > 0, "Process IPFS hash required");
        require(processContentHash != bytes32(0), "Process content hash required");
        require(bytes(title).length > 0, "Title required");
        require(contentHashToTokenId[processContentHash] == 0, "Content already registered");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        CreationInfo storage info = creationInfos[tokenId];
        info.tokenId = tokenId;
        info.originalCreator = msg.sender;
        info.currentOwner = msg.sender;
        info.processIpfsHash = processIpfsHash;
        info.processContentHash = processContentHash;
        info.processTimestamp = block.timestamp;
        info.title = title;
        info.description = description;
        info.creationType = creationType;
        info.stage = CreationStage.ProcessRecorded;
        
        contentHashToTokenId[processContentHash] = tokenId;
        _creatorTokens[msg.sender].push(tokenId);
        
        emit ProcessRecorded(
            tokenId, 
            msg.sender, 
            processIpfsHash, 
            processContentHash,
            block.timestamp
        );
        
        return tokenId;
    }
    
    /**
     * @notice 第二步：确认最终作品（第二次确权）
     * @dev 创作完成后调用，锁定最终版本
     * @param tokenId 之前记录的Token ID
     * @param finalIpfsHash 最终作品的IPFS哈希
     * @param finalContentHash 最终内容的keccak256哈希
     * @param contributionScore 贡献度评分 (0-1000)
     */
    function confirmFinalCreation(
        uint256 tokenId,
        string memory finalIpfsHash,
        bytes32 finalContentHash,
        uint256 contributionScore
    ) external {
        CreationInfo storage info = creationInfos[tokenId];
        
        require(info.originalCreator == msg.sender, "Not the creator");
        require(info.stage == CreationStage.ProcessRecorded, "Invalid stage");
        require(bytes(finalIpfsHash).length > 0, "Final IPFS hash required");
        require(finalContentHash != bytes32(0), "Final content hash required");
        require(contributionScore <= 1000, "Score must be 0-1000");
        
        // 防止最终哈希重复
        require(
            contentHashToTokenId[finalContentHash] == 0 || 
            contentHashToTokenId[finalContentHash] == tokenId,
            "Final content already exists"
        );
        
        info.finalIpfsHash = finalIpfsHash;
        info.finalContentHash = finalContentHash;
        info.confirmTimestamp = block.timestamp;
        info.contributionScore = contributionScore;
        info.stage = CreationStage.FinalConfirmed;
        
        contentHashToTokenId[finalContentHash] = tokenId;
        
        emit FinalConfirmed(
            tokenId,
            msg.sender,
            finalIpfsHash,
            finalContentHash,
            contributionScore,
            block.timestamp
        );
    }
    
    /**
     * @notice 第三步：铸造NFT
     * @dev 确认后可铸造NFT，正式上链
     * @param tokenId 已确认的Token ID
     * @param metadataURI NFT元数据URI
     */
    function mintCreationNFT(
        uint256 tokenId,
        string memory metadataURI
    ) external nonReentrant {
        CreationInfo storage info = creationInfos[tokenId];
        
        require(info.originalCreator == msg.sender, "Not the creator");
        require(info.stage == CreationStage.FinalConfirmed, "Not confirmed yet");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        
        // 铸造NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // 设置默认版税
        _setTokenRoyalty(tokenId, msg.sender, uint96(defaultRoyaltyBps));
        
        info.stage = CreationStage.NFTMinted;
        
        emit NFTMinted(tokenId, msg.sender, info.title, info.creationType);
    }
    
    // ============ 版税管理 ============
    
    /**
     * @notice 创作者更新自己作品的版税
     * @param tokenId Token ID
     * @param newRoyaltyBps 新版税率（基点，10000=100%）
     */
    function updateRoyalty(uint256 tokenId, uint96 newRoyaltyBps) external {
        require(creationInfos[tokenId].originalCreator == msg.sender, "Not original creator");
        require(newRoyaltyBps <= 2000, "Royalty too high (max 20%)");
        
        _setTokenRoyalty(tokenId, msg.sender, newRoyaltyBps);
        emit RoyaltyUpdated(tokenId, msg.sender, newRoyaltyBps);
    }
    
    // ============ 查询功能 ============
    
    /**
     * @notice 获取创作完整信息
     */
    function getCreationInfo(uint256 tokenId) external view returns (CreationInfo memory) {
        require(tokenId > 0 && tokenId <= _tokenIdCounter, "Invalid token ID");
        return creationInfos[tokenId];
    }
    
    /**
     * @notice 获取创作者的所有作品
     */
    function getCreatorTokens(address creator) external view returns (uint256[] memory) {
        return _creatorTokens[creator];
    }
    
    /**
     * @notice 通过内容哈希查找Token ID
     */
    function getTokenByContentHash(bytes32 contentHash) external view returns (uint256) {
        return contentHashToTokenId[contentHash];
    }
    
    /**
     * @notice 验证创作真实性
     * @dev 核心防伪功能
     */
    function verifyCreation(
        uint256 tokenId,
        bytes32 contentHash
    ) external view returns (
        bool isValid,
        address originalCreator,
        uint256 creationTime,
        uint256 contributionScore
    ) {
        CreationInfo storage info = creationInfos[tokenId];
        
        bool hashMatches = (info.processContentHash == contentHash || 
                           info.finalContentHash == contentHash);
        
        return (
            hashMatches && info.stage >= CreationStage.FinalConfirmed,
            info.originalCreator,
            info.processTimestamp,
            info.contributionScore
        );
    }
    
    /**
     * @notice 获取总铸造数量
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    // ============ 转移追踪 ============
    
    /**
     * @dev 覆盖转移函数，追踪转移历史
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0)) {
            CreationInfo storage info = creationInfos[tokenId];
            info.currentOwner = to;
            info.transferCount++;
            info.stage = CreationStage.Transferred;
            
            emit CreationTransferred(tokenId, from, to, info.transferCount);
        }
        
        return from;
    }
    
    // ============ 必要的覆盖 ============
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

