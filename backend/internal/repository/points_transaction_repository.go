package repository

import (
	"gorm.io/gorm"
)

// PointsTransactionRepository 积分交易仓库接口
type PointsTransactionRepository interface {
	Create(transaction *PointsTransaction) error
	GetByID(id uint) (*PointsTransaction, error)
	GetByAddress(address string, limit, offset int) ([]*PointsTransaction, error)
	GetByCreationID(creationID uint) ([]*PointsTransaction, error)
	GetAll(limit, offset int) ([]*PointsTransaction, error)
	GetStats(address string) (map[string]interface{}, error)
	Update(transaction *PointsTransaction) error
	Delete(id uint) error
	GetTotalByAddress(address string) (int64, error)
}

// pointsTransactionRepository 积分交易仓库实现
type pointsTransactionRepository struct {
	db *gorm.DB
}

// NewPointsTransactionRepository 创建积分交易仓库
func NewPointsTransactionRepository(db *gorm.DB) PointsTransactionRepository {
	return &pointsTransactionRepository{db: db}
}

// Create 创建积分交易记录
func (r *pointsTransactionRepository) Create(transaction *PointsTransaction) error {
	return r.db.Create(transaction).Error
}

// GetByID 根据ID获取积分交易记录
func (r *pointsTransactionRepository) GetByID(id uint) (*PointsTransaction, error) {
	var transaction PointsTransaction
	err := r.db.Preload("Creation").First(&transaction, id).Error
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

// GetByAddress 根据地址获取积分交易记录
func (r *pointsTransactionRepository) GetByAddress(address string, limit, offset int) ([]*PointsTransaction, error) {
	var transactions []*PointsTransaction
	query := r.db.Where("from_address = ? OR to_address = ?", address, address)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Preload("Creation").Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}

// GetByCreationID 根据创作ID获取积分交易记录
func (r *pointsTransactionRepository) GetByCreationID(creationID uint) ([]*PointsTransaction, error) {
	var transactions []*PointsTransaction
	err := r.db.Where("creation_id = ?", creationID).Preload("Creation").Find(&transactions).Error
	return transactions, err
}

// Update 更新积分交易记录
func (r *pointsTransactionRepository) Update(transaction *PointsTransaction) error {
	return r.db.Save(transaction).Error
}

// Delete 删除积分交易记录
func (r *pointsTransactionRepository) Delete(id uint) error {
	return r.db.Delete(&PointsTransaction{}, id).Error
}

// GetAll 获取所有积分交易记录
func (r *pointsTransactionRepository) GetAll(limit, offset int) ([]*PointsTransaction, error) {
	var transactions []*PointsTransaction
	query := r.db

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Preload("Creation").Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}

// GetStats 获取积分统计信息
func (r *pointsTransactionRepository) GetStats(address string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总交易数
	var totalCount int64
	query := r.db.Model(&PointsTransaction{})
	if address != "" {
		query = query.Where("from_address = ? OR to_address = ?", address, address)
	}
	err := query.Count(&totalCount).Error
	if err != nil {
		return nil, err
	}
	stats["total_transactions"] = totalCount

	// 总交易金额
	var totalAmount int64
	query = r.db.Model(&PointsTransaction{}).Select("COALESCE(SUM(amount), 0)")
	if address != "" {
		query = query.Where("from_address = ? OR to_address = ?", address, address)
	}
	err = query.Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	stats["total_amount"] = totalAmount

	// 按类型统计
	var typeStats []struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
		Sum   int64  `json:"sum"`
	}

	query = r.db.Model(&PointsTransaction{}).
		Select("type, COUNT(*) as count, COALESCE(SUM(amount), 0) as sum").
		Group("type")
	if address != "" {
		query = query.Where("from_address = ? OR to_address = ?", address, address)
	}
	err = query.Scan(&typeStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_type"] = typeStats

	return stats, nil
}

// GetTotalByAddress 获取地址的总积分交易量
func (r *pointsTransactionRepository) GetTotalByAddress(address string) (int64, error) {
	var total int64
	err := r.db.Model(&PointsTransaction{}).
		Where("from_address = ? OR to_address = ?", address, address).
		Count(&total).Error
	return total, err
}
