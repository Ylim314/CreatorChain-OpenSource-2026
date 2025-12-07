// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiLayerRights
 * @dev 多层版权体系合约，实现细粒度版权管理
 */
contract MultiLayerRights is ERC721, AccessControl, ReentrancyGuard {
    bytes32 public constant RIGHTS_MANAGER_ROLE =
        keccak256("RIGHTS_MANAGER_ROLE");

    // 版权层级枚举
    enum RightLayer {
        FULL_RIGHTS, // 完整版权
        COMMERCIAL_RIGHTS, // 商业使用权
        DISPLAY_RIGHTS, // 展示权
        DERIVATIVE_RIGHTS, // 衍生作品权
        ELEMENT_RIGHTS // 元素版权（如特定角色、背景等）
    }

    // 版权信息结构
    struct RightInfo {
        uint256 tokenId;
        RightLayer layer;
        string description;
        uint256 parentTokenId; // 父级版权token ID
        uint256 royaltyPercentage; // 版税比例 (基点，10000=100%)
        address payable beneficiary; // 版税受益人
        uint256 expiryTime; // 到期时间（0表示永久）
        bool isTransferable; // 是否可转让
    }

    // 元素版权结构
    struct ElementRight {
        string elementType; // 元素类型（character, background, style等）
        string elementId; // 元素ID
        string metadata; // 元素元数据
        uint256[] coordinates; // 元素在作品中的坐标/区域
    }

    // 存储所有版权信息
    mapping(uint256 => RightInfo) public rightInfos;

    // 存储元素版权详情
    mapping(uint256 => ElementRight) public elementRights;

    // 作品的版权层级映射
    mapping(uint256 => uint256[]) public creationRightLayers;

    // 版权使用记录
    mapping(uint256 => mapping(address => bool)) public rightUsageAuthorization;

    // 计数器
    uint256 private _tokenIdCounter;

    // 事件
    event RightCreated(
        uint256 indexed tokenId,
        RightLayer layer,
        uint256 indexed parentTokenId,
        address indexed owner
    );
    event RightTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    event RightUsageAuthorized(
        uint256 indexed tokenId,
        address indexed user,
        bool authorized
    );
    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed payer,
        address indexed beneficiary,
        uint256 amount
    );

    constructor() ERC721("MultiLayerRights", "MLR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RIGHTS_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev 创建版权层级
     * @param to 版权拥有者
     * @param layer 版权层级
     * @param description 版权描述
     * @param parentTokenId 父级版权ID（0表示顶级）
     * @param royaltyPercentage 版税比例
     * @param beneficiary 版税受益人
     * @param expiryTime 到期时间
     * @param isTransferable 是否可转让
     */
    function createRight(
        address to,
        RightLayer layer,
        string memory description,
        uint256 parentTokenId,
        uint256 royaltyPercentage,
        address payable beneficiary,
        uint256 expiryTime,
        bool isTransferable
    ) public onlyRole(RIGHTS_MANAGER_ROLE) returns (uint256) {
        require(royaltyPercentage <= 10000, "Royalty percentage too high");
        require(beneficiary != address(0), "Invalid beneficiary");

        if (parentTokenId != 0) {
            require(
                _ownerOf(parentTokenId) != address(0),
                "Parent token not exists"
            );
        }

        uint256 tokenId = _tokenIdCounter++;

        RightInfo memory newRight = RightInfo({
            tokenId: tokenId,
            layer: layer,
            description: description,
            parentTokenId: parentTokenId,
            royaltyPercentage: royaltyPercentage,
            beneficiary: beneficiary,
            expiryTime: expiryTime,
            isTransferable: isTransferable
        });

        rightInfos[tokenId] = newRight;

        // 如果有父级版权，添加到层级映射
        if (parentTokenId != 0) {
            creationRightLayers[parentTokenId].push(tokenId);
        }

        _safeMint(to, tokenId);

        emit RightCreated(tokenId, layer, parentTokenId, to);
        return tokenId;
    }

    /**
     * @dev 创建元素版权
     * @param to 版权拥有者
     * @param parentTokenId 父级版权ID
     * @param elementType 元素类型
     * @param elementId 元素ID
     * @param metadata 元素元数据
     * @param coordinates 元素坐标
     * @param royaltyPercentage 版税比例
     * @param beneficiary 版税受益人
     */
    function createElementRight(
        address to,
        uint256 parentTokenId,
        string memory elementType,
        string memory elementId,
        string memory metadata,
        uint256[] memory coordinates,
        uint256 royaltyPercentage,
        address payable beneficiary
    ) public onlyRole(RIGHTS_MANAGER_ROLE) returns (uint256) {
        require(
            _ownerOf(parentTokenId) != address(0),
            "Parent token not exists"
        );

        uint256 tokenId = createRight(
            to,
            RightLayer.ELEMENT_RIGHTS,
            string(
                abi.encodePacked("Element: ", elementType, " - ", elementId)
            ),
            parentTokenId,
            royaltyPercentage,
            beneficiary,
            0, // 永久
            true // 可转让
        );

        ElementRight memory element = ElementRight({
            elementType: elementType,
            elementId: elementId,
            metadata: metadata,
            coordinates: coordinates
        });

        elementRights[tokenId] = element;

        return tokenId;
    }

    /**
     * @dev 授权版权使用
     * @param tokenId 版权token ID
     * @param user 用户地址
     * @param authorized 是否授权
     */
    function authorizeRightUsage(
        uint256 tokenId,
        address user,
        bool authorized
    ) public {
        require(
            ownerOf(tokenId) == msg.sender ||
                hasRole(RIGHTS_MANAGER_ROLE, msg.sender),
            "Not authorized"
        );
        require(_ownerOf(tokenId) != address(0), "Token not exists");

        // 检查版权是否过期
        RightInfo memory rightInfo = rightInfos[tokenId];
        if (rightInfo.expiryTime != 0) {
            require(block.timestamp <= rightInfo.expiryTime, "Right expired");
        }

        rightUsageAuthorization[tokenId][user] = authorized;

        emit RightUsageAuthorized(tokenId, user, authorized);
    }

    /**
     * @dev 支付版税
     * @param tokenId 版权token ID
     */
    function payRoyalty(uint256 tokenId) public payable nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token not exists");
        require(msg.value > 0, "Payment required");

        RightInfo memory rightInfo = rightInfos[tokenId];

        uint256 royaltyAmount = (msg.value * rightInfo.royaltyPercentage) /
            10000;
        uint256 remaining = msg.value - royaltyAmount;

        // 支付版税给受益人 - 使用call替代transfer避免DoS攻击
        if (royaltyAmount > 0) {
            (bool success, ) = rightInfo.beneficiary.call{value: royaltyAmount}("");
            require(success, "Royalty payment failed");
            emit RoyaltyPaid(
                tokenId,
                msg.sender,
                rightInfo.beneficiary,
                royaltyAmount
            );
        }

        // 剩余部分退还给调用者
        if (remaining > 0) {
            (bool success, ) = payable(msg.sender).call{value: remaining}("");
            require(success, "Refund payment failed");
        }
    }

    /**
     * @dev 检查版权使用授权
     * @param tokenId 版权token ID
     * @param user 用户地址
     * @return 是否已授权
     */
    function isRightAuthorized(
        uint256 tokenId,
        address user
    ) public view returns (bool) {
        return rightUsageAuthorization[tokenId][user];
    }

    /**
     * @dev 获取作品的所有版权层级
     * @param parentTokenId 父级版权ID
     * @return 版权层级token ID列表
     */
    function getCreationRightLayers(
        uint256 parentTokenId
    ) public view returns (uint256[] memory) {
        return creationRightLayers[parentTokenId];
    }

    /**
     * @dev 获取版权详情
     * @param tokenId 版权token ID
     * @return 版权信息
     */
    function getRightInfo(
        uint256 tokenId
    ) public view returns (RightInfo memory) {
        return rightInfos[tokenId];
    }

    /**
     * @dev 获取元素版权详情
     * @param tokenId 版权token ID
     * @return 元素版权信息
     */
    function getElementRight(
        uint256 tokenId
    ) public view returns (ElementRight memory) {
        return elementRights[tokenId];
    }

    /**
     * @dev 重写转移函数，检查可转让性
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != address(0)) {
            // 不是mint操作
            RightInfo memory rightInfo = rightInfos[tokenId];
            require(rightInfo.isTransferable, "Right not transferable");

            // 检查是否过期
            if (rightInfo.expiryTime != 0) {
                require(
                    block.timestamp <= rightInfo.expiryTime,
                    "Right expired"
                );
            }
        }
    }

    /**
     * @dev 支持的接口
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
