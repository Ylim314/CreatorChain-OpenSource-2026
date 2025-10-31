// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CreatorChainRegistry.sol";

/**
 * @title CreatorDAO
 * @dev 创作者DAO治理系统，管理平台规则和开发方向
 */
contract CreatorDAO is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ACTIVE_CREATOR_ROLE =
        keccak256("ACTIVE_CREATOR_ROLE");

    CreationRegistry public creationRegistry;

    // 提案状态枚举
    enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed,
        Canceled
    }

    // 提案类型枚举
    enum ProposalType {
        ParameterChange, // 修改平台参数
        FundAllocation, // 资金分配
        FeatureRequest, // 功能请求
        PolicyChange, // 政策变更
        Other // 其他
    }

    // 提案结构
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData; // 执行时调用的数据
        address targetContract; // 目标合约地址
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) hasVoted;
        ProposalStatus status;
        ProposalType proposalType;
    }

    // 存储所有提案
    mapping(uint256 => Proposal) public proposals;
    uint256 private _proposalIds;

    // 治理参数
    uint256 public minCreationsToPropose; // 提案所需最小创作数
    uint256 public votingPeriod; // 投票周期（秒）
    uint256 public quorum; // 法定人数（占总供应量的百分比）

    // 事件
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event GovernanceParameterChanged(string paramName, uint256 newValue);

    constructor(
        address _creationRegistryAddress
    ) ERC20("CreatorDAO Token", "CDT") {
        creationRegistry = CreationRegistry(_creationRegistryAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // 初始化治理参数
        minCreationsToPropose = 3;
        votingPeriod = 7 days;
        quorum = 10; // 10%
    }

    /**
     * @dev 铸造治理代币
     * @param to 接收地址
     * @param amount 数量
     */
    function mint(address to, uint256 amount) public onlyRole(ADMIN_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev 根据创作数量铸造治理代币
     * @param creator 创作者地址
     */
    function mintBasedOnCreations(address creator) public onlyRole(ADMIN_ROLE) {
        uint256[] memory creationIds = creationRegistry.getCreatorCreations(
            creator
        );
        uint256 creationCount = creationIds.length;

        // 确保每个创作只能获得一次代币
        uint256 currentBalance = balanceOf(creator);
        if (currentBalance < creationCount * 100 ether) {
            uint256 toMint = creationCount * 100 ether - currentBalance;
            _mint(creator, toMint);
        }

        // 如果创作数达到要求，授予活跃创作者角色
        if (
            creationCount >= minCreationsToPropose &&
            !hasRole(ACTIVE_CREATOR_ROLE, creator)
        ) {
            _grantRole(ACTIVE_CREATOR_ROLE, creator);
        }
    }

    /**
     * @dev 创建提案
     * @param title 标题
     * @param description 描述
     * @param callData 执行数据
     * @param targetContract 目标合约
     * @param proposalType 提案类型
     * @return 新创建的提案ID
     */
    function createProposal(
        string memory title,
        string memory description,
        bytes memory callData,
        address targetContract,
        ProposalType proposalType
    ) public onlyRole(ACTIVE_CREATOR_ROLE) returns (uint256) {
        require(
            balanceOf(msg.sender) >= 100 ether,
            "Not enough DAO tokens to create proposal"
        );

        _proposalIds++;
        uint256 newProposalId = _proposalIds;

        Proposal storage newProposal = proposals[newProposalId];
        newProposal.id = newProposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.callData = callData;
        newProposal.targetContract = targetContract;
        newProposal.votingStartTime = block.timestamp;
        newProposal.votingEndTime = block.timestamp + votingPeriod;
        newProposal.status = ProposalStatus.Active;
        newProposal.proposalType = proposalType;

        emit ProposalCreated(newProposalId, msg.sender, title, proposalType);

        return newProposalId;
    }

    /**
     * @dev 投票
     * @param proposalId 提案ID
     * @param support 是否支持
     */
    function castVote(uint256 proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal is not active"
        );
        require(
            block.timestamp <= proposal.votingEndTime,
            "Voting period has ended"
        );
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if (support) {
            proposal.yesVotes += weight;
        } else {
            proposal.noVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev 执行提案
     * @param proposalId 提案ID
     */
    function executeProposal(uint256 proposalId) public nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal is not active"
        );
        require(
            block.timestamp > proposal.votingEndTime,
            "Voting period not ended"
        );

        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        uint256 totalSupply = totalSupply();

        // 检查是否达到法定人数
        require(
            (totalVotes * 100) / totalSupply >= quorum,
            "Quorum not reached"
        );

        // 检查是否通过
        if (proposal.yesVotes > proposal.noVotes) {
            proposal.status = ProposalStatus.Passed;

            // 执行提案
            (bool success, ) = proposal.targetContract.call(proposal.callData);
            require(success, "Proposal execution failed");

            proposal.status = ProposalStatus.Executed;
            emit ProposalExecuted(proposalId);
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
    }

    /**
     * @dev 取消提案
     * @param proposalId 提案ID
     */
    function cancelProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal is not active"
        );
        require(
            msg.sender == proposal.proposer || hasRole(ADMIN_ROLE, msg.sender),
            "Not proposer or admin"
        );

        proposal.status = ProposalStatus.Canceled;

        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev 更新治理参数
     * @param _minCreationsToPropose 提案所需最小创作数
     * @param _votingPeriod 投票周期（秒）
     * @param _quorum 法定人数（占总供应量的百分比）
     */
    function updateGovernanceParameters(
        uint256 _minCreationsToPropose,
        uint256 _votingPeriod,
        uint256 _quorum
    ) public onlyRole(ADMIN_ROLE) {
        minCreationsToPropose = _minCreationsToPropose;
        emit GovernanceParameterChanged(
            "minCreationsToPropose",
            _minCreationsToPropose
        );

        votingPeriod = _votingPeriod;
        emit GovernanceParameterChanged("votingPeriod", _votingPeriod);

        quorum = _quorum;
        emit GovernanceParameterChanged("quorum", _quorum);
    }

    /**
     * @dev 查看提案投票情况
     * @param proposalId 提案ID
     * @return 赞成票数，反对票数，总投票数
     */
    function getProposalVotes(
        uint256 proposalId
    ) public view returns (uint256, uint256, uint256) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        return (proposal.yesVotes, proposal.noVotes, totalVotes);
    }
}
