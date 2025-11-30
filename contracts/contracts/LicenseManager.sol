// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LicenseManager
 * @author CreatorChain Team
 * @notice 版权授权管理合约 - 实现灵活的版权许可机制
 * @dev 核心功能：
 *      1. 多种授权类型（个人/商业/独家）
 *      2. 时间限制授权
 *      3. 自动分成机制
 *      4. 授权验证
 * 
 * 区块链技术要点：
 * - 智能合约自动执行授权条款
 * - 链上授权记录不可篡改
 * - 跨合约交互（与NFT、Token合约）
 * - 时间锁机制
 */
contract LicenseManager is AccessControl, ReentrancyGuard {
    
    // ============ 角色定义 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // ============ 授权类型 ============
    enum LicenseType {
        Personal,       // 个人使用 - 非商业
        Commercial,     // 商业使用 - 标准授权
        Exclusive,      // 独家授权 - 排他性
        OpenSource      // 开源授权 - CC协议
    }
    
    // ============ 授权状态 ============
    enum LicenseStatus {
        Active,         // 有效
        Expired,        // 已过期
        Revoked,        // 已撤销
        Transferred     // 已转让
    }
    
    // ============ 授权信息结构 ============
    struct License {
        uint256 licenseId;
        uint256 tokenId;           // NFT Token ID
        address licensor;          // 授权方（版权所有者）
        address licensee;          // 被授权方
        LicenseType licenseType;
        LicenseStatus status;
        
        uint256 price;             // 授权价格（CRT代币）
        uint256 startTime;         // 授权开始时间
        uint256 duration;          // 授权期限（秒）
        uint256 endTime;           // 授权结束时间
        
        string terms;              // 授权条款（IPFS哈希）
        string territory;          // 授权地区
        uint256 usageLimit;        // 使用次数限制（0=无限）
        uint256 usageCount;        // 已使用次数
        
        bool isTransferable;       // 是否可转让
        uint256 royaltyBps;        // 二次转让分成（基点）
    }
    
    // ============ 分成配置 ============
    struct RevenueShare {
        address[] recipients;      // 分成接收人
        uint256[] shares;          // 分成比例（基点，总和10000）
    }
    
    // ============ 存储 ============
    mapping(uint256 => License) public licenses;
    mapping(uint256 => RevenueShare) private revenueShares;  // tokenId => 分成配置
    mapping(uint256 => uint256[]) public tokenLicenses;     // tokenId => 授权ID列表
    mapping(address => uint256[]) public userLicenses;      // 用户获得的授权
    mapping(uint256 => mapping(address => bool)) public hasExclusiveLicense;  // 独家授权检查
    
    uint256 private _licenseIdCounter;
    
    // 平台费率
    uint256 public platformFeeBps = 250;  // 2.5%
    address public platformWallet;
    IERC20 public paymentToken;           // CRT代币
    
    // ============ 事件 ============
    event LicenseCreated(
        uint256 indexed licenseId,
        uint256 indexed tokenId,
        address indexed licensee,
        LicenseType licenseType,
        uint256 price,
        uint256 duration
    );
    
    event LicenseActivated(
        uint256 indexed licenseId,
        address indexed licensee,
        uint256 startTime,
        uint256 endTime
    );
    
    event LicenseExpired(uint256 indexed licenseId);
    event LicenseRevoked(uint256 indexed licenseId, string reason);
    event LicenseTransferred(uint256 indexed licenseId, address from, address to);
    event UsageRecorded(uint256 indexed licenseId, uint256 newCount);
    event RevenueDistributed(uint256 indexed tokenId, uint256 totalAmount);
    
    // ============ 构造函数 ============
    constructor(address _paymentToken, address _platformWallet) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        paymentToken = IERC20(_paymentToken);
        platformWallet = _platformWallet;
    }
    
    // ============ 授权定价 ============
    
    /**
     * @notice 设置作品的分成配置
     * @param tokenId NFT Token ID
     * @param recipients 分成接收人列表
     * @param shares 分成比例列表（基点）
     */
    function setRevenueShare(
        uint256 tokenId,
        address[] memory recipients,
        uint256[] memory shares
    ) external onlyRole(ADMIN_ROLE) {
        require(recipients.length == shares.length, "Length mismatch");
        require(recipients.length > 0, "Empty recipients");
        
        uint256 totalShare = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            totalShare += shares[i];
        }
        require(totalShare == 10000, "Shares must sum to 10000");
        
        revenueShares[tokenId] = RevenueShare({
            recipients: recipients,
            shares: shares
        });
    }

    /**
     * @notice 获取作品的分成配置
     */
    function getRevenueShare(uint256 tokenId)
        external
        view
        returns (address[] memory recipients, uint256[] memory shares)
    {
        RevenueShare storage share = revenueShares[tokenId];
        return (share.recipients, share.shares);
    }
    
    // ============ 授权购买 ============
    
    /**
     * @notice 购买授权
     * @param tokenId NFT Token ID
     * @param licenseType 授权类型
     * @param duration 授权期限（秒）
     * @param terms 授权条款IPFS哈希
     */
    function purchaseLicense(
        uint256 tokenId,
        LicenseType licenseType,
        uint256 duration,
        string memory terms
    ) external nonReentrant returns (uint256) {
        require(duration > 0, "Duration must be positive");
        
        // 检查独家授权冲突
        if (licenseType == LicenseType.Exclusive) {
            require(!_hasActiveExclusiveLicense(tokenId), "Exclusive license exists");
        }
        
        // 计算价格
        uint256 price = _calculateLicensePrice(tokenId, licenseType, duration);
        require(paymentToken.balanceOf(msg.sender) >= price, "Insufficient balance");
        
        _licenseIdCounter++;
        uint256 licenseId = _licenseIdCounter;
        
        // 创建授权记录
        License storage lic = licenses[licenseId];
        lic.licenseId = licenseId;
        lic.tokenId = tokenId;
        lic.licensee = msg.sender;
        lic.licenseType = licenseType;
        lic.status = LicenseStatus.Active;
        lic.price = price;
        lic.startTime = block.timestamp;
        lic.duration = duration;
        lic.endTime = block.timestamp + duration;
        lic.terms = terms;
        lic.isTransferable = (licenseType != LicenseType.Exclusive);
        
        // 设置使用限制
        if (licenseType == LicenseType.Personal) {
            lic.usageLimit = 100;  // 个人授权限制100次
        }
        
        // 更新映射
        tokenLicenses[tokenId].push(licenseId);
        userLicenses[msg.sender].push(licenseId);
        
        if (licenseType == LicenseType.Exclusive) {
            hasExclusiveLicense[tokenId][msg.sender] = true;
        }
        
        // 处理支付
        _processPayment(tokenId, price);
        
        emit LicenseCreated(licenseId, tokenId, msg.sender, licenseType, price, duration);
        emit LicenseActivated(licenseId, msg.sender, block.timestamp, lic.endTime);
        
        return licenseId;
    }
    
    /**
     * @notice 计算授权价格
     */
    function _calculateLicensePrice(
        uint256 tokenId,
        LicenseType licenseType,
        uint256 duration
    ) internal pure returns (uint256) {
        // 基础价格：100 CRT
        uint256 basePrice = 100 * 10**18;
        
        // 类型乘数
        uint256 typeMultiplier;
        if (licenseType == LicenseType.Personal) {
            typeMultiplier = 100;   // 1x
        } else if (licenseType == LicenseType.Commercial) {
            typeMultiplier = 500;   // 5x
        } else if (licenseType == LicenseType.Exclusive) {
            typeMultiplier = 2000;  // 20x
        } else {
            typeMultiplier = 50;    // 0.5x (开源)
        }
        
        // 时长乘数（按月计算）
        uint256 months = duration / 30 days;
        if (months == 0) months = 1;
        uint256 durationMultiplier = 100 + (months * 10);  // 每月+10%
        
        return (basePrice * typeMultiplier * durationMultiplier) / 10000;
    }
    
    /**
     * @notice 处理支付和分成
     */
    function _processPayment(uint256 tokenId, uint256 amount) internal {
        // 收取平台费
        uint256 platformFee = (amount * platformFeeBps) / 10000;
        uint256 creatorAmount = amount - platformFee;
        
        // 转移平台费
        paymentToken.transferFrom(msg.sender, platformWallet, platformFee);
        
        // 分成给创作者
        RevenueShare storage share = revenueShares[tokenId];
        address[] memory recipients = share.recipients;
        uint256[] memory sharePercents = share.shares;
        uint256 recipientsLength = recipients.length;

        if (recipientsLength > 0) {
            for (uint256 i = 0; i < recipientsLength; i++) {
                uint256 recipientAmount = (creatorAmount * sharePercents[i]) / 10000;
                paymentToken.transferFrom(msg.sender, recipients[i], recipientAmount);
            }
        } else {
            // 默认全部给token所有者（需要与NFT合约交互获取）
            paymentToken.transferFrom(msg.sender, platformWallet, creatorAmount);
        }
        
        emit RevenueDistributed(tokenId, amount);
    }
    
    // ============ 授权验证 ============
    
    /**
     * @notice 验证用户是否有有效授权
     * @param tokenId NFT Token ID
     * @param user 用户地址
     * @param requiredType 所需授权类型
     */
    function hasValidLicense(
        uint256 tokenId,
        address user,
        LicenseType requiredType
    ) external view returns (bool) {
        uint256[] storage userLics = userLicenses[user];
        
        for (uint256 i = 0; i < userLics.length; i++) {
            License storage lic = licenses[userLics[i]];
            
            if (lic.tokenId == tokenId &&
                lic.status == LicenseStatus.Active &&
                block.timestamp <= lic.endTime &&
                uint256(lic.licenseType) >= uint256(requiredType)) {
                
                // 检查使用次数限制
                if (lic.usageLimit > 0 && lic.usageCount >= lic.usageLimit) {
                    continue;
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @notice 记录使用（消耗使用次数）
     */
    function recordUsage(uint256 licenseId) external onlyRole(OPERATOR_ROLE) {
        License storage lic = licenses[licenseId];
        require(lic.status == LicenseStatus.Active, "License not active");
        require(block.timestamp <= lic.endTime, "License expired");
        
        if (lic.usageLimit > 0) {
            require(lic.usageCount < lic.usageLimit, "Usage limit reached");
            lic.usageCount++;
        }
        
        emit UsageRecorded(licenseId, lic.usageCount);
    }
    
    // ============ 授权管理 ============
    
    /**
     * @notice 转让授权（非独家授权可转让）
     */
    function transferLicense(uint256 licenseId, address newLicensee) external nonReentrant {
        License storage lic = licenses[licenseId];
        require(lic.licensee == msg.sender, "Not the licensee");
        require(lic.isTransferable, "License not transferable");
        require(lic.status == LicenseStatus.Active, "License not active");
        require(block.timestamp <= lic.endTime, "License expired");
        require(newLicensee != address(0), "Invalid new licensee");
        
        address oldLicensee = lic.licensee;
        lic.licensee = newLicensee;
        lic.status = LicenseStatus.Transferred;
        
        userLicenses[newLicensee].push(licenseId);
        
        emit LicenseTransferred(licenseId, oldLicensee, newLicensee);
    }
    
    /**
     * @notice 撤销授权（仅管理员）
     */
    function revokeLicense(uint256 licenseId, string memory reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        License storage lic = licenses[licenseId];
        require(lic.status == LicenseStatus.Active, "License not active");
        
        lic.status = LicenseStatus.Revoked;
        
        emit LicenseRevoked(licenseId, reason);
    }
    
    /**
     * @notice 续期授权
     */
    function renewLicense(uint256 licenseId, uint256 additionalDuration) 
        external 
        nonReentrant 
    {
        License storage lic = licenses[licenseId];
        require(lic.licensee == msg.sender, "Not the licensee");
        require(
            lic.status == LicenseStatus.Active || 
            (lic.status == LicenseStatus.Expired && block.timestamp - lic.endTime < 30 days),
            "Cannot renew"
        );
        
        uint256 renewalPrice = _calculateLicensePrice(
            lic.tokenId, 
            lic.licenseType, 
            additionalDuration
        );
        
        require(paymentToken.balanceOf(msg.sender) >= renewalPrice, "Insufficient balance");
        
        lic.duration += additionalDuration;
        lic.endTime += additionalDuration;
        lic.status = LicenseStatus.Active;
        
        _processPayment(lic.tokenId, renewalPrice);
    }
    
    // ============ 查询功能 ============
    
    function _hasActiveExclusiveLicense(uint256 tokenId) internal view returns (bool) {
        uint256[] storage licIds = tokenLicenses[tokenId];
        
        for (uint256 i = 0; i < licIds.length; i++) {
            License storage lic = licenses[licIds[i]];
            if (lic.licenseType == LicenseType.Exclusive &&
                lic.status == LicenseStatus.Active &&
                block.timestamp <= lic.endTime) {
                return true;
            }
        }
        
        return false;
    }
    
    function getLicense(uint256 licenseId) external view returns (License memory) {
        return licenses[licenseId];
    }
    
    function getTokenLicenses(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenLicenses[tokenId];
    }
    
    function getUserLicenses(address user) external view returns (uint256[] memory) {
        return userLicenses[user];
    }
    
    function getLicensePrice(
        uint256 tokenId,
        LicenseType licenseType,
        uint256 duration
    ) external pure returns (uint256) {
        return _calculateLicensePrice(tokenId, licenseType, duration);
    }
    
    // ============ 管理功能 ============
    
    function updatePlatformFee(uint256 newFeeBps) external onlyRole(ADMIN_ROLE) {
        require(newFeeBps <= 1000, "Fee too high");  // 最高10%
        platformFeeBps = newFeeBps;
    }
    
    function updatePlatformWallet(address newWallet) external onlyRole(ADMIN_ROLE) {
        require(newWallet != address(0), "Invalid wallet");
        platformWallet = newWallet;
    }
}

