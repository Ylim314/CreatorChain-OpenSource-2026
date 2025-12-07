// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreatorChainRegistry
 * @dev 统一的创作注册中心 - 解决合约间协调问题
 */
contract CreatorChainRegistry is AccessControl, ReentrancyGuard {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // 合约地址映射
    mapping(string => address) public contractAddresses;

    // 创作状态枚举
    enum CreationStatus {
        Pending,
        Verified,
        Listed,
        Sold,
        Disputed,
        Cancelled
    }

    // 统一创作结构
    struct UnifiedCreation {
        uint256 id;
        address creator;
        string contentHash;
        string metadataHash;
        string proofHash;
        CreationStatus status;
        uint256 contributionScore;
        uint256 priceInPoints;
        uint256 timestamp;
        address[] contributors;
        uint256[] contributionShares;
        bool isListed;
        bool isVerified;
    }

    // 存储所有创作
    mapping(uint256 => UnifiedCreation) public creations;
    mapping(address => uint256[]) public creatorToCreations;
    mapping(string => uint256) public hashToCreationId;

    // 计数器
    uint256 private _creationCounter;

    // 事件
    event CreationRegistered(
        uint256 indexed creationId,
        address indexed creator,
        string contentHash,
        string metadataHash,
        string proofHash,
        uint256 contributionScore
    );

    event CreationStatusUpdated(
        uint256 indexed creationId,
        CreationStatus oldStatus,
        CreationStatus newStatus
    );

    event ContractAddressUpdated(
        string indexed contractName,
        address oldAddress,
        address newAddress
    );

    event CreationVerified(
        uint256 indexed creationId,
        address indexed verifier,
        bool verified
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev 设置合约地址
     * @param contractName 合约名称
     * @param contractAddress 合约地址
     */
    function setContractAddress(
        string memory contractName,
        address contractAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(contractAddress != address(0), "Invalid contract address");
        address oldAddress = contractAddresses[contractName];
        contractAddresses[contractName] = contractAddress;
        emit ContractAddressUpdated(contractName, oldAddress, contractAddress);
    }

    /**
     * @dev 注册创作 - 统一入口
     * @param contentHash IPFS内容哈希
     * @param metadataHash IPFS元数据哈希
     * @param proofHash IPFS证明哈希
     * @param contributors 贡献者列表
     * @param contributionShares 贡献份额
     * @return creationId 创作ID
     */
    function registerCreation(
        string memory contentHash,
        string memory metadataHash,
        string memory proofHash,
        address[] memory contributors,
        uint256[] memory contributionShares
    ) external onlyRole(CREATOR_ROLE) returns (uint256) {
        require(bytes(contentHash).length > 0, "Content hash required");
        require(bytes(metadataHash).length > 0, "Metadata hash required");
        require(bytes(proofHash).length > 0, "Proof hash required");
        require(
            contributors.length == contributionShares.length,
            "Contributors and shares mismatch"
        );

        _creationCounter = _creationCounter + 1;
        uint256 creationId = _creationCounter;

        // 检查哈希唯一性
        require(
            hashToCreationId[contentHash] == 0,
            "Content hash already exists"
        );
        require(
            hashToCreationId[metadataHash] == 0,
            "Metadata hash already exists"
        );
        require(hashToCreationId[proofHash] == 0, "Proof hash already exists");

        // 创建统一创作记录
        UnifiedCreation storage creation = creations[creationId];
        creation.id = creationId;
        creation.creator = msg.sender;
        creation.contentHash = contentHash;
        creation.metadataHash = metadataHash;
        creation.proofHash = proofHash;
        creation.status = CreationStatus.Pending;
        creation.timestamp = block.timestamp;
        creation.contributors = contributors;
        creation.contributionShares = contributionShares;
        creation.isListed = false;
        creation.isVerified = false;

        // 更新映射
        creatorToCreations[msg.sender].push(creationId);
        hashToCreationId[contentHash] = creationId;
        hashToCreationId[metadataHash] = creationId;
        hashToCreationId[proofHash] = creationId;

        emit CreationRegistered(
            creationId,
            msg.sender,
            contentHash,
            metadataHash,
            proofHash,
            0
        );

        return creationId;
    }

    /**
     * @dev 验证创作
     * @param creationId 创作ID
     * @param contributionScore 贡献度评分
     * @param verified 是否验证通过
     */
    function verifyCreation(
        uint256 creationId,
        uint256 contributionScore,
        bool verified
    ) external onlyRole(VERIFIER_ROLE) {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );

        UnifiedCreation storage creation = creations[creationId];
        require(
            creation.status == CreationStatus.Pending,
            "Creation not pending"
        );

        creation.contributionScore = contributionScore;
        creation.isVerified = verified;

        if (verified) {
            creation.status = CreationStatus.Verified;
        } else {
            creation.status = CreationStatus.Cancelled;
        }

        emit CreationVerified(creationId, msg.sender, verified);
    }

    /**
     * @dev 更新创作状态
     * @param creationId 创作ID
     * @param newStatus 新状态
     */
    function updateCreationStatus(
        uint256 creationId,
        CreationStatus newStatus
    ) external onlyRole(ADMIN_ROLE) {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );

        UnifiedCreation storage creation = creations[creationId];
        CreationStatus oldStatus = creation.status;

        // 状态转换验证
        require(
            isValidStatusTransition(oldStatus, newStatus),
            "Invalid status transition"
        );

        creation.status = newStatus;

        emit CreationStatusUpdated(creationId, oldStatus, newStatus);
    }

    /**
     * @dev 上架创作
     * @param creationId 创作ID
     * @param priceInPoints 积分价格
     */
    function listCreation(uint256 creationId, uint256 priceInPoints) external {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );

        UnifiedCreation storage creation = creations[creationId];
        require(creation.creator == msg.sender, "Not the creator");
        require(
            creation.status == CreationStatus.Verified,
            "Creation not verified"
        );
        require(priceInPoints > 0, "Invalid price");

        creation.priceInPoints = priceInPoints;
        creation.isListed = true;
        creation.status = CreationStatus.Listed;

        emit CreationStatusUpdated(
            creationId,
            CreationStatus.Verified,
            CreationStatus.Listed
        );
    }

    /**
     * @dev 购买创作
     * @param creationId 创作ID
     */
    function purchaseCreation(
        uint256 creationId
    ) external payable nonReentrant {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );

        UnifiedCreation storage creation = creations[creationId];
        require(
            creation.status == CreationStatus.Listed,
            "Creation not listed"
        );
        require(creation.creator != msg.sender, "Cannot purchase own creation");

        // 这里应该实现积分支付逻辑
        // 为了简化，我们直接更新状态

        creation.status = CreationStatus.Sold;

        emit CreationStatusUpdated(
            creationId,
            CreationStatus.Listed,
            CreationStatus.Sold
        );
    }

    /**
     * @dev 获取创作信息
     * @param creationId 创作ID
     * @return creation 创作信息
     */
    function getCreation(
        uint256 creationId
    ) external view returns (UnifiedCreation memory) {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );
        return creations[creationId];
    }

    /**
     * @dev 获取创作者的创作列表
     * @param creator 创作者地址
     * @return creationIds 创作ID列表
     */
    function getCreatorCreations(
        address creator
    ) external view returns (uint256[] memory) {
        return creatorToCreations[creator];
    }

    /**
     * @dev 根据哈希获取创作ID
     * @param hash 哈希值
     * @return creationId 创作ID
     */
    function getCreationByHash(
        string memory hash
    ) external view returns (uint256) {
        return hashToCreationId[hash];
    }

    /**
     * @dev 获取合约地址
     * @param contractName 合约名称
     * @return contractAddress 合约地址
     */
    function getContractAddress(
        string memory contractName
    ) external view returns (address) {
        return contractAddresses[contractName];
    }

    /**
     * @dev 验证状态转换是否有效
     * @param from 原状态
     * @param to 目标状态
     * @return valid 是否有效
     */
    function isValidStatusTransition(
        CreationStatus from,
        CreationStatus to
    ) public pure returns (bool) {
        if (from == CreationStatus.Pending) {
            return
                to == CreationStatus.Verified || to == CreationStatus.Cancelled;
        }
        if (from == CreationStatus.Verified) {
            return
                to == CreationStatus.Listed || to == CreationStatus.Cancelled;
        }
        if (from == CreationStatus.Listed) {
            return to == CreationStatus.Sold || to == CreationStatus.Cancelled;
        }
        if (from == CreationStatus.Sold) {
            return to == CreationStatus.Disputed;
        }
        if (from == CreationStatus.Disputed) {
            return to == CreationStatus.Sold || to == CreationStatus.Cancelled;
        }
        return false;
    }

    /**
     * @dev 获取创作总数
     * @return count 创作总数
     */
    function getCreationCount() external view returns (uint256) {
        return _creationCounter;
    }

    /**
     * @dev 检查创作是否存在
     * @param creationId 创作ID
     * @return exists 是否存在
     */
    function creationExists(uint256 creationId) external view returns (bool) {
        return creationId > 0 && creationId <= _creationCounter;
    }

    /**
     * @dev 获取创作状态
     * @param creationId 创作ID
     * @return status 创作状态
     */
    function getCreationStatus(
        uint256 creationId
    ) external view returns (CreationStatus) {
        require(
            creationId > 0 && creationId <= _creationCounter,
            "Invalid creation ID"
        );
        return creations[creationId].status;
    }
}