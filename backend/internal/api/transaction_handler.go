package api

import (
	"net/http"
	"strconv"

	"creatorchain-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

// PointsTransactionHandler 积分交易处理器
type PointsTransactionHandler struct {
	pointsRepo repository.PointsTransactionRepository
}

// NewPointsTransactionHandler 创建积分交易处理器
func NewPointsTransactionHandler(pointsRepo repository.PointsTransactionRepository) *PointsTransactionHandler {
	return &PointsTransactionHandler{
		pointsRepo: pointsRepo,
	}
}

// CreatePointsTransaction 创建积分交易记录
func (h *PointsTransactionHandler) CreatePointsTransaction(c *gin.Context) {
	var req struct {
		FromAddress string `json:"from_address"`
		ToAddress   string `json:"to_address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required"`
		Type        string `json:"type" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction := &repository.PointsTransaction{
		FromAddress: req.FromAddress,
		ToAddress:   req.ToAddress,
		Amount:      req.Amount,
		Type:        req.Type,
		Description: req.Description,
	}

	if err := h.pointsRepo.Create(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create points transaction"})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

// GetPointsTransactions 获取积分交易列表
func (h *PointsTransactionHandler) GetPointsTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	address := c.Query("address")
	txType := c.Query("type")

	var transactions []*repository.PointsTransaction
	var err error

	if address != "" {
		transactions, err = h.pointsRepo.GetByAddress(address, offset, limit)
	} else {
		transactions, err = h.pointsRepo.GetAll(offset, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get points transactions"})
		return
	}

	// 过滤结果
	var filteredTransactions []*repository.PointsTransaction
	for _, tx := range transactions {
		if txType != "" && tx.Type != txType {
			continue
		}
		filteredTransactions = append(filteredTransactions, tx)
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": filteredTransactions,
		"page":         page,
		"limit":        limit,
		"total":        len(filteredTransactions),
	})
}

// GetPointsTransaction 获取单个积分交易
func (h *PointsTransactionHandler) GetPointsTransaction(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction ID is required"})
		return
	}

	transactionID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	transaction, err := h.pointsRepo.GetByID(uint(transactionID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// GetPointsStats 获取积分统计
func (h *PointsTransactionHandler) GetPointsStats(c *gin.Context) {
	address := c.Query("address")

	stats, err := h.pointsRepo.GetStats(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get points stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// TransferPoints 转移积分
func (h *PointsTransactionHandler) TransferPoints(c *gin.Context) {
	var req struct {
		FromAddress string `json:"from_address" binding:"required"`
		ToAddress   string `json:"to_address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	// 创建积分转移交易
	transaction := &repository.PointsTransaction{
		FromAddress: req.FromAddress,
		ToAddress:   req.ToAddress,
		Amount:      req.Amount,
		Type:        "transfer",
		Description: req.Description,
	}

	if err := h.pointsRepo.Create(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transfer transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Points transfer initiated",
		"transaction": transaction,
	})
}

// RewardPoints 奖励积分
func (h *PointsTransactionHandler) RewardPoints(c *gin.Context) {
	var req struct {
		ToAddress   string `json:"to_address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required"`
		Type        string `json:"type" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	// 创建积分奖励交易
	transaction := &repository.PointsTransaction{
		ToAddress:   req.ToAddress,
		Amount:      req.Amount,
		Type:        req.Type,
		Description: req.Description,
	}

	if err := h.pointsRepo.Create(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reward transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Points reward issued",
		"transaction": transaction,
	})
}
