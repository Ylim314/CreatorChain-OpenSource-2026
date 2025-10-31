package service

import (
	"fmt"
	"time"

	"creatorchain-backend/internal/repository"
)

// CreationService 创作服务接口
type CreationService interface {
	CreateCreation(creation *repository.Creation) error
	GetCreation(id uint) (*repository.Creation, error)
	GetCreationByTokenID(tokenID int64) (*repository.Creation, error)
	GetCreationsByCreator(creatorAddress string, offset, limit int) ([]*repository.Creation, error)
	UpdateCreation(creation *repository.Creation) error
	ListCreations(offset, limit int) ([]*repository.Creation, error)
	GetMarketListings(offset, limit int) ([]*repository.Creation, error)
	SearchCreations(query string, offset, limit int) ([]*repository.Creation, error)
	// 双重确权流程相关方法
	RecordCreationProcess(creationID uint, creatorAddress, modelInfo, promptHash, parameterHash, intermediateSteps, merkleRoot string, contributionFactors interface{}) (string, error)
	ConfirmFinalCreation(creationID uint, creatorAddress, finalContentHash, verificationProof, blockchainTxID string) (string, error)
	GetCreationVerificationStatus(creationID uint) (string, error)
}

// creationService 创作服务实现
type creationService struct {
	creationRepo     repository.CreationRepository
	blockchainClient interface{}
}

// NewCreationService 创建创作服务
func NewCreationService(creationRepo repository.CreationRepository, blockchainClient interface{}) CreationService {
	return &creationService{
		creationRepo:     creationRepo,
		blockchainClient: blockchainClient,
	}
}

// CreateCreation 创建作品
func (s *creationService) CreateCreation(creation *repository.Creation) error {
	return s.creationRepo.Create(creation)
}

// GetCreation 获取作品详情
func (s *creationService) GetCreation(id uint) (*repository.Creation, error) {
	return s.creationRepo.GetByID(id)
}

// GetCreationByTokenID 根据TokenID获取作品
func (s *creationService) GetCreationByTokenID(tokenID int64) (*repository.Creation, error) {
	return s.creationRepo.GetByTokenID(tokenID)
}

// GetCreationsByCreator 获取创作者的作品列表
func (s *creationService) GetCreationsByCreator(creatorAddress string, offset, limit int) ([]*repository.Creation, error) {
	return s.creationRepo.GetByCreator(creatorAddress, offset, limit)
}

// UpdateCreation 更新作品信息
func (s *creationService) UpdateCreation(creation *repository.Creation) error {
	return s.creationRepo.Update(creation)
}

// ListCreations 获取作品列表
func (s *creationService) ListCreations(offset, limit int) ([]*repository.Creation, error) {
	return s.creationRepo.List(offset, limit)
}

// GetMarketListings 获取市场列表
func (s *creationService) GetMarketListings(offset, limit int) ([]*repository.Creation, error) {
	return s.creationRepo.GetMarketListings(offset, limit)
}

// SearchCreations 搜索作品
func (s *creationService) SearchCreations(query string, offset, limit int) ([]*repository.Creation, error) {
	return s.creationRepo.Search(query, offset, limit)
}

// RecordCreationProcess 记录创作过程 - 第一次确权
func (s *creationService) RecordCreationProcess(creationID uint, creatorAddress, modelInfo, promptHash, parameterHash, intermediateSteps, merkleRoot string, contributionFactors interface{}) (string, error) {
	// 获取创作记录
	creation, err := s.creationRepo.GetByID(creationID)
	if err != nil {
		return "", err
	}

	// 验证创作者地址
	if creation.CreatorAddress != creatorAddress {
		return "", fmt.Errorf("unauthorized: creator address mismatch")
	}

	// 生成创作过程哈希
	processHash := fmt.Sprintf("process_%d_%s_%d", creationID, creatorAddress, time.Now().Unix())

	// 更新创作记录
	creation.CreationProcessHash = processHash
	creation.IntermediateSteps = intermediateSteps
	creation.FinalConfirmation = false // 第一次确权，还未最终确认

	if err := s.creationRepo.Update(creation); err != nil {
		return "", err
	}

	return processHash, nil
}

// ConfirmFinalCreation 确认最终创作 - 第二次确权
func (s *creationService) ConfirmFinalCreation(creationID uint, creatorAddress, finalContentHash, verificationProof, blockchainTxID string) (string, error) {
	// 获取创作记录
	creation, err := s.creationRepo.GetByID(creationID)
	if err != nil {
		return "", err
	}

	// 验证创作者地址
	if creation.CreatorAddress != creatorAddress {
		return "", fmt.Errorf("unauthorized: creator address mismatch")
	}

	// 验证是否已经记录过创作过程
	if creation.CreationProcessHash == "" {
		return "", fmt.Errorf("creation process not recorded yet")
	}

	// 生成确认哈希
	confirmationHash := fmt.Sprintf("confirm_%d_%s_%d", creationID, creatorAddress, time.Now().Unix())

	// 更新创作记录
	creation.FinalConfirmation = true
	creation.VerificationProof = verificationProof
	creation.ContentHash = finalContentHash // 更新最终内容哈希

	if err := s.creationRepo.Update(creation); err != nil {
		return "", err
	}

	return confirmationHash, nil
}

// GetCreationVerificationStatus 获取创作验证状态
func (s *creationService) GetCreationVerificationStatus(creationID uint) (string, error) {
	// 获取创作记录
	creation, err := s.creationRepo.GetByID(creationID)
	if err != nil {
		return "", err
	}

	// 根据确权状态返回状态
	if creation.FinalConfirmation {
		return "confirmed", nil
	} else if creation.CreationProcessHash != "" {
		return "pending", nil
	} else {
		return "not_started", nil
	}
}
