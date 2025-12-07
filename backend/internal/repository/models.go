package repository

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型 - 企业级安全版本
type User struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Address        string         `json:"address" gorm:"uniqueIndex;size:42;not null"`
	Username       string         `json:"username" gorm:"size:50"`
	Email          string         `json:"email" gorm:"size:100"` // 可加密存储
	EncryptedEmail string         `json:"-" gorm:"size:500"`     // 加密后的邮箱
	AvatarURL      string         `json:"avatar_url"`
	Bio            string         `json:"bio"`
	Points         int64          `json:"points" gorm:"default:1000"`       // 用户积分余额
	IsActive       bool           `json:"is_active" gorm:"default:true"`    // 账户是否激活
	IsVerified     bool           `json:"is_verified" gorm:"default:false"` // 是否已验证
	LastLoginAt    *time.Time     `json:"last_login_at"`                    // 最后登录时间
	LoginCount     int64          `json:"login_count" gorm:"default:0"`     // 登录次数
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	Favorites      []*Creation    `json:"favorites,omitempty" gorm:"many2many:user_favorites;"` // 收藏夹关联

	// 关联
	Creations []Creation `json:"creations,omitempty" gorm:"foreignKey:CreatorAddress;references:Address"`
}

// Creation 创作模型
type Creation struct {
	ID                uint   `json:"id" gorm:"primaryKey"`
	TokenID           int64  `json:"token_id" gorm:"uniqueIndex;not null"`
	CreatorAddress    string `json:"creator_address" gorm:"size:42;not null"`
	Title             string `json:"title" gorm:"size:200;not null"`
	Description       string `json:"description"`
	Visibility        string `json:"visibility" gorm:"size:10;default:'private'"` // public/private
	ContentHash       string `json:"content_hash" gorm:"size:64;not null"`
	MetadataHash      string `json:"metadata_hash" gorm:"size:64;not null"`
	ImageURL          string `json:"image_url" gorm:"size:500"` // 图片访问URL
	AIModel           string `json:"ai_model" gorm:"size:100"`
	PromptText        string `json:"prompt_text"`
	ContributionScore int    `json:"contribution_score"`
	PriceInPoints     int64  `json:"price_in_points"`                    // 使用积分定价
	LicenseDuration   int    `json:"license_duration" gorm:"default:12"` // 授权时长（月），默认12个月
	IsListed          bool   `json:"is_listed" gorm:"default:false"`
	// 双重确权流程相关字段
	CreationProcessHash string         `json:"creation_process_hash" gorm:"size:64"`    // 创作过程哈希
	IntermediateSteps   string         `json:"intermediate_steps"`                      // 中间步骤记录
	FinalConfirmation   bool           `json:"final_confirmation" gorm:"default:false"` // 最终确认标志
	VerificationProof   string         `json:"verification_proof" gorm:"size:128"`      // 验证证明
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Creator      User          `json:"creator,omitempty" gorm:"foreignKey:CreatorAddress;references:Address"`
	Transactions []Transaction `json:"transactions,omitempty" gorm:"foreignKey:TokenID;references:TokenID"`
}

