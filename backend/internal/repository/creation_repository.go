package repository

import (
	"gorm.io/gorm"
)

// CreationRepository 创作数据访问接口
type CreationRepository interface {
	Create(creation *Creation) error
	GetByID(id uint) (*Creation, error)
	GetByTokenID(tokenID int64) (*Creation, error)
	GetByCreator(creatorAddress string, offset, limit int) ([]*Creation, error)
	Update(creation *Creation) error
	Delete(id uint) error
	List(offset, limit int) ([]*Creation, error)
	GetMarketListings(offset, limit int) ([]*Creation, error)
	Search(query string, offset, limit int) ([]*Creation, error)
}

// creationRepository 创作数据访问实现
type creationRepository struct {
	db *gorm.DB
}

// NewCreationRepository 创建创作Repository
func NewCreationRepository(db *gorm.DB) CreationRepository {
	return &creationRepository{db: db}
}

// Create 创建作品
func (r *creationRepository) Create(creation *Creation) error {
	return r.db.Create(creation).Error
}

// GetByID 根据ID获取作品
func (r *creationRepository) GetByID(id uint) (*Creation, error) {
	var creation Creation
	err := r.db.Preload("Creator").First(&creation, id).Error
	if err != nil {
		return nil, err
	}
	return &creation, nil
}

// GetByTokenID 根据TokenID获取作品
func (r *creationRepository) GetByTokenID(tokenID int64) (*Creation, error) {
	var creation Creation
	err := r.db.Preload("Creator").Where("token_id = ?", tokenID).First(&creation).Error
	if err != nil {
		return nil, err
	}
	return &creation, nil
}

// GetByCreator 根据创作者地址获取作品列表
func (r *creationRepository) GetByCreator(creatorAddress string, offset, limit int) ([]*Creation, error) {
	var creations []*Creation
	err := r.db.Preload("Creator").
		Where("creator_address = ?", creatorAddress).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&creations).Error
	return creations, err
}

// Update 更新作品
func (r *creationRepository) Update(creation *Creation) error {
	return r.db.Save(creation).Error
}

// Delete 删除作品
func (r *creationRepository) Delete(id uint) error {
	return r.db.Delete(&Creation{}, id).Error
}

// List 获取作品列表
func (r *creationRepository) List(offset, limit int) ([]*Creation, error) {
	var creations []*Creation
	err := r.db.Preload("Creator").
		Where("visibility = ?", "public").
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&creations).Error
	return creations, err
}

// GetMarketListings 获取市场列表
func (r *creationRepository) GetMarketListings(offset, limit int) ([]*Creation, error) {
	var creations []*Creation
	err := r.db.Preload("Creator").
		Where("is_listed = ?", true).
		Where("visibility = ?", "public").
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&creations).Error
	return creations, err
}

// Search 搜索作品
func (r *creationRepository) Search(query string, offset, limit int) ([]*Creation, error) {
	var creations []*Creation
	searchQuery := "%" + query + "%"
	err := r.db.Preload("Creator").
		Where("title ILIKE ? OR description ILIKE ? OR ai_model ILIKE ?", searchQuery, searchQuery, searchQuery).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&creations).Error
	return creations, err
}
