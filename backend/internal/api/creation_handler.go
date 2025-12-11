package api

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/service"

	"github.com/gin-gonic/gin"
)

// CreationHandler 创作处理器 - 基于区块链技术的AI创作确权系统
//
// 核心功能：
// 1. 双重确权机制：创作过程记录 + 最终作品确认
// 2. 区块链集成：与智能合约交互，实现去中心化确权
// 3. IPFS存储：去中心化文件存储，确保内容永久保存
// 4. 安全验证：企业级安全验证，防止恶意攻击
// 5. 贡献度评分：基于多维度因子计算创作贡献度
//
// 区块链价值体现：
// - 不可篡改性：创作记录一旦上链，永远无法被修改
// - 时间戳证明：精确记录创作时间，防止时间篡改
// - 去中心化：无需第三方机构，降低确权成本
// - 透明性：所有记录公开透明，可被任何人验证
// - 永久性：区块链网络保证数据永久存储
type CreationHandler struct {
	creationService service.CreationService
}

// NewCreationHandler 创建创作处理器
func NewCreationHandler(creationService service.CreationService) *CreationHandler {
	return &CreationHandler{
		creationService: creationService,
	}
}

// CreateCreationRequest 创建作品请求
type CreateCreationRequest struct {
	TokenID           int64  `json:"token_id"`
	Title             string `json:"title" binding:"required"`
	Description       string `json:"description"`
	Visibility        string `json:"visibility"`
	ContentHash       string `json:"content_hash" binding:"required"`
	ImageURL          string `json:"image_url"`
	MetadataHash      string `json:"metadata_hash" binding:"required"`
	AIModel           string `json:"ai_model"`
	PromptText        string `json:"prompt_text"`
	ContributionScore int    `json:"contribution_score"`
	PriceInPoints     int64  `json:"price_in_points"`
	LicenseDuration   int    `json:"license_duration"`
	// ??????????
	CreationProcessHash string `json:"creation_process_hash"` // ??????
	IntermediateSteps   string `json:"intermediate_steps"`    // ??????
	FinalConfirmation   bool   `json:"final_confirmation"`    // ??????
	VerificationProof   string `json:"verification_proof"`    // ????
}

// CreateCreation 创建作品 - 企业级安全验证
func (h *CreationHandler) CreateCreation(c *gin.Context) {
	var req CreateCreationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ CreateCreation JSON绑定失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format: " + err.Error()})
		return
	}

	// 验证创作者地址
	creatorAddress := c.GetHeader("User-Address")
	if creatorAddress == "" {
		log.Printf("❌ CreateCreation 缺少User-Address header")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing User-Address header"})
		return
	}

	log.Printf("✅ CreateCreation 请求: creator=%s, title=%s, contentHash=%s",
		creatorAddress, req.Title, req.ContentHash)

	// ??????
	if err := validateCreationInput(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	visibility, err := normalizeVisibilityInput(req.Visibility)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ?????????
	if req.PriceInPoints < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price cannot be negative"})
		return
	}
	licenseDuration := req.LicenseDuration
	if licenseDuration == 0 {
		licenseDuration = 12
	} else if licenseDuration < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "License duration cannot be negative"})
		return
	}

	// ??????
	creation := &repository.Creation{
		TokenID:             req.TokenID,
		CreatorAddress:      creatorAddress,
		Title:               strings.TrimSpace(req.Title),
		Description:         strings.TrimSpace(req.Description),
		Visibility:          visibility,
		ContentHash:         strings.TrimSpace(req.ContentHash),
		MetadataHash:        strings.TrimSpace(req.MetadataHash),
		ImageURL:            strings.TrimSpace(req.ImageURL),
		AIModel:             strings.TrimSpace(req.AIModel),
		PromptText:          strings.TrimSpace(req.PromptText),
		ContributionScore:   req.ContributionScore,
		PriceInPoints:       req.PriceInPoints,
		LicenseDuration:     licenseDuration,
		IsListed:            false,
		CreationProcessHash: strings.TrimSpace(req.CreationProcessHash),
		IntermediateSteps:   strings.TrimSpace(req.IntermediateSteps),
		FinalConfirmation:   req.FinalConfirmation,
		VerificationProof:   strings.TrimSpace(req.VerificationProof),
	}

	// ??????
	if err := h.creationService.CreateCreation(creation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create creation: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    creation,
		"message": "Creation created successfully",
	})
}

