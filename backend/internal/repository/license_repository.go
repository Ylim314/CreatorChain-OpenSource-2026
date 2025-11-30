package repository

import (
	"gorm.io/gorm"
)

// LicenseRepository 授权数据访问接口
type LicenseRepository interface {
	Create(license *License) error
	GetByID(id uint) (*License, error)
	GetByLicensee(address string, offset, limit int) ([]License, error)
	GetByTokenID(tokenID int64) ([]License, error)
	Update(license *License) error
	Delete(id uint) error
}

// licenseRepository 授权数据访问实现
type licenseRepository struct {
	db *gorm.DB
}

// NewLicenseRepository 创建授权Repository
func NewLicenseRepository(db *gorm.DB) LicenseRepository {
	return &licenseRepository{db: db}
}

// Create 创建授权
func (r *licenseRepository) Create(license *License) error {
	return r.db.Create(license).Error
}

// GetByID 根据ID获取授权
func (r *licenseRepository) GetByID(id uint) (*License, error) {
	var license License
	err := r.db.First(&license, id).Error
	if err != nil {
		return nil, err
	}
	return &license, nil
}

// GetByLicensee 获取用户购买的所有授权
func (r *licenseRepository) GetByLicensee(address string, offset, limit int) ([]License, error) {
	var licenses []License
	query := r.db.Where("licensee_addr = ?", address).Order("created_at DESC")
	
	if offset > 0 {
		query = query.Offset(offset)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	
	err := query.Find(&licenses).Error
	return licenses, err
}

// GetByTokenID 根据Token ID获取授权列表
func (r *licenseRepository) GetByTokenID(tokenID int64) ([]License, error) {
	var licenses []License
	err := r.db.Where("token_id = ?", tokenID).Order("created_at DESC").Find(&licenses).Error
	return licenses, err
}

// Update 更新授权
func (r *licenseRepository) Update(license *License) error {
	return r.db.Save(license).Error
}

// Delete 删除授权（软删除）
func (r *licenseRepository) Delete(id uint) error {
	return r.db.Delete(&License{}, id).Error
}

