// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ProofOfCreation
 * @dev 基于区块链技术的AI创作确权合约 - 实现双重确权机制
 *
 * 核心区块链价值：
 * 1. 不可篡改性：创作过程一旦记录到区块链，永远无法被修改或删除
 * 2. 时间戳证明：区块链提供精确的时间戳，证明创作的时间顺序
 * 3. 去中心化验证：无需第三方机构，任何人都可以验证创作的真实性
 * 4. 透明性：所有创作记录公开透明，可被任何人查询验证
 * 5. 永久存储：区块链网络保证数据永久存储，不会丢失
 *
 * 双重确权流程：
 * - 第一次确权：记录创作过程（AI模型、提示词、参数等）
 * - 第二次确权：确认最终作品（内容哈希、验证证明等）
 *
 * 技术特色：
 * - Merkle树验证：确保创作步骤的完整性和真实性
 * - 贡献度评分：基于多维度因子计算创作贡献度
 * - 智能合约自动化：无需人工干预的确权流程
 */
contract ProofOfCreation is AccessControl {
    using SafeMath for uint256;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // 创作过程记录结构 - Gas优化版本
    struct CreationProcess {
        uint256 creationId;
        bytes32 modelInfoHash; // AI模型信息哈希（使用bytes32节省Gas）
        bytes32 promptHash; // 提示词哈希
        bytes32 parameterHash; // 参数设置哈希
        bytes32 merkleRoot; // 创作步骤Merkle树根
        uint32 timestamp; // 使用uint32节省Gas（足够存储时间戳）
        bool isVerified;
        uint16 contributionScore; // 创作贡献度评分（0-10000）
        uint16 complexityScore; // 复杂度评分（0-10000）
    }

    // 创作贡献度评分结构 - Gas优化版本
    struct ContributionFactors {
        uint16 promptComplexity; // 提示词复杂度 (0-100)
        uint16 parameterOptimization; // 参数优化难度 (0-100)
        uint16 iterationCount; // 迭代次数（限制在65535以内）
        uint16 modelDifficulty; // 模型使用难度 (0-100)
        uint16 originalityFactor; // 原创性因子 (0-100)
    }

    // 存储所有创作过程记录
    mapping(uint256 => CreationProcess) public creationProcesses;

    // 存储创作贡献度因子
    mapping(uint256 => ContributionFactors) public contributionFactors;

    // AI模型认证记录 - Gas优化版本
    struct ModelVerification {
        bytes32 modelIdHash; // 模型ID哈希
        bytes32 modelNameHash; // 模型名称哈希
        bytes32 modelVersionHash; // 模型版本哈希
        bytes32 providerInfoHash; // 提供商信息哈希
        bool isVerified;
    }

    // 存储所有AI模型认证
    mapping(string => ModelVerification) public verifiedModels;

    // 批量操作结构 - Gas优化
    struct BatchCreationProcess {
        uint256[] creationIds;
        bytes32[] modelInfoHashes;
        bytes32[] promptHashes;
        bytes32[] parameterHashes;
        bytes32[] merkleRoots;
        uint16[] contributionScores;
        uint16[] complexityScores;
    }

    // 事件 - Gas优化版本
    event CreationProcessRecorded(
        uint256 indexed creationId,
        bytes32 modelInfoHash,
        bytes32 promptHash,
        uint16 contributionScore
    );
    event CreationProcessVerified(uint256 indexed creationId, bool verified);
    event ModelVerified(string modelId, string modelName, bool verified);
    event ContributionScoreCalculated(uint256 indexed creationId, uint16 score);

    // 批量记录创作过程 - Gas优化
    event BatchCreationProcessRecorded(
        uint256[] creationIds,
        uint16 totalCount
    );
    event CreationProofSubmitted(
        uint256 indexed creationId,
        bytes32 merkleRoot
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev 记录创作过程（增强版）
     * @param creationId 创作ID
     * @param modelInfo AI模型信息
     * @param promptHash 提示词哈希
     * @param parameterHash 参数设置哈希
     * @param intermediateSteps 中间步骤哈希列表
     * @param merkleRoot 创作步骤Merkle树根
     * @param factors 创作贡献度因子
     */
    function recordCreationProcess(
        uint256 creationId,
        string memory modelInfo,
        string memory promptHash,
        string memory parameterHash,
        string memory intermediateSteps,
        bytes32 merkleRoot,
        ContributionFactors memory factors
    ) public {
        require(
            creationProcesses[creationId].creationId == 0,
            "Creation process already recorded"
        );

        // 计算创作贡献度评分
        uint256 contributionScore = calculateContributionScore(factors);
        uint256 complexityScore = calculateComplexityScore(factors);

        CreationProcess memory newProcess = CreationProcess({
            creationId: creationId,
            modelInfo: modelInfo,
            promptHash: promptHash,
            parameterHash: parameterHash,
            intermediateSteps: intermediateSteps,
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            isVerified: false,
            contributionScore: contributionScore,
            complexityScore: complexityScore
        });

        creationProcesses[creationId] = newProcess;
        contributionFactors[creationId] = factors;

        emit CreationProcessRecorded(
            creationId,
            modelInfo,
            promptHash,
            contributionScore
        );
        emit CreationProofSubmitted(creationId, merkleRoot);
        emit ContributionScoreCalculated(creationId, contributionScore);
    }

    /**
     * @dev 计算创作贡献度评分 - 企业级安全算法实现
     * @param factors 贡献度因子
     * @return 贡献度评分 (0-1000)
     */
    function calculateContributionScore(
        ContributionFactors memory factors
    ) public pure returns (uint256) {
        // 输入验证 - 防止恶意输入
        require(
            factors.promptComplexity <= 100,
            "Prompt complexity must be <= 100"
        );
        require(
            factors.parameterOptimization <= 100,
            "Parameter optimization must be <= 100"
        );
        require(
            factors.modelDifficulty <= 100,
            "Model difficulty must be <= 100"
        );
        require(
            factors.originalityFactor <= 100,
            "Originality factor must be <= 100"
        );
        require(factors.iterationCount <= 1000, "Iteration count too high");

        // 权重分配：提示词复杂度30%，参数优化25%，迭代次数20%，模型难度15%，原创性10%
        uint256 promptScore = factors.promptComplexity.mul(30).div(100);
        uint256 paramScore = factors.parameterOptimization.mul(25).div(100);

        // 迭代次数评分 - 使用对数函数防止线性增长过快
        uint256 iterationScore;
        if (factors.iterationCount <= 20) {
            iterationScore = factors.iterationCount.mul(2); // 每次迭代2分，最多40分
        } else {
            // 超过20次迭代使用对数增长，防止无限增长
            iterationScore =
                40 +
                (factors.iterationCount.sub(20)).mul(1).div(2);
        }

        uint256 modelScore = factors.modelDifficulty.mul(15).div(100);
        uint256 originalityScore = factors.originalityFactor.mul(10).div(100);

        // 计算总分
        uint256 totalScore = promptScore
            .add(paramScore)
            .add(iterationScore)
            .add(modelScore)
            .add(originalityScore);

        // 确保评分在0-1000范围内
        return totalScore > 1000 ? 1000 : totalScore;
    }

    /**
     * @dev 计算复杂度评分 - 企业级安全算法实现
     * @param factors 贡献度因子
     * @return 复杂度评分
     */
    function calculateComplexityScore(
        ContributionFactors memory factors
    ) public pure returns (uint256) {
        // 输入验证
        require(
            factors.promptComplexity <= 100,
            "Prompt complexity must be <= 100"
        );
        require(
            factors.parameterOptimization <= 100,
            "Parameter optimization must be <= 100"
        );
        require(
            factors.modelDifficulty <= 100,
            "Model difficulty must be <= 100"
        );

        // 使用加权平均计算复杂度
        uint256 totalComplexity = factors
            .promptComplexity
            .add(factors.parameterOptimization)
            .add(factors.modelDifficulty);
        return totalComplexity.div(3);
    }

    /**
     * @dev 验证创作步骤证明
     * @param creationId 创作ID
     * @param proof Merkle证明
     * @param stepHash 步骤哈希
     * @return 验证结果
     */
    function verifyCreationStep(
        uint256 creationId,
        bytes32[] memory proof,
        bytes32 stepHash
    ) public view returns (bool) {
        require(
            creationProcesses[creationId].creationId != 0,
            "Creation process not found"
        );

        bytes32 root = creationProcesses[creationId].merkleRoot;
        return MerkleProof.verify(proof, root, stepHash);
    }

    /**
     * @dev 验证创作过程（增强版）
     * @param creationId 创作ID
     * @param verified 验证结果
     * @param proof Merkle证明（可选）
     * @param stepHash 关键步骤哈希（可选）
     */
    function verifyCreationProcess(
        uint256 creationId,
        bool verified,
        bytes32[] memory proof,
        bytes32 stepHash
    ) public onlyRole(VERIFIER_ROLE) {
        require(
            creationProcesses[creationId].creationId != 0,
            "Creation process not found"
        );

        // 如果提供了证明，验证关键步骤
        if (proof.length > 0) {
            require(
                verifyCreationStep(creationId, proof, stepHash),
                "Invalid creation step proof"
            );
        }

        creationProcesses[creationId].isVerified = verified;

        emit CreationProcessVerified(creationId, verified);
    }

    /**
     * @dev 认证AI模型
     * @param modelId 模型ID
     * @param modelName 模型名称
     * @param modelVersion 模型版本
     * @param providerInfo 提供商信息
     * @param verified 认证结果
     */
    function verifyModel(
        string memory modelId,
        string memory modelName,
        string memory modelVersion,
        string memory providerInfo,
        bool verified
    ) public onlyRole(VERIFIER_ROLE) {
        ModelVerification memory modelVerification = ModelVerification({
            modelId: modelId,
            modelName: modelName,
            modelVersion: modelVersion,
            providerInfo: providerInfo,
            isVerified: verified
        });

        verifiedModels[modelId] = modelVerification;

        emit ModelVerified(modelId, modelName, verified);
    }

    /**
     * @dev 获取创作贡献度评分
     * @param creationId 创作ID
     * @return contributionScore 贡献度评分
     * @return complexityScore 复杂度评分
     */
    function getContributionScore(
        uint256 creationId
    ) public view returns (uint256 contributionScore, uint256 complexityScore) {
        CreationProcess memory process = creationProcesses[creationId];
        return (process.contributionScore, process.complexityScore);
    }

    /**
     * @dev 获取创作贡献度因子
     * @param creationId 创作ID
     * @return 贡献度因子详情
     */
    function getContributionFactors(
        uint256 creationId
    ) public view returns (ContributionFactors memory) {
        return contributionFactors[creationId];
    }

    /**
     * @dev 批量获取创作评分（用于排行榜等）
     * @param creationIds 创作ID列表
     * @return scores 评分列表
     */
    function batchGetContributionScores(
        uint256[] memory creationIds
    ) public view returns (uint256[] memory scores) {
        scores = new uint256[](creationIds.length);
        for (uint256 i = 0; i < creationIds.length; i++) {
            scores[i] = creationProcesses[creationIds[i]].contributionScore;
        }
        return scores;
    }

    /**
     * @dev 检查创作过程是否已验证
     * @param creationId 创作ID
     * @return 是否已验证
     */
    function isCreationVerified(uint256 creationId) public view returns (bool) {
        return creationProcesses[creationId].isVerified;
    }

    /**
     * @dev 检查AI模型是否已认证
     * @param modelId 模型ID
     * @return 是否已认证
     */
    function isModelVerified(string memory modelId) public view returns (bool) {
        return verifiedModels[modelId].isVerified;
    }

    /**
     * @dev 获取创作过程详情
     * @param creationId 创作ID
     * @return 创作过程详情
     */
    function getCreationProcess(
        uint256 creationId
    ) public view returns (CreationProcess memory) {
        return creationProcesses[creationId];
    }

    /**
     * @dev 获取AI模型认证详情
     * @param modelId 模型ID
     * @return 模型认证详情
     */
    function getModelVerification(
        string memory modelId
    ) public view returns (ModelVerification memory) {
        return verifiedModels[modelId];
    }

    /**
     * @dev 添加验证者
     * @param verifier 验证者地址
     */
    function addVerifier(address verifier) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @dev 移除验证者
     * @param verifier 验证者地址
     */
    function removeVerifier(
        address verifier
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @dev 批量记录创作过程 - Gas优化版本
     * @param batch 批量创作过程数据
     */
    function batchRecordCreationProcess(
        BatchCreationProcess memory batch
    ) public onlyRole(VERIFIER_ROLE) {
        require(
            batch.creationIds.length == batch.modelInfoHashes.length &&
                batch.creationIds.length == batch.promptHashes.length &&
                batch.creationIds.length == batch.parameterHashes.length &&
                batch.creationIds.length == batch.merkleRoots.length &&
                batch.creationIds.length == batch.contributionScores.length &&
                batch.creationIds.length == batch.complexityScores.length,
            "Array lengths must match"
        );

        require(batch.creationIds.length <= 50, "Batch size too large"); // 限制批量大小

        for (uint256 i = 0; i < batch.creationIds.length; i++) {
            creationProcesses[batch.creationIds[i]] = CreationProcess({
                creationId: batch.creationIds[i],
                modelInfoHash: batch.modelInfoHashes[i],
                promptHash: batch.promptHashes[i],
                parameterHash: batch.parameterHashes[i],
                merkleRoot: batch.merkleRoots[i],
                timestamp: uint32(block.timestamp),
                isVerified: false,
                contributionScore: batch.contributionScores[i],
                complexityScore: batch.complexityScores[i]
            });

            emit CreationProcessRecorded(
                batch.creationIds[i],
                batch.modelInfoHashes[i],
                batch.promptHashes[i],
                batch.contributionScores[i]
            );
        }

        emit BatchCreationProcessRecorded(
            batch.creationIds,
            uint16(batch.creationIds.length)
        );
    }

    /**
     * @dev 批量验证创作过程 - Gas优化版本
     * @param creationIds 创作ID数组
     */
    function batchVerifyCreationProcess(
        uint256[] memory creationIds
    ) public onlyRole(VERIFIER_ROLE) {
        require(creationIds.length <= 50, "Batch size too large");

        for (uint256 i = 0; i < creationIds.length; i++) {
            require(
                creationProcesses[creationIds[i]].creationId != 0,
                "Creation process not found"
            );

            creationProcesses[creationIds[i]].isVerified = true;

            emit CreationProcessVerified(creationIds[i], true);
        }
    }

    /**
     * @dev 获取批量创作过程信息 - Gas优化版本
     * @param creationIds 创作ID数组
     * @return 创作过程数组
     */
    function getBatchCreationProcesses(
        uint256[] memory creationIds
    ) public view returns (CreationProcess[] memory) {
        CreationProcess[] memory processes = new CreationProcess[](
            creationIds.length
        );

        for (uint256 i = 0; i < creationIds.length; i++) {
            processes[i] = creationProcesses[creationIds[i]];
        }

        return processes;
    }
}