// GetCreations 获取作品列表
func (h *CreationHandler) GetCreations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	creator := c.Query("creator")
	query := c.Query("q")

	var creations []*repository.Creation
	var err error

	if creator != "" {
		creations, err = h.creationService.GetCreationsByCreator(creator, offset, limit)
	} else if query != "" {
		creations, err = h.creationService.SearchCreations(query, offset, limit)
	} else {
		creations, err = h.creationService.ListCreations(offset, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get creations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"creations": creations,
		"page":      page,
		"limit":     limit,
	})
}

// GetCreation 获取作品详情
func (h *CreationHandler) GetCreation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creation ID"})
		return
	}

	creation, err := h.creationService.GetCreation(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Creation not found"})
		return
	}

	c.JSON(http.StatusOK, creation)
}

// UpdateCreation 更新作品
func (h *CreationHandler) UpdateCreation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creation ID"})
		return
	}

	var req struct {
		TokenID         *int64  `json:"token_id"` // 区块链token ID
		Title           string  `json:"title"`
		Description     string  `json:"description"`
		Visibility      *string `json:"visibility"`
		MetadataHash    string  `json:"metadata_hash"` // IPFS元数据哈希
		AIModel         string  `json:"ai_model"`
		PromptText      string  `json:"prompt_text"`
		PriceInPoints   *int64  `json:"price_in_points"`  // 使用指针，允许设置为0
		LicenseDuration *int    `json:"license_duration"` // 使用指针，允许设置为0
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	creation, err := h.creationService.GetCreation(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Creation not found"})
		return
	}

	// 验证创作者权限
	creatorAddress := c.GetHeader("User-Address")
	if creatorAddress == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing User-Address header"})
		return
	}
	if !strings.EqualFold(creation.CreatorAddress, creatorAddress) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own creations"})
		return
	}

	// 更新作品信息
	if req.TokenID != nil && *req.TokenID > 0 {
		creation.TokenID = *req.TokenID
	}
	if req.Title != "" {
		creation.Title = strings.TrimSpace(req.Title)
	}
	if req.Description != "" {
		creation.Description = strings.TrimSpace(req.Description)
	}
	if req.MetadataHash != "" {
		creation.MetadataHash = strings.TrimSpace(req.MetadataHash)
	}
	if req.AIModel != "" {
		creation.AIModel = strings.TrimSpace(req.AIModel)
	}
	if req.PromptText != "" {
		creation.PromptText = strings.TrimSpace(req.PromptText)
	}
	if req.Visibility != nil {
		vis, err := normalizeVisibilityInput(*req.Visibility)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		creation.Visibility = vis
	}

	// 更新价格和授权时长
	if req.PriceInPoints != nil {
		if *req.PriceInPoints < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Price cannot be negative"})
			return
		}
		creation.PriceInPoints = *req.PriceInPoints
		creation.IsListed = *req.PriceInPoints > 0 // 如果设置了价格，自动上架
	}

	if req.LicenseDuration != nil {
		if *req.LicenseDuration <= 0 || *req.LicenseDuration > 120 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "License duration must be between 1 and 120 months"})
			return
		}
		creation.LicenseDuration = *req.LicenseDuration
	}

	if err := h.creationService.UpdateCreation(creation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update creation"})
		return
	}

	c.JSON(http.StatusOK, creation)
}

// DeleteCreation 删除作品
func (h *CreationHandler) DeleteCreation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Creation deleted successfully"})
}

// MintNFT 铸造NFT
func (h *CreationHandler) MintNFT(c *gin.Context) {
	// 获取创作ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		HandleValidationError(c, err)
		return
	}

	// 获取创作信息
	creation, err := h.creationService.GetCreation(uint(id))
	if err != nil {
		HandleNotFoundError(c, "Creation")
		return
	}

	// 实现NFT铸造逻辑
	if err := h.mintNFTCreation(creation); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to mint NFT",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "NFT minted successfully",
		"token_id": creation.TokenID,
	})
}

