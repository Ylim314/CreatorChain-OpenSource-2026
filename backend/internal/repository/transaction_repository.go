package repository

import (
	"gorm.io/gorm"
)

// TransactionRepository 交易仓库接口
type TransactionRepository interface {
	Create(transaction *Transaction) error
	GetByHash(hash string) (*Transaction, error)
	GetByAddress(address string, offset, limit int) ([]*Transaction, error)
	GetByCreation(creationID uint, offset, limit int) ([]*Transaction, error)
	GetByListing(listingID uint, offset, limit int) ([]*Transaction, error)
	GetAll(offset, limit int) ([]*Transaction, error)
	Update(transaction *Transaction) error
	Delete(hash string) error
}

// transactionRepository 交易仓库实现
type transactionRepository struct {
	db *gorm.DB
}

// NewTransactionRepository 创建交易仓库
func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

// Create 创建交易
func (r *transactionRepository) Create(transaction *Transaction) error {
	return r.db.Create(transaction).Error
}

// GetByHash 根据哈希获取交易
func (r *transactionRepository) GetByHash(hash string) (*Transaction, error) {
	var transaction Transaction
	err := r.db.Where("tx_hash = ?", hash).First(&transaction).Error
	return &transaction, err
}

// GetByAddress 根据地址获取交易
func (r *transactionRepository) GetByAddress(address string, offset, limit int) ([]*Transaction, error) {
	var transactions []*Transaction
	err := r.db.Where("from_address = ? OR to_address = ?", address, address).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&transactions).Error
	return transactions, err
}

// GetByCreation 根据创作ID获取交易
func (r *transactionRepository) GetByCreation(creationID uint, offset, limit int) ([]*Transaction, error) {
	var transactions []*Transaction
	err := r.db.Where("creation_id = ?", creationID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&transactions).Error
	return transactions, err
}

// GetByListing 根据商品ID获取交易
func (r *transactionRepository) GetByListing(listingID uint, offset, limit int) ([]*Transaction, error) {
	var transactions []*Transaction
	err := r.db.Where("listing_id = ?", listingID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&transactions).Error
	return transactions, err
}

// GetAll 获取所有交易
func (r *transactionRepository) GetAll(offset, limit int) ([]*Transaction, error) {
	var transactions []*Transaction
	err := r.db.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&transactions).Error
	return transactions, err
}

// Update 更新交易
func (r *transactionRepository) Update(transaction *Transaction) error {
	return r.db.Save(transaction).Error
}

// Delete 删除交易
func (r *transactionRepository) Delete(hash string) error {
	return r.db.Where("hash = ?", hash).Delete(&Transaction{}).Error
}
