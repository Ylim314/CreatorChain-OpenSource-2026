// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreatorDAO (设计原型 - 不实际部署)
 * @author CreatorChain Team
 * @notice 创作者DAO治理合约 - 去中心化决策机制
 * @dev 重要说明：
 *      - 此合约仅为设计原型，不实际部署到区块链
 *      - 本项目不涉及任何代币或虚拟货币
 *      - 实际治理功能通过后端API实现，使用积分系统
 *      - 本合约保留仅为技术设计参考
 * 
 * 区块链技术要点：
 * - DAO治理标准实现（设计参考）
 * - 时间锁防止闪电贷攻击（设计参考）
 * - 提案状态机（设计参考）
 * - 链上投票记录（设计参考）
 * 
 * 实际实现：
 * - 提案创建：通过后端API
 * - 投票：通过后端API，基于积分权重
 * - 提案执行：通过后端API
 */
contract CreatorDAO is AccessControl, ReentrancyGuard {
    
    // ============ 角色定义（谁能发起/执行/取消提案） ============
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
    
    // ============ 提案状态（提案走到哪一步了） ============
    enum ProposalState {
        Pending,        // 待投票
        Active,         // 投票中
        Canceled,       // 已取消
        Defeated,       // 未通过
        Succeeded,      // 已通过
        Queued,         // 排队执行
        Expired,        // 已过期
        Executed        // 已执行
    }
    
    // ============ 提案类型（提案是改参数还是其他目的） ============
    enum ProposalType {
        General,        // 通用提案
        ParameterChange,// 参数修改
        TreasurySpend,  // 国库支出
        ContractUpgrade,// 合约升级
        Emergency       // 紧急提案
    }
    
    // ============ 提案结构（把提案的关键信息集中在这里） ============
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;         // IPFS哈希
        
        // 投票数据
        uint256 forVotes;           // 赞成票
        uint256 againstVotes;       // 反对票
        uint256 abstainVotes;       // 弃权票
        
        // 时间参数
        uint256 createTime;
        uint256 startTime;          // 投票开始
        uint256 endTime;            // 投票结束
        uint256 executeTime;        // 可执行时间
        
        // 执行数据
        address[] targets;          // 目标合约
        uint256[] values;           // ETH金额（仅设计参考，实际不使用）
        bytes[] calldatas;          // 调用数据
        
        ProposalState state;
        bool executed;
    }
    
    // ============ 事件 ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    // 注意：此合约不实际部署，实际治理功能通过后端API实现
    // 使用链下积分系统，不涉及任何虚拟货币
}