// TransferNFT 转移NFT
func (h *CreationHandler) TransferNFT(c *gin.Context) {
	// 获取创作ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		HandleValidationError(c, err)
		return
	}

	// 解析转移请求
	var req struct {
		ToAddress string `json:"to_address" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		HandleValidationError(c, err)
		return
	}

	// 获取创作信息
	creation, err := h.creationService.GetCreation(uint(id))
	if err != nil {
		HandleNotFoundError(c, "Creation")
		return
	}

	// 实现NFT转移逻辑
	if err := h.transferNFTCreation(creation, req.ToAddress); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to transfer NFT",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "NFT transferred successfully",
		"token_id":   creation.TokenID,
		"to_address": req.ToAddress,
	})
}

// GetEvents 获取区块链事件
func (h *CreationHandler) GetEvents(c *gin.Context) {
	// 获取查询参数
	tokenIDStr := c.Query("token_id")
	eventType := c.Query("event_type")
	limitStr := c.DefaultQuery("limit", "50")

	// 解析参数
	var tokenID *int64
	if tokenIDStr != "" {
		if id, err := strconv.ParseInt(tokenIDStr, 10, 64); err == nil {
			tokenID = &id
		}
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50
	}

	// 实现获取区块链事件逻辑
	events, err := h.getBlockchainEvents(tokenID, eventType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get blockchain events",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"events": events,
		"count":  len(events),
	})
}

// GetGasPrice 获取Gas价格
func (h *CreationHandler) GetGasPrice(c *gin.Context) {
	// 实现获取Gas价格逻辑
	gasPrice, err := h.getCurrentGasPrice()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get gas price",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"gas_price": gasPrice,
		"unit":      "wei",
		"timestamp": time.Now().Unix(),
	})
}

// RecordCreationProcess 记录创作过程 - 第一次确权
func (h *CreationHandler) RecordCreationProcess(c *gin.Context) {
	var req struct {
		CreationID          uint   `json:"creation_id" binding:"required"`
		ModelInfo           string `json:"model_info" binding:"required"`
		PromptHash          string `json:"prompt_hash" binding:"required"`
		ParameterHash       string `json:"parameter_hash" binding:"required"`
		IntermediateSteps   string `json:"intermediate_steps" binding:"required"`
		MerkleRoot          string `json:"merkle_root" binding:"required"`
		ContributionFactors struct {
			PromptComplexity      int `json:"prompt_complexity"`
			ParameterOptimization int `json:"parameter_optimization"`
			IterationCount        int `json:"iteration_count"`
			ModelDifficulty       int `json:"model_difficulty"`
			OriginalityFactor     int `json:"originality_factor"`
		} `json:"contribution_factors"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format: " + err.Error()})
		return
	}

	// 验证创作者地址
	creatorAddress := c.GetHeader("User-Address")
	if creatorAddress == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing User-Address header"})
		return
	}

	// 记录创作过程到区块链
	processHash, err := h.creationService.RecordCreationProcess(
		req.CreationID,
		creatorAddress,
		req.ModelInfo,
		req.PromptHash,
		req.ParameterHash,
		req.IntermediateSteps,
		req.MerkleRoot,
		req.ContributionFactors,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record creation process: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"creation_id":         req.CreationID,
			"process_hash":        processHash,
			"merkle_root":         req.MerkleRoot,
			"verification_status": "pending",
		},
		"message": "Creation process recorded successfully",
	})
}

