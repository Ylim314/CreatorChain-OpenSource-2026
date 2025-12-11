// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleCreationRegistry
 * @dev 简化版的创作登记合约，只做一件事：在链上帮创作者“盖章存证”。
 *
 * 使用方式可以和你前端的两步流程一一对应：
 *  1. 第一次登记（registerCreation）：
 *     - 前端已经把文件上传到本地服务器或 IPFS，得到一个哈希/路径；
 *     - 前端把标题、描述、文件哈希、创作类型、内容哈希传进来；
 *     - 合约在链上生成一个 creationId，记录“谁在什么时候登记了哪份内容”。
 *
 *  2. 第二次确认（confirmCreation）：
 *     - 创作完成后，前端得到最终版本的 IPFS 哈希和内容哈希；
 *     - 创作者本人再次调用 confirmCreation，更新最终哈希并标记为 confirmed；
 *     - 这一步相当于“盖上最终版的确认章”，完成双重确权。
 *
 * 说明：
 *  - 本合约本身不负责“铸造 NFT”或“处理积分”，只负责登记和查询；
 *  - 你可以把它理解成：一张专门记“创作登记信息”的链上表，供前端和其他合约引用。
 */
contract SimpleCreationRegistry is AccessControl, ReentrancyGuard {
    // 创作者角色常量（目前主要用于扩展权限控制，演示环境里逻辑比较宽松）
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    /// @dev 链上保存的一条创作记录（可以理解成数据库里的 Creation 行）
    struct Creation {
        uint256 id;            // 作品在本合约内的自增 ID（1,2,3,...），前端看到的 creationId
        address creator;       // 创作者的钱包地址（提交交易的 msg.sender）
        string title;          // 作品标题（由前端传入，纯文本）
        string description;    // 作品描述（由前端传入，纯文本）
        string ipfsHash;       // 作品文件或元数据在 IPFS / 本地存储中的哈希或路径（不做解析，只当字符串）
        uint256 creationType;  // 作品类型：前端用 0/1/2... 区分图像、文本、音频等（具体含义由前端约定）
        bytes32 contentHash;   // 把标题+描述+文件哈希等做 keccak256 得到的内容哈希，用于防篡改和查重
        bool confirmed;        // 是否已经做过最终确认（第二次确权），true 表示已经锁定最终版本
        uint256 timestamp;     // 初次登记时的区块时间（block.timestamp），作为时间戳证据
    }

    // 通过作品 ID 查询对应的 Creation 详情（相当于链上的「作品表」，主键是 creationId）
    mapping(uint256 => Creation) public creations;
    // 通过创作者地址查询他名下所有作品 ID（方便 MyCreations 页面按地址拉取）
    mapping(address => uint256[]) public creatorToCreations;
    // 自增计数器，用来生成新的作品 ID（每次登记 +1，就像排队取号机）
    uint256 private _creationCounter;

    // 当一条创作首次登记成功时触发（前端可以监听这个事件更新列表）
    event CreationRegistered(
        uint256 indexed creationId,
        address indexed creator,
        string title,
        string ipfsHash
    );

    // 当创作被最终确认（第二次确权完成）时触发
    event CreationConfirmed(
        uint256 indexed creationId,
        address indexed creator,
        string finalIpfsHash
    );

    constructor() {
        // 部署者默认成为管理员和创作者
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CREATOR_ROLE, msg.sender);
        // 当前测试版中：CREATOR_ROLE 的管理员是 DEFAULT_ADMIN_ROLE，可按需扩展为白名单制
        _setRoleAdmin(CREATOR_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /**
     * @dev 注册一条新的创作记录（第一次确权）
     * @param _title         作品标题
     * @param _description   作品描述
     * @param _ipfsHash      作品文件或元数据在 IPFS/本地的哈希（前端 uploadToIPFS 返回）
     * @param _creationType  作品类型（0=图像、1=文本等，由前端约定）
     * @param _contentHash   对作品核心信息做 keccak256 得到的内容哈希
     * @return creationId    新生成的链上作品 ID
     *
     * 说明：
     * - 这个函数不会直接上传文件，只接收哈希/标识符，确保链上存储成本可控；
     * - 事件 CreationRegistered 会记录核心信息，方便前端/区块浏览器索引。
     */
    function registerCreation(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _creationType,
        bytes32 _contentHash
    ) public returns (uint256) {
        // 1. 分配新的作品 ID（自增计数器，类似给作品排号）
        _creationCounter++;
        uint256 creationId = _creationCounter;

        // 2. 在映射中初始化 Creation 结构体（把核心信息一次性写入链上）
        Creation storage creation = creations[creationId];
        creation.id = creationId;
        creation.creator = msg.sender;
        creation.title = _title;
        creation.description = _description;
        creation.ipfsHash = _ipfsHash;
        creation.creationType = _creationType;
        creation.contentHash = _contentHash;
        creation.confirmed = false;
        creation.timestamp = block.timestamp;

        // 3. 记录「某个地址名下有哪些作品」（方便前端直接查列表）
        creatorToCreations[msg.sender].push(creationId);

        // 4. 触发事件，方便前端订阅与索引
        emit CreationRegistered(creationId, msg.sender, _title, _ipfsHash);

        // 5. 把作品 ID 返回给前端，后面确认或查询都靠这个编号
        return creationId;
    }

    /**
     * @dev 确认某条创作记录（第二次确权）
     * @param _creationId        要确认的作品 ID
     * @param _finalIpfsHash     最终元数据（通常是 JSON）的 IPFS/本地哈希
     * @param _finalContentHash  对最终元数据做 keccak256 得到的内容哈希
     *
     * 说明：
     * - 只能由该作品的创作者本人调用；
     * - 调用后会把 Creation.confirmed 标记为 true，表示已经完成双重确权。
     */
    function confirmCreation(
        uint256 _creationId,
        string memory _finalIpfsHash,
        bytes32 _finalContentHash
    ) public {
        // 安全检查：只有最初登记该作品的地址可以做最终确认（防止别人乱改）
        require(creations[_creationId].creator == msg.sender, "Not the creator");

        // 更新作品的最终哈希信息，并标记为已确认（完成双重确权）
        Creation storage creation = creations[_creationId];
        creation.ipfsHash = _finalIpfsHash;
        creation.contentHash = _finalContentHash;
        creation.confirmed = true;

        // 发出事件，记录确认动作（包含最终 IPFS 哈希）
        emit CreationConfirmed(_creationId, msg.sender, _finalIpfsHash);
    }

    /**
     * @dev 根据作品 ID 获取链上存储的完整 Creation 信息
     */
    function getCreation(uint256 _creationId) public view returns (Creation memory) {
        return creations[_creationId];
    }

    /**
     * @dev 根据创作者地址获取其所有作品 ID 列表
     */
    function getCreationsByCreator(address _creator) public view returns (uint256[] memory) {
        return creatorToCreations[_creator];
    }

    /**
     * @dev 授予某个地址 CREATOR_ROLE（预留扩展用，当前演示环境未严格限制）
     */
    function grantCreatorRole(address account) public {
        _grantRole(CREATOR_ROLE, account);
    }

    /**
     * @dev 查询某个地址是否拥有 CREATOR_ROLE
     */
    function hasCreatorRole(address account) public view returns (bool) {
        return hasRole(CREATOR_ROLE, account);
    }
}
