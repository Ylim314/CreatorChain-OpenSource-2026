package api

import (
	"net/http"
	"strconv"
	"strings"

	"creatorchain-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type PointsHandler struct {
	userRepo        repository.UserRepository
	adminAddresses  []string
}

func NewPointsHandler(userRepo repository.UserRepository, adminAddresses []string) *PointsHandler {
	return &PointsHandler{
		userRepo:       userRepo,
		adminAddresses: adminAddresses,
	}
}

// isAdmin 检查地址是否为管理员
func (h *PointsHandler) isAdmin(address string) bool {
	if len(h.adminAddresses) == 0 {
		return false
	}
	addressLower := strings.ToLower(address)
	for _, adminAddr := range h.adminAddresses {
		if strings.ToLower(strings.TrimSpace(adminAddr)) == addressLower {
			return true
		}
	}
	return false
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
	// 🔒 安全修复：获取当前认证用户地址
	caller := c.GetString("user_address")
	if caller == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	var req struct {
		// 注意：FromAddress 字段保留仅用于向后兼容，实际不会使用
		// 真正的发送方地址来自认证信息（caller）
		FromAddress string `json:"from_address"` // 不再 required，因为会被忽略
		ToAddress   string `json:"to_address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🔒 安全修复：完全使用认证用户地址作为发送方，忽略请求体中的 FromAddress
	// 这样可以防止任何可能的伪造攻击
	fromAddress := strings.ToLower(strings.TrimSpace(caller))

	// 检查接收方地址格式
	toAddress := strings.ToLower(strings.TrimSpace(req.ToAddress))
	if toAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "接收方地址不能为空"})
		return
	}

	// 防止自己给自己转账
	if fromAddress == toAddress {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能向自己转账"})
		return
	}

	// 检查发送方积分是否足够
	fromUser, err := h.userRepo.GetByAddress(fromAddress)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "发送方用户不存在"})
		return
	}

	if fromUser.Points < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "积分余额不足"})
		return
	}

	// 检查接收方是否存在
	_, err = h.userRepo.GetByAddress(toAddress)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "接收方用户不存在"})
		return
	}

	// 执行积分转移（使用认证用户地址，忽略请求中的 FromAddress）
	err = h.userRepo.TransferPoints(fromAddress, toAddress, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "积分转移失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "积分转移成功",
		"from":    fromAddress,
		"to":      toAddress,
		"amount":  req.Amount,
	})
}

// AddPoints 添加积分（管理员功能）
func (h *PointsHandler) AddPoints(c *gin.Context) {
	// 🔒 安全修复：获取当前认证用户地址
	caller := c.GetString("user_address")
	if caller == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	// 🔒 安全修复：检查调用者是否为管理员
	// 使用小写地址进行比较，确保格式一致
	callerLower := strings.ToLower(strings.TrimSpace(caller))
	if !h.isAdmin(callerLower) {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Forbidden",
			"message": "Only admin can add points",
		})
		return
	}

	var req struct {
		Address     string `json:"address" binding:"required"`
		Amount      int64  `json:"amount" binding:"required,min=1"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 统一地址格式（小写+trim）
	targetAddress := strings.ToLower(strings.TrimSpace(req.Address))
	if targetAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "地址不能为空"})
		return
	}

	// 检查用户是否存在
	user, err := h.userRepo.GetByAddress(targetAddress)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 添加积分
	err = h.userRepo.AddPoints(targetAddress, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "添加积分失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "积分添加成功",
		"address":     targetAddress,
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
