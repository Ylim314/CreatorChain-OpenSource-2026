package service

import (
	"strconv"

	"creatorchain-backend/internal/repository"
)

// MarketplaceService 市场服务接口
type MarketplaceService interface {
	ListItem(creation *repository.Creation, price string) error
	BuyItem(tokenID int64, buyerAddress string) error
	GetTransactionHistory(address string, offset, limit int) ([]*repository.Transaction, error)
}

// marketplaceService 市场服务实现
type marketplaceService struct {
	txRepo           repository.TransactionRepository
	blockchainClient interface{}
}

// NewMarketplaceService 创建市场服务
func NewMarketplaceService(txRepo repository.TransactionRepository, blockchainClient interface{}) MarketplaceService {
	return &marketplaceService{
		txRepo:           txRepo,
		blockchainClient: blockchainClient,
	}
}

// ListItem 上架物品 - 企业级修复
func (s *marketplaceService) ListItem(creation *repository.Creation, price string) error {
	// TODO: 调用智能合约上架物品
	creation.IsListed = true
	// 将字符串价格转换为int64
	if priceInt, err := strconv.ParseInt(price, 10, 64); err == nil {
		creation.PriceInPoints = priceInt
	}
	return nil
}

// BuyItem 购买物品
func (s *marketplaceService) BuyItem(tokenID int64, buyerAddress string) error {
	// TODO: 调用智能合约购买物品
	return nil
}

// GetTransactionHistory 获取交易历史
func (s *marketplaceService) GetTransactionHistory(address string, offset, limit int) ([]*repository.Transaction, error) {
	return s.txRepo.GetByAddress(address, offset, limit)
}