// Transaction 交易模型
type Transaction struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TxHash      string         `json:"tx_hash" gorm:"uniqueIndex;size:66;not null"`
	FromAddress string         `json:"from_address" gorm:"size:42;not null"`
	ToAddress   string         `json:"to_address" gorm:"size:42;not null"`
	TokenID     int64          `json:"token_id"`
	Amount      string         `json:"amount"`                                // 使用字符串存储大数
	TxType      string         `json:"tx_type" gorm:"size:20;not null"`       // 'mint', 'transfer', 'license'
	Status      string         `json:"status" gorm:"size:20;default:pending"` // 'pending', 'confirmed', 'failed'
	BlockNumber *int64         `json:"block_number"`
	GasUsed     *int64         `json:"gas_used"`
	GasPrice    string         `json:"gas_price"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联（暂时移除外键约束以避免循环依赖）
	Creation *Creation `json:"creation,omitempty" gorm:"-"`
}

// License 授权模型
type License struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	TokenID      int64          `json:"token_id" gorm:"not null"`
	LicenseType  string         `json:"license_type" gorm:"size:50;not null"`
	LicensorAddr string         `json:"licensor_address" gorm:"size:42;not null"`
	LicenseeAddr string         `json:"licensee_address" gorm:"size:42;not null"`
	Price        string         `json:"price"`
	Duration     int            `json:"duration"` // 授权持续时间（天）
	Terms        string         `json:"terms"`    // 授权条款
	TxHash       string         `json:"tx_hash" gorm:"size:66"`
	Status       string         `json:"status" gorm:"size:20;default:active"` // 'active', 'expired', 'revoked'
	ExpiresAt    *time.Time     `json:"expires_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联（暂时移除外键约束）
	Creation Creation `json:"creation,omitempty" gorm:"-"`
}

// Proposal DAO提案模型
type Proposal struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	ProposerAddr string         `json:"proposer_address" gorm:"size:42;not null"`
	Title        string         `json:"title" gorm:"size:200;not null"`
	Description  string         `json:"description"`
	ProposalType string         `json:"proposal_type" gorm:"size:50;not null"`
	CallData     string         `json:"call_data"` // 执行的调用数据
	VotesFor     string         `json:"votes_for" gorm:"default:0"`
	VotesAgainst string         `json:"votes_against" gorm:"default:0"`
	Status       string         `json:"status" gorm:"size:20;default:active"` // 'active', 'passed', 'rejected', 'executed'
	StartTime    time.Time      `json:"start_time"`
	EndTime      time.Time      `json:"end_time"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// PointsTransaction 积分交易记录模型
type PointsTransaction struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	FromAddress string         `json:"from_address" gorm:"size:42"`
	ToAddress   string         `json:"to_address" gorm:"size:42;not null"`
	Amount      int64          `json:"amount" gorm:"not null"`
	Type        string         `json:"type" gorm:"size:20;not null"` // 'purchase', 'reward', 'transfer', 'refund'
	Description string         `json:"description"`
	CreationID  *uint          `json:"creation_id"` // 关联的创作ID（如果是购买）
	TxHash      string         `json:"tx_hash" gorm:"size:66"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Creation *Creation `json:"creation,omitempty" gorm:"foreignKey:CreationID"`
}

// Vote 投票模型
type Vote struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	ProposalID uint           `json:"proposal_id" gorm:"not null"`
	VoterAddr  string         `json:"voter_address" gorm:"size:42;not null"`
	Support    bool           `json:"support"` // true=赞成, false=反对
	VotePower  string         `json:"vote_power"`
	TxHash     string         `json:"tx_hash" gorm:"size:66"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Proposal Proposal `json:"proposal,omitempty" gorm:"foreignKey:ProposalID"`
}

// Listing 市场挂牌模型
type Listing struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	TokenID    int64          `json:"token_id" gorm:"not null"`
	SellerAddr string         `json:"seller_address" gorm:"size:42;not null"`
	Price      int64          `json:"price" gorm:"not null"`                // 积分价格
	Status     string         `json:"status" gorm:"size:20;default:active"` // 'active', 'sold', 'cancelled'
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联（暂时移除外键约束）
	Creation Creation `json:"creation,omitempty" gorm:"-"`
}

// BlockchainEvent 区块链事件模型
type BlockchainEvent struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	TxHash       string         `json:"tx_hash" gorm:"size:66;not null"`
	BlockNumber  int64          `json:"block_number" gorm:"not null"`
	EventType    string         `json:"event_type" gorm:"size:50;not null"`
	ContractAddr string         `json:"contract_address" gorm:"size:42;not null"`
	EventData    string         `json:"event_data"` // JSON格式的事件数据
	Processed    bool           `json:"processed" gorm:"default:false"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}
