// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreatorToken (CRT)
 * @author CreatorChain Team
 * @notice 创作者代币 - 平台生态的核心激励代币
 * @dev ERC-20代币，用于：
 *      1. 创作激励奖励
 *      2. 版权交易支付
 *      3. DAO治理投票权重
 *      4. 质押获取平台权益
 * 
 * 区块链技术要点：
 * - ERC-20标准实现
 * - 通缩机制（交易燃烧）
 * - 角色权限控制
 * - 重入攻击防护
 */
contract CreatorToken is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard {
    
    // ============ 角色定义 ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    // ============ 代币经济参数 ============
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;  // 10亿枚最大供应量
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 1亿枚初始供应
    
    uint256 public burnRate = 50;  // 0.5% 交易燃烧率 (基数10000)
    uint256 public constant MAX_BURN_RATE = 500;  // 最大5%燃烧率
    
    // ============ 质押系统 ============
    struct StakeInfo {
        uint256 amount;           // 质押数量
        uint256 startTime;        // 质押开始时间
        uint256 lockDuration;     // 锁定期（秒）
        uint256 rewardDebt;       // 已领取奖励
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public rewardPerSecond = 1 * 10**16;  // 每秒奖励 0.01 CRT
    
    // ============ 创作奖励池 ============
    uint256 public creationRewardPool;
    mapping(uint256 => bool) public rewardClaimed;  // creationId => claimed
    
    // ============ 事件 ============
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount);
    event Staked(address indexed user, uint256 amount, uint256 lockDuration);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);
    event CreationRewarded(uint256 indexed creationId, address indexed creator, uint256 amount);
    event BurnRateUpdated(uint256 oldRate, uint256 newRate);
    
    // ============ 构造函数 ============
    constructor() ERC20("CreatorToken", "CRT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        
        // 铸造初始供应量
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // 分配到奖励池
        creationRewardPool = INITIAL_SUPPLY * 30 / 100;  // 30%用于创作奖励
    }
    
    // ============ 铸造功能 ============
    
    /**
     * @notice 铸造新代币（仅限授权角色）
     * @param to 接收地址
     * @param amount 铸造数量
     * @param reason 铸造原因
     */
    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    // ============ 质押功能 ============
    
    /**
     * @notice 质押代币获取收益
     * @param amount 质押数量
     * @param lockDuration 锁定期（秒），最少7天
     */
    function stake(uint256 amount, uint256 lockDuration) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(lockDuration >= 7 days, "Min lock duration is 7 days");
        require(lockDuration <= 365 days, "Max lock duration is 365 days");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // 如果已有质押，先结算奖励
        if (stakes[msg.sender].amount > 0) {
            _claimReward(msg.sender);
        }
        
        // 转移代币到合约
        _transfer(msg.sender, address(this), amount);
        
        // 更新质押信息
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        stakes[msg.sender].lockDuration = lockDuration;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, lockDuration);
    }
    
    /**
     * @notice 解除质押
     */
    function unstake() external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        require(info.amount > 0, "No stake found");
        require(
            block.timestamp >= info.startTime + info.lockDuration,
            "Stake still locked"
        );
        
        uint256 amount = info.amount;
        uint256 reward = _calculateReward(msg.sender);
        
        // 重置质押信息
        totalStaked -= amount;
        info.amount = 0;
        info.rewardDebt = 0;
        
        // 返还本金 + 奖励
        _transfer(address(this), msg.sender, amount);
        if (reward > 0 && balanceOf(address(this)) >= reward) {
            _transfer(address(this), msg.sender, reward);
        }
        
        emit Unstaked(msg.sender, amount, reward);
    }
    
    /**
     * @notice 领取质押奖励（不解除质押）
     */
    function claimReward() external nonReentrant {
        _claimReward(msg.sender);
    }
    
    function _claimReward(address user) internal {
        uint256 reward = _calculateReward(user);
        if (reward > 0 && balanceOf(address(this)) >= reward) {
            stakes[user].rewardDebt += reward;
            _transfer(address(this), user, reward);
            emit RewardClaimed(user, reward);
        }
    }
    
    /**
     * @notice 计算质押奖励
     * @dev 奖励公式：质押量 × 时间 × 基础利率 × 锁定期加成
     */
    function _calculateReward(address user) internal view returns (uint256) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return 0;
        
        uint256 duration = block.timestamp - info.startTime;
        uint256 lockBonus = 100 + (info.lockDuration * 100 / 365 days);  // 最高2倍加成
        
        uint256 reward = (info.amount * duration * rewardPerSecond * lockBonus) 
                        / (10**18 * 100);
        
        return reward > info.rewardDebt ? reward - info.rewardDebt : 0;
    }
    
    /**
     * @notice 查询待领取奖励
     */
    function pendingReward(address user) external view returns (uint256) {
        return _calculateReward(user);
    }
    
    // ============ 创作奖励 ============
    
    /**
     * @notice 为优质创作发放奖励
     * @param creationId 创作ID
     * @param creator 创作者地址
     * @param contributionScore 贡献度评分 (0-1000)
     */
    function rewardCreation(
        uint256 creationId, 
        address creator, 
        uint256 contributionScore
    ) external onlyRole(MINTER_ROLE) {
        require(!rewardClaimed[creationId], "Reward already claimed");
        require(contributionScore <= 1000, "Invalid score");
        require(creator != address(0), "Invalid creator");
        
        // 基础奖励：100 CRT，根据贡献度调整
        uint256 baseReward = 100 * 10**18;
        uint256 reward = baseReward * contributionScore / 1000;
        
        require(creationRewardPool >= reward, "Reward pool exhausted");
        
        rewardClaimed[creationId] = true;
        creationRewardPool -= reward;
        _transfer(address(this), creator, reward);
        
        emit CreationRewarded(creationId, creator, reward);
    }
    
    // ============ 转账覆盖（实现燃烧机制）============
    
    /**
     * @notice 覆盖转账函数，实现自动燃烧
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 burnAmount = (amount * burnRate) / 10000;
        uint256 transferAmount = amount - burnAmount;
        
        if (burnAmount > 0) {
            _burn(msg.sender, burnAmount);
            emit TokensBurned(msg.sender, burnAmount);
        }
        
        return super.transfer(to, transferAmount);
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        uint256 burnAmount = (amount * burnRate) / 10000;
        uint256 transferAmount = amount - burnAmount;
        
        if (burnAmount > 0) {
            _burn(from, burnAmount);
            emit TokensBurned(from, burnAmount);
        }
        
        return super.transferFrom(from, to, transferAmount);
    }
    
    // ============ 治理功能 ============
    
    /**
     * @notice 更新燃烧率（仅治理角色）
     */
    function updateBurnRate(uint256 newRate) external onlyRole(GOVERNANCE_ROLE) {
        require(newRate <= MAX_BURN_RATE, "Rate too high");
        uint256 oldRate = burnRate;
        burnRate = newRate;
        emit BurnRateUpdated(oldRate, newRate);
    }
    
    /**
     * @notice 补充创作奖励池
     */
    function fundRewardPool(uint256 amount) external onlyRole(GOVERNANCE_ROLE) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        creationRewardPool += amount;
    }
    
    // ============ 查询功能 ============
    
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockDuration,
        uint256 pendingRewards,
        bool canUnstake
    ) {
        StakeInfo storage info = stakes[user];
        return (
            info.amount,
            info.startTime,
            info.lockDuration,
            _calculateReward(user),
            block.timestamp >= info.startTime + info.lockDuration
        );
    }
}

