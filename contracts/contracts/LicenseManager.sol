// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LicenseManager (设计原型 - 不实际部署)
 * @author CreatorChain Team
 * @notice 版权授权管理合约 - 实现灵活的版权许可机制
 * @dev 重要说明：
 *      - 此合约仅为设计原型，不实际部署到区块链
 *      - 本项目采用链下积分系统，不涉及任何虚拟货币
 *      - 实际授权购买功能通过后端API实现，使用数据库存储的积分
 *      - 本合约保留仅为技术设计参考
 * 
 * 区块链技术要点：
 * - 智能合约自动执行授权条款（设计参考）
 * - 链上授权记录不可篡改（设计参考）
 * - 时间锁机制（设计参考）
 * 
 * 实际实现：
 * - 授权购买：通过后端API，使用积分系统
 * - 授权记录：存储在数据库中
 * - 授权验证：通过后端API查询
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
        uint256 tokenId;           // NFT Token ID（仅作为版权证明）
        address licensor;          // 授权方（版权所有者）
        address licensee;          // 被授权方
        LicenseType licenseType;
        LicenseStatus status;
        
        uint256 price;             // 授权价格（积分，仅记录用）
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
    
    // ============ 事件 ============
    event LicenseCreated(
        uint256 indexed licenseId,
        uint256 indexed tokenId,
        address indexed licensee,
        LicenseType licenseType,
        uint256 price,
        uint256 duration
    );
    
    // 注意：此合约不实际部署，实际授权功能通过后端API实现
    // 使用链下积分系统，不涉及任何虚拟货币
}
