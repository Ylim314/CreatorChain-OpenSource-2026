// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ProofOfCreation.sol";
import "./MultiLayerRights.sol";

/**
 * @title CreationRegistry
 * @dev 用于AI创作内容确权的智能合约，集成多层版权系统
 */
contract CreationRegistry is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // 引用其他合约
    ProofOfCreation public proofOfCreation;
    MultiLayerRights public multiLayerRights;

    // 创作类型枚举 - 全媒体支持
    enum CreationType {
        Image, // 图像
        Text, // 文本
        Audio, // 音频
        Video, // 视频
        Model, // AI模型
        Code, // 代码
        Game, // 游戏
        Model3D, // 3D模型
        Other // 其他
    }

    // 创作作品结构（Gas优化版）
    struct Creation {
        uint256 id;
        address creator;
        CreationType creationType;
        bytes32 contentHash; // IPFS内容哈希（使用bytes32节省Gas）
        bytes32 metadataHash; // 创作过程元数据哈希
        uint32 timestamp; // 使用uint32节省Gas
        bool isVerified;
        // 新增字段 - 全媒体支持（Gas优化）
        uint32 fileSize; // 文件大小（限制在4GB以内）
        bytes32 fileFormatHash; // 文件格式哈希
        bytes32 contentAnalysisHash; // 内容分析结果哈希
        uint32 duration; // 音视频时长（秒，限制在约136年）
        bytes32 resolutionHash; // 视频分辨率哈希
        uint32 bitRate; // 音频比特率（限制在4Gbps以内）
        uint256[] parentCreations; // 引用的其他创作ID列表
        address[] contributors; // 贡献者列表
        uint16[] contributionShares; // 贡献份额（0-10000）
        uint16 contributionScore; // 从ProofOfCreation获取的贡献度评分
        uint256 mainRightTokenId; // 主版权token ID
        uint256[] elementRightTokenIds; // 元素版权token ID列表
    }

    // 存储所有创作
    mapping(uint256 => Creation) public creations;

    // 创作者地址到其创作的映射
    mapping(address => uint256[]) public creatorToCreations;

    // 事件（增强版）
    event CreationRegistered(
        uint256 indexed tokenId,
        address indexed creator,
        CreationType creationType,
        string contentHash,
        uint256 contributionScore,
        uint256 mainRightTokenId
    );
    event CreationVerified(uint256 indexed tokenId, bool verified);
    event ContributionUpdated(
        uint256 indexed tokenId,
        address[] contributors,
        uint256[] shares
    );
    event ElementRightCreated(
        uint256 indexed creationTokenId,
        uint256 indexed elementRightTokenId,
        string elementType
    );

    constructor(
        address _proofOfCreation,
        address _multiLayerRights
    ) ERC721("CreatorChain", "CCHAIN") Ownable(msg.sender) {
        proofOfCreation = ProofOfCreation(_proofOfCreation);
        multiLayerRights = MultiLayerRights(_multiLayerRights);
    }

    /**
     * @dev 注册新的AI创作（增强版）
     * @param creationType 创作类型
     * @param contentHash IPFS内容哈希
     * @param metadataHash 创作过程元数据哈希
     * @param parentCreations 引用的其他创作ID列表
     * @param contributors 贡献者列表
     * @param contributionShares 贡献份额
     * @param tokenURI token URI
     * @return 新创建的token ID
     */
    function registerCreation(
        CreationType creationType,
        string memory contentHash,
        string memory metadataHash,
        uint256[] memory parentCreations,
        address[] memory contributors,
        uint256[] memory contributionShares,
        string memory tokenURI
    ) public returns (uint256) {
        require(
            contributors.length == contributionShares.length,
            "Contributors and shares length mismatch"
        );

        // 计算总贡献份额
        uint256 totalShares = 0;
        for (uint i = 0; i < contributionShares.length; i++) {
            totalShares += contributionShares[i];
        }
        require(totalShares == 100, "Total contribution shares must be 100");

        // 生成新的token ID
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        // 从ProofOfCreation获取贡献度评分
        (uint256 contributionScore, ) = proofOfCreation.getContributionScore(
            newItemId
        );

        // 创建主版权token
        uint256 mainRightTokenId = multiLayerRights.createRight(
            msg.sender,
            MultiLayerRights.RightLayer.FULL_RIGHTS,
            string(
                abi.encodePacked(
                    "Full rights for creation #",
                    Strings.toString(newItemId)
                )
            ),
            0, // 无父级
            1000, // 10%版税
            payable(msg.sender),
            0, // 永久
            true // 可转让
        );

        // 创建创作记录
        Creation memory newCreation = Creation({
            id: newItemId,
            creator: msg.sender,
            creationType: creationType,
            contentHash: contentHash,
            metadataHash: metadataHash,
            timestamp: block.timestamp,
            isVerified: false,
            parentCreations: parentCreations,
            contributors: contributors,
            contributionShares: contributionShares,
            contributionScore: contributionScore,
            mainRightTokenId: mainRightTokenId,
            elementRightTokenIds: new uint256[](0)
        });

        creations[newItemId] = newCreation;
        creatorToCreations[msg.sender].push(newItemId);

        // 铸造NFT
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        emit CreationRegistered(
            newItemId,
            msg.sender,
            creationType,
            contentHash,
            contributionScore,
            mainRightTokenId
        );

        return newItemId;
    }

    /**
     * @dev 为创作添加元素版权
     * @param creationTokenId 创作token ID
     * @param elementType 元素类型
     * @param elementId 元素ID
     * @param metadata 元素元数据
     * @param coordinates 元素坐标
     * @param royaltyPercentage 版税比例
     * @param beneficiary 版税受益人
     */
    function addElementRight(
        uint256 creationTokenId,
        string memory elementType,
        string memory elementId,
        string memory metadata,
        uint256[] memory coordinates,
        uint256 royaltyPercentage,
        address payable beneficiary
    ) public returns (uint256) {
        require(_ownerOf(creationTokenId) != address(0), "Creation not exists");
        require(
            ownerOf(creationTokenId) == msg.sender,
            "Only creation owner can add element rights"
        );

        Creation storage creation = creations[creationTokenId];
        uint256 parentRightTokenId = creation.mainRightTokenId;

        // 创建元素版权
        uint256 elementRightTokenId = multiLayerRights.createElementRight(
            msg.sender,
            parentRightTokenId,
            elementType,
            elementId,
            metadata,
            coordinates,
            royaltyPercentage,
            beneficiary
        );

        // 添加到创作的元素版权列表
        creation.elementRightTokenIds.push(elementRightTokenId);

        emit ElementRightCreated(
            creationTokenId,
            elementRightTokenId,
            elementType
        );

        return elementRightTokenId;
    }

    /**
     * @dev 更新创作贡献者信息
     * @param tokenId 创作ID
     * @param contributors 贡献者列表
     * @param contributionShares 贡献份额
     */
    function updateContribution(
        uint256 tokenId,
        address[] memory contributors,
        uint256[] memory contributionShares
    ) public {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Caller is not owner nor approved"
        );
        require(
            contributors.length == contributionShares.length,
            "Contributors and shares length mismatch"
        );

        // 计算总贡献份额
        uint256 totalShares = 0;
        for (uint i = 0; i < contributionShares.length; i++) {
            totalShares += contributionShares[i];
        }
        require(totalShares == 100, "Total contribution shares must be 100");

        Creation storage creation = creations[tokenId];
        creation.contributors = contributors;
        creation.contributionShares = contributionShares;

        emit ContributionUpdated(tokenId, contributors, contributionShares);
    }

    /**
     * @dev 验证创作
     * @param tokenId 创作ID
     * @param verified 验证状态
     */
    function verifyCreation(uint256 tokenId, bool verified) public onlyOwner {
        Creation storage creation = creations[tokenId];
        creation.isVerified = verified;

        emit CreationVerified(tokenId, verified);
    }

    /**
     * @dev 获取创作详情
     * @param tokenId 创作ID
     * @return 创作详情
     */
    function getCreation(
        uint256 tokenId
    ) public view returns (Creation memory) {
        return creations[tokenId];
    }

    /**
     * @dev 获取创作者的所有创作ID
     * @param creator 创作者地址
     * @return 创作ID列表
     */
    function getCreatorCreations(
        address creator
    ) public view returns (uint256[] memory) {
        return creatorToCreations[creator];
    }

    /**
     * @dev 获取创作总数
     * @return 创作总数
     */
    function getTotalCreations() public view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev 批量铸造创作 - Gas优化版本
     * @param creators 创作者地址数组
     * @param creationTypes 创作类型数组
     * @param contentHashes 内容哈希数组
     * @param metadataHashes 元数据哈希数组
     * @param fileSizes 文件大小数组
     * @param fileFormatHashes 文件格式哈希数组
     * @return tokenIds 铸造的token ID数组
     */
    function batchMintCreations(
        address[] memory creators,
        CreationType[] memory creationTypes,
        bytes32[] memory contentHashes,
        bytes32[] memory metadataHashes,
        uint32[] memory fileSizes,
        bytes32[] memory fileFormatHashes
    ) public onlyOwner returns (uint256[] memory tokenIds) {
        require(
            creators.length == creationTypes.length &&
                creators.length == contentHashes.length &&
                creators.length == metadataHashes.length &&
                creators.length == fileSizes.length &&
                creators.length == fileFormatHashes.length,
            "Array lengths must match"
        );

        require(creators.length <= 20, "Batch size too large"); // 限制批量大小

        tokenIds = new uint256[](creators.length);

        for (uint256 i = 0; i < creators.length; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            // 创建创作记录
            creations[newTokenId] = Creation({
                id: newTokenId,
                creator: creators[i],
                creationType: creationTypes[i],
                contentHash: contentHashes[i],
                metadataHash: metadataHashes[i],
                timestamp: uint32(block.timestamp),
                isVerified: false,
                fileSize: fileSizes[i],
                fileFormatHash: fileFormatHashes[i],
                contentAnalysisHash: bytes32(0),
                duration: 0,
                resolutionHash: bytes32(0),
                bitRate: 0,
                parentCreations: new uint256[](0),
                contributors: new address[](0),
                contributionShares: new uint16[](0),
                contributionScore: 0,
                mainRightTokenId: 0,
                elementRightTokenIds: new uint256[](0)
            });

            // 铸造NFT
            _safeMint(creators[i], newTokenId);

            // 更新创作者映射
            creatorToCreations[creators[i]].push(newTokenId);

            tokenIds[i] = newTokenId;

            emit CreationRegistered(
                newTokenId,
                creators[i],
                creationTypes[i],
                contentHashes[i]
            );
        }

        return tokenIds;
    }

    /**
     * @dev 批量验证创作 - Gas优化版本
     * @param tokenIds token ID数组
     */
    function batchVerifyCreations(uint256[] memory tokenIds) public onlyOwner {
        require(tokenIds.length <= 50, "Batch size too large");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            creations[tokenIds[i]].isVerified = true;

            emit CreationVerified(tokenIds[i], true);
        }
    }

    /**
     * @dev 获取批量创作信息 - Gas优化版本
     * @param tokenIds token ID数组
     * @return 创作信息数组
     */
    function getBatchCreations(
        uint256[] memory tokenIds
    ) public view returns (Creation[] memory) {
        Creation[] memory creationList = new Creation[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            creationList[i] = creations[tokenIds[i]];
        }

        return creationList;
    }
}