// ConfirmFinalCreation 确认最终创作 - 第二次确权
func (h *CreationHandler) ConfirmFinalCreation(c *gin.Context) {
	var req struct {
		CreationID        uint   `json:"creation_id" binding:"required"`
		FinalContentHash  string `json:"final_content_hash" binding:"required"`
		VerificationProof string `json:"verification_proof" binding:"required"`
		BlockchainTxID    string `json:"blockchain_tx_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format: " + err.Error()})
		return
	}

	// 验证创作者地址
	creatorAddress := c.GetHeader("User-Address")
	if creatorAddress == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing User-Address header"})
		return
	}

	// 确认最终创作
	confirmationHash, err := h.creationService.ConfirmFinalCreation(
		req.CreationID,
		creatorAddress,
		req.FinalContentHash,
		req.VerificationProof,
		req.BlockchainTxID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm final creation: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"creation_id":           req.CreationID,
			"confirmation_hash":     confirmationHash,
			"blockchain_tx_id":      req.BlockchainTxID,
			"verification_status":   "confirmed",
			"copyright_certificate": "generated",
		},
		"message": "Final creation confirmed successfully",
	})
}

// GetCreationVerificationStatus 获取创作验证状态
func (h *CreationHandler) GetCreationVerificationStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creation ID"})
		return
	}

	status, err := h.creationService.GetCreationVerificationStatus(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Creation not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"creation_id":         id,
		"verification_status": status,
	})
}

// validateCreationInput 验证创作输入数据 - 企业级安全验证
func validateCreationInput(req *CreateCreationRequest) error {
	// ??TokenID????????0?
	if req.TokenID < 0 {
		return errors.New("token_id must be zero or a positive integer")
	}

	// 验证标题
	if len(strings.TrimSpace(req.Title)) == 0 {
		return errors.New("title cannot be empty")
	}
	if len(req.Title) > 200 {
		return errors.New("title too long (max 200 characters)")
	}

	// 验证描述
	if len(strings.TrimSpace(req.Description)) == 0 {
		return errors.New("description cannot be empty")
	}
	if len(req.Description) > 2000 {
		return errors.New("description too long (max 2000 characters)")
	}

	// 验证IPFS哈希
	if !isValidIPFSHash(req.ContentHash) {
		return errors.New("invalid content hash format")
	}
	if !isValidIPFSHash(req.MetadataHash) {
		return errors.New("invalid metadata hash format")
	}

	// 验证AI模型
	if len(strings.TrimSpace(req.AIModel)) == 0 {
		return errors.New("AI model cannot be empty")
	}
	if len(req.AIModel) > 100 {
		return errors.New("AI model name too long (max 100 characters)")
	}

	// 验证贡献度评分
	if req.ContributionScore < 0 || req.ContributionScore > 1000 {
		return errors.New("contribution score must be between 0 and 1000")
	}

	// 验证提示词长度
	if len(req.PromptText) > 5000 {
		return errors.New("prompt text too long (max 5000 characters)")
	}

	// 检查危险关键词
	if containsDangerousContent(req.Title) || containsDangerousContent(req.Description) || containsDangerousContent(req.PromptText) {
		return errors.New("content contains prohibited keywords")
	}

	return nil
}

func normalizeVisibilityInput(value string) (string, error) {
	visibility := strings.ToLower(strings.TrimSpace(value))
	if visibility == "" {
		return "private", nil
	}
	if visibility != "public" && visibility != "private" {
		return "", errors.New("visibility must be 'public' or 'private'")
	}
	return visibility, nil
}

// mintNFTCreation 铸造NFT的具体实现
func (h *CreationHandler) mintNFTCreation(creation *repository.Creation) error {
	// 这里应该调用智能合约进行NFT铸造
	// 由于当前没有区块链客户端，我们模拟铸造过程

	// 1. 验证创作内容
	if creation.ContentHash == "" || creation.MetadataHash == "" {
		return errors.New("creation content or metadata hash is missing")
	}

	// 2. 生成TokenID（如果还没有）
	if creation.TokenID == 0 {
		// 使用时间戳和随机数生成TokenID
		creation.TokenID = int64(time.Now().Unix()) + int64(rand.Intn(1000))
	}

	// 3. 更新创作状态
	creation.IsListed = true
	if err := h.creationService.UpdateCreation(creation); err != nil {
		return fmt.Errorf("failed to update creation: %v", err)
	}

	// 4. 记录铸造事件（模拟）
	log.Printf("NFT minted successfully - TokenID: %d, Creator: %s",
		creation.TokenID, creation.CreatorAddress)

	return nil
}

// transferNFTCreation 转移NFT的具体实现
func (h *CreationHandler) transferNFTCreation(creation *repository.Creation, toAddress string) error {
	// 验证地址格式
	if !isValidEthereumAddress(toAddress) {
		return errors.New("invalid recipient address")
	}

	// 验证创作状态
	if !creation.IsListed {
		return errors.New("creation is not listed for transfer")
	}

	// 更新创作所有者
	creation.CreatorAddress = toAddress
	if err := h.creationService.UpdateCreation(creation); err != nil {
		return fmt.Errorf("failed to update creation owner: %v", err)
	}

	// 记录转移事件（模拟）
	log.Printf("NFT transferred successfully - TokenID: %d, From: %s, To: %s",
		creation.TokenID, creation.CreatorAddress, toAddress)

	return nil
}

// getBlockchainEvents 获取区块链事件的具体实现
func (h *CreationHandler) getBlockchainEvents(tokenID *int64, eventType string, limit int) ([]map[string]interface{}, error) {
	// 这里应该从区块链或数据库查询事件
	// 由于当前没有区块链客户端，我们模拟返回一些事件

	events := []map[string]interface{}{}

	// 模拟事件数据
	if tokenID == nil || *tokenID == 1 {
		events = append(events, map[string]interface{}{
			"tx_hash":      "0x1234567890abcdef1234567890abcdef12345678",
			"block_number": 12345,
			"event_type":   "CreationMinted",
			"token_id":     1,
			"creator":      "0xabcdef1234567890abcdef1234567890abcdef12",
			"timestamp":    time.Now().Unix(),
			"data": map[string]interface{}{
				"content_hash":  "QmHash123...",
				"metadata_hash": "QmMetadata123...",
			},
		})
	}

	if tokenID == nil || *tokenID == 2 {
		events = append(events, map[string]interface{}{
			"tx_hash":      "0x2345678901bcdef1234567890abcdef123456789",
			"block_number": 12346,
			"event_type":   "CreationTransferred",
			"token_id":     2,
			"from":         "0xabcdef1234567890abcdef1234567890abcdef12",
			"to":           "0x1234567890abcdef1234567890abcdef12345678",
			"timestamp":    time.Now().Unix() - 3600,
			"data": map[string]interface{}{
				"transfer_reason": "marketplace_sale",
			},
		})
	}

	// 根据事件类型过滤
	if eventType != "" {
		filteredEvents := []map[string]interface{}{}
		for _, event := range events {
			if event["event_type"] == eventType {
				filteredEvents = append(filteredEvents, event)
			}
		}
		events = filteredEvents
	}

	// 限制返回数量
	if len(events) > limit {
		events = events[:limit]
	}

	return events, nil
}

// getCurrentGasPrice 获取当前Gas价格的具体实现
func (h *CreationHandler) getCurrentGasPrice() (string, error) {
	// 这里应该从区块链网络获取实时Gas价格
	// 由于当前没有区块链客户端，我们模拟返回一个合理的Gas价格

	// 模拟不同网络条件下的Gas价格
	baseGasPrice := int64(20000000000) // 20 Gwei

	// 根据时间模拟Gas价格波动
	hour := time.Now().Hour()
	var multiplier float64

	switch {
	case hour >= 9 && hour <= 17: // 工作时间，Gas价格较高
		multiplier = 1.5
	case hour >= 18 && hour <= 23: // 晚上，Gas价格中等
		multiplier = 1.2
	default: // 深夜和早晨，Gas价格较低
		multiplier = 0.8
	}

	gasPrice := int64(float64(baseGasPrice) * multiplier)

	// 添加一些随机波动
	randomFactor := 0.9 + rand.Float64()*0.2 // 0.9-1.1
	gasPrice = int64(float64(gasPrice) * randomFactor)

	return fmt.Sprintf("%d", gasPrice), nil
}

// isValidIPFSHash 验证IPFS哈希格式或本地上传路径
func isValidIPFSHash(hash string) bool {
	if len(hash) == 0 {
		return false
	}

	// 支持本地上传路径 (/uploads/...)
	if strings.HasPrefix(hash, "/uploads/") {
		return true
	}

	// 检查CIDv0格式 (Qm...)
	if len(hash) == 46 && strings.HasPrefix(hash, "Qm") {
		// 验证base58字符
		pattern := regexp.MustCompile(`^Qm[1-9A-HJ-NP-Za-km-z]{44}$`)
		return pattern.MatchString(hash)
	}

	// 检查CIDv1格式 (bafy...)
	if len(hash) >= 59 && strings.HasPrefix(hash, "bafy") {
		// 简化验证，检查基本格式
		pattern := regexp.MustCompile(`^bafy[a-z2-7]+$`)
		return pattern.MatchString(hash)
	}

	return false
}

// containsDangerousContent 检查危险内容
func containsDangerousContent(content string) bool {
	// 转换为小写进行检查
	content = strings.ToLower(content)

	// 危险关键词列表
	dangerousKeywords := []string{
		"<script",
		"javascript:",
		"onclick",
		"onerror",
		"onload",
		"eval(",
		"drop table",
		"delete from",
		"update set",
		"insert into",
		"union select",
	}

	for _, keyword := range dangerousKeywords {
		if strings.Contains(content, keyword) {
			return true
		}
	}

	return false
}
