package repository

import (
	"fmt"

	"gorm.io/gorm"
)

// UserRepository 用户数据访问接口
type UserRepository interface {
	FindByAddress(address string) (*User, error)
	GetByAddress(address string) (*User, error) // 别名方法
	Create(user *User) error
	Update(user *User) error
	IsFavorite(userID uint, creationID uint) bool
	ToggleFavorite(userID uint, creationID uint) (bool, error)
	GetFavorites(userID uint) ([]Creation, error)
	TransferPoints(fromAddress, toAddress string, amount int64) error
	AddPoints(address string, amount int64) error
}

// userRepository 用户数据访问实现
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户Repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create 创建用户
func (r *userRepository) Create(user *User) error {
	return r.db.Create(user).Error
}

// FindByAddress 根据地址获取用户 - 企业级安全实现
func (r *userRepository) FindByAddress(address string) (*User, error) {
	// 输入验证
	if address == "" {
		return nil, fmt.Errorf("address cannot be empty")
	}

	// 验证地址格式
	if len(address) != 42 || address[:2] != "0x" {
		return nil, fmt.Errorf("invalid address format")
	}

	// 验证地址长度和字符
	if len(address) > 42 {
		return nil, fmt.Errorf("address too long")
	}

	// 验证十六进制字符
	for i := 2; i < len(address); i++ {
		if !((address[i] >= '0' && address[i] <= '9') ||
			(address[i] >= 'a' && address[i] <= 'f') ||
			(address[i] >= 'A' && address[i] <= 'F')) {
			return nil, fmt.Errorf("invalid address characters")
		}
	}

	var user User
	err := r.db.Where("address = ?", address).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByAddress 根据地址获取用户（别名方法）
func (r *userRepository) GetByAddress(address string) (*User, error) {
	return r.FindByAddress(address)
}

// Update 更新用户
func (r *userRepository) Update(user *User) error {
	return r.db.Save(user).Error
}

// IsFavorite 检查用户是否已收藏某个作品
func (r *userRepository) IsFavorite(userID uint, creationID uint) bool {
	var user User
	if err := r.db.Preload("Favorites").First(&user, userID).Error; err != nil {
		return false
	}
	for _, fav := range user.Favorites {
		if fav.ID == creationID {
			return true
		}
	}
	return false
}

// ToggleFavorite 切换收藏状态
func (r *userRepository) ToggleFavorite(userID uint, creationID uint) (bool, error) {
	user := &User{}
	if err := r.db.First(user, userID).Error; err != nil {
		return false, err
	}
	creation := &Creation{}
	if err := r.db.First(creation, creationID).Error; err != nil {
		return false, err
	}

	association := r.db.Model(user).Association("Favorites")
	if association.Error != nil {
		return false, association.Error
	}

	var creations []*Creation
	association.Find(&creations)

	isFav := false
	for _, c := range creations {
		if c.ID == creationID {
			isFav = true
			break
		}
	}

	if isFav {
		// 已收藏，取消收藏
		err := association.Delete(creation)
		return false, err
	} else {
		// 未收藏，添加收藏
		err := association.Append(creation)
		return true, err
	}
}

// GetFavorites 获取用户收藏列表
func (r *userRepository) GetFavorites(userID uint) ([]Creation, error) {
	var user User
	err := r.db.Preload("Favorites").First(&user, userID).Error
	if err != nil {
		return nil, err
	}
	var favorites []Creation
	for _, fav := range user.Favorites {
		favorites = append(favorites, *fav)
	}
	return favorites, nil
}

// TransferPoints 转移积分
func (r *userRepository) TransferPoints(fromAddress, toAddress string, amount int64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 减少发送方积分
		if err := tx.Model(&User{}).Where("address = ?", fromAddress).
			Update("points", gorm.Expr("points - ?", amount)).Error; err != nil {
			return err
		}

		// 增加接收方积分
		if err := tx.Model(&User{}).Where("address = ?", toAddress).
			Update("points", gorm.Expr("points + ?", amount)).Error; err != nil {
			return err
		}

		// 记录积分交易
		transaction := PointsTransaction{
			FromAddress: fromAddress,
			ToAddress:   toAddress,
			Amount:      amount,
			Type:        "transfer",
			Description: "积分转移",
		}
		return tx.Create(&transaction).Error
	})
}

// AddPoints 添加积分
func (r *userRepository) AddPoints(address string, amount int64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 增加用户积分
		if err := tx.Model(&User{}).Where("address = ?", address).
			Update("points", gorm.Expr("points + ?", amount)).Error; err != nil {
			return err
		}

		// 记录积分交易
		transaction := PointsTransaction{
			ToAddress:   address,
			Amount:      amount,
			Type:        "reward",
			Description: "积分奖励",
		}
		return tx.Create(&transaction).Error
	})
}
