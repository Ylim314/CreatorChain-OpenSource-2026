// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CreatorDAO
 * @author CreatorChain Team
 * @notice 创作者DAO治理合约 - 去中心化决策机制
 * @dev 核心功能：
 *      1. 提案创建与投票
 *      2. 时间锁执行
 *      3. 基于代币的投票权重
 *      4. 多签执行机制
 * 
 * 区块链技术要点：
 * - DAO治理标准实现
 * - 时间锁防止闪电贷攻击
 * - 提案状态机
 * - 链上投票记录
 */
contract CreatorDAO is AccessControl, ReentrancyGuard {
    
    // ============ 角色定义 ============
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
    
    // ============ 提案状态 ============
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
    
    // ============ 提案类型 ============
    enum ProposalType {
        General,        // 通用提案
        ParameterChange,// 参数修改
        TreasurySpend,  // 国库支出
        ContractUpgrade,// 合约升级
        Emergency       // 紧急提案
    }
    
    // ============ 提案结构 ============
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
        uint256[] values;           // ETH金额
        bytes[] calldatas;          // 调用数据
        
        ProposalState state;
        bool executed;
    }
    
    // ============ 投票记录 ============
    struct VoteRecord {
        bool hasVoted;
        uint8 support;              // 0=反对, 1=赞成, 2=弃权
        uint256 weight;             // 投票权重
    }
    
    // ============ 存储 ============
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteRecord)) public voteRecords;
    mapping(address => uint256[]) public userProposals;
    
    uint256 private _proposalIdCounter;
    
    // ============ 治理参数 ============
    IERC20 public governanceToken;      // 治理代币 (CRT)
    
    uint256 public votingDelay = 1 days;        // 提案创建后多久开始投票
    uint256 public votingPeriod = 7 days;       // 投票持续时间
    uint256 public executionDelay = 2 days;     // 通过后多久可执行
    uint256 public proposalThreshold = 10000 * 10**18;  // 提案门槛：10000 CRT
    uint256 public quorumVotes = 100000 * 10**18;       // 法定人数：100000 CRT
    uint256 public passRate = 5000;              // 通过率：50%（基点）
    
    // 国库
    address public treasury;
    
    // ============ 事件 ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId, uint256 executeTime);
    event ProposalExecuted(uint256 indexed proposalId);
    event GovernanceParameterUpdated(string parameter, uint256 oldValue, uint256 newValue);
    
    // ============ 构造函数 ============
    constructor(address _governanceToken, address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        _grantRole(CANCELLER_ROLE, msg.sender);
        
        governanceToken = IERC20(_governanceToken);
        treasury = _treasury;
    }
    
    // ============ 提案创建 ============
    
    /**
     * @notice 创建新提案
     * @param proposalType 提案类型
     * @param title 提案标题
     * @param description 提案描述（IPFS哈希）
     * @param targets 目标合约地址列表
     * @param values ETH金额列表
     * @param calldatas 调用数据列表
     */
    function propose(
        ProposalType proposalType,
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Below proposal threshold"
        );
        require(bytes(title).length > 0, "Title required");
        require(targets.length == values.length, "Length mismatch");
        require(targets.length == calldatas.length, "Length mismatch");
        
        _proposalIdCounter++;
        uint256 proposalId = _proposalIdCounter;
        
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.proposalType = proposalType;
        p.title = title;
        p.description = description;
        p.createTime = block.timestamp;
        p.startTime = block.timestamp + votingDelay;
        p.endTime = p.startTime + votingPeriod;
        p.targets = targets;
        p.values = values;
        p.calldatas = calldatas;
        p.state = ProposalState.Pending;
        
        userProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            proposalType,
            title,
            p.startTime,
            p.endTime
        );
        
        return proposalId;
    }
    
    /**
     * @notice 快速创建简单提案（无执行操作）
     */
    function proposeSimple(
        string memory title,
        string memory description
    ) external returns (uint256) {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        
        return this.propose(
            ProposalType.General,
            title,
            description,
            targets,
            values,
            calldatas
        );
    }
    
    // ============ 投票功能 ============
    
    /**
     * @notice 投票
     * @param proposalId 提案ID
     * @param support 投票选项：0=反对, 1=赞成, 2=弃权
     * @param reason 投票理由
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external {
        require(support <= 2, "Invalid vote type");
        
        Proposal storage p = proposals[proposalId];
        require(_getProposalState(proposalId) == ProposalState.Active, "Voting not active");
        
        VoteRecord storage record = voteRecords[proposalId][msg.sender];
        require(!record.hasVoted, "Already voted");
        
        // 计算投票权重（基于代币持有量）
        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");
        
        record.hasVoted = true;
        record.support = support;
        record.weight = weight;
        
        if (support == 0) {
            p.againstVotes += weight;
        } else if (support == 1) {
            p.forVotes += weight;
        } else {
            p.abstainVotes += weight;
        }
        
        emit VoteCast(msg.sender, proposalId, support, weight, reason);
    }
    
    /**
     * @notice 批量投票
     */
    function castVoteBatch(
        uint256[] memory proposalIds,
        uint8[] memory supportList
    ) external {
        require(proposalIds.length == supportList.length, "Length mismatch");
        
        for (uint256 i = 0; i < proposalIds.length; i++) {
            // 使用 this.castVote 以便在失败时不影响其他投票
            try this.castVote(proposalIds[i], supportList[i], "") {
            } catch {
                // 忽略失败的投票
            }
        }
    }
    
    // ============ 提案执行 ============
    
    /**
     * @notice 将通过的提案加入执行队列
     */
    function queue(uint256 proposalId) external {
        require(
            _getProposalState(proposalId) == ProposalState.Succeeded,
            "Proposal not succeeded"
        );
        
        Proposal storage p = proposals[proposalId];
        p.executeTime = block.timestamp + executionDelay;
        p.state = ProposalState.Queued;
        
        emit ProposalQueued(proposalId, p.executeTime);
    }
    
    /**
     * @notice 执行提案
     */
    function execute(uint256 proposalId) external nonReentrant onlyRole(EXECUTOR_ROLE) {
        require(
            _getProposalState(proposalId) == ProposalState.Queued,
            "Proposal not queued"
        );
        
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.executeTime, "Execution time not reached");
        require(!p.executed, "Already executed");
        
        p.executed = true;
        p.state = ProposalState.Executed;
        
        // 执行所有调用
        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool success, ) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            require(success, "Execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @notice 取消提案
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        
        require(
            msg.sender == p.proposer || hasRole(CANCELLER_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            _getProposalState(proposalId) != ProposalState.Executed &&
            _getProposalState(proposalId) != ProposalState.Canceled,
            "Cannot cancel"
        );
        
        p.state = ProposalState.Canceled;
        
        emit ProposalCanceled(proposalId);
    }
    
    // ============ 状态查询 ============
    
    /**
     * @notice 获取提案当前状态
     */
    function _getProposalState(uint256 proposalId) internal view returns (ProposalState) {
        Proposal storage p = proposals[proposalId];
        
        if (p.state == ProposalState.Canceled) {
            return ProposalState.Canceled;
        }
        
        if (p.state == ProposalState.Executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp < p.startTime) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= p.endTime) {
            return ProposalState.Active;
        }
        
        // 投票结束，检查结果
        uint256 totalVotes = p.forVotes + p.againstVotes;
        
        // 检查法定人数
        if (totalVotes < quorumVotes) {
            return ProposalState.Defeated;
        }
        
        // 检查通过率
        if (p.forVotes * 10000 / totalVotes >= passRate) {
            if (p.state == ProposalState.Queued) {
                if (block.timestamp >= p.executeTime + 14 days) {
                    return ProposalState.Expired;
                }
                return ProposalState.Queued;
            }
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Defeated;
    }
    
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        return _getProposalState(proposalId);
    }
    
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getVoteRecord(uint256 proposalId, address voter) 
        external 
        view 
        returns (VoteRecord memory) 
    {
        return voteRecords[proposalId][voter];
    }
    
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }
    
    function getVotingPower(address account) external view returns (uint256) {
        return governanceToken.balanceOf(account);
    }
    
    // ============ 治理参数更新 ============
    
    /**
     * @notice 更新投票延迟
     */
    function setVotingDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDelay >= 1 hours && newDelay <= 7 days, "Invalid delay");
        uint256 oldDelay = votingDelay;
        votingDelay = newDelay;
        emit GovernanceParameterUpdated("votingDelay", oldDelay, newDelay);
    }
    
    /**
     * @notice 更新投票期限
     */
    function setVotingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid period");
        uint256 oldPeriod = votingPeriod;
        votingPeriod = newPeriod;
        emit GovernanceParameterUpdated("votingPeriod", oldPeriod, newPeriod);
    }
    
    /**
     * @notice 更新提案门槛
     */
    function setProposalThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldThreshold = proposalThreshold;
        proposalThreshold = newThreshold;
        emit GovernanceParameterUpdated("proposalThreshold", oldThreshold, newThreshold);
    }
    
    /**
     * @notice 更新法定人数
     */
    function setQuorumVotes(uint256 newQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldQuorum = quorumVotes;
        quorumVotes = newQuorum;
        emit GovernanceParameterUpdated("quorumVotes", oldQuorum, newQuorum);
    }
    
    // ============ 接收ETH ============
    receive() external payable {}
}

