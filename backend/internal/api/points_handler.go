package api

import (
	"net/http"
	"strconv"

	"creatorchain-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type PointsHandler struct {
	userRepo repository.UserRepository
}

func NewPointsHandler(userRepo repository.UserRepository) *PointsHandler {
	return &PointsHandler{
		userRepo: userRepo,
	}
}

// GetPointsBalance 获取用户积分余额
func (h *PointsHandler) GetPointsBalance(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "地址不能为空"})
		return
	}

	user, err := h.userRepo.GetByAddress(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"address": address,
		"points":  user.Points,
	})
}

// TransferPoints 转移积分
func (h *PointsHandler) TransferPoints(c *gin.Context) {
	var req struct {
		FromAddress string `json:"from_address" binding:"required"`
		ToAddress   string `json:"to_address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查发送方积分是否足够
	fromUser, err := h.userRepo.GetByAddress(req.FromAddress)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "发送方用户不存在"})
		return
	}

	if fromUser.Points < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "积分余额不足"})
		return
	}

	// 检查接收方是否存在
	_, err = h.userRepo.GetByAddress(req.ToAddress)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "接收方用户不存在"})
		return
	}

	// 执行积分转移
	err = h.userRepo.TransferPoints(req.FromAddress, req.ToAddress, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "积分转移失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "积分转移成功",
		"from":    req.FromAddress,
		"to":      req.ToAddress,
		"amount":  req.Amount,
	})
}

// AddPoints 添加积分（管理员功能）
func (h *PointsHandler) AddPoints(c *gin.Context) {
	var req struct {
		Address     string `json:"address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查用户是否存在
	user, err := h.userRepo.GetByAddress(req.Address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 添加积分
	err = h.userRepo.AddPoints(req.Address, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "添加积分失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "积分添加成功",
		"address":     req.Address,
		"amount":      req.Amount,
		"new_balance": user.Points + req.Amount,
	})
}

// GetPointsHistory 获取积分交易历史
func (h *PointsHandler) GetPointsHistory(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "地址不能为空"})
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// 这里需要实现获取积分交易历史的方法
	// 暂时返回空数组
	c.JSON(http.StatusOK, gin.H{
		"address": address,
		"page":    page,
		"limit":   limit,
		"total":   0,
		"data":    []interface{}{},
	})
}
