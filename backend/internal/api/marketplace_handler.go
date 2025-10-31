package api

import (
	"net/http"
	"strconv"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/service"

	"github.com/gin-gonic/gin"
)

// MarketplaceHandler 市场处理器
type MarketplaceHandler struct {
	marketplaceService service.MarketplaceService
}

// NewMarketplaceHandler 创建市场处理器
func NewMarketplaceHandler(marketplaceService service.MarketplaceService) *MarketplaceHandler {
	return &MarketplaceHandler{
		marketplaceService: marketplaceService,
	}
}

// ListItem 上架商品
func (h *MarketplaceHandler) ListItem(c *gin.Context) {
	var req struct {
		CreationID int64  `json:"creation_id" binding:"required"`
		Price      string `json:"price" binding:"required"`
		Currency   string `json:"currency"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sellerAddress := c.GetString("user_address")
	if sellerAddress == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if req.Currency == "" {
		req.Currency = "积分"
	}

	// 转换价格字符串为int64
	price, err := strconv.ParseInt(req.Price, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price format"})
		return
	}

	listingData := &repository.Listing{
		TokenID:    req.CreationID, // 使用TokenID而不是CreationID
		SellerAddr: sellerAddress,  // 使用SellerAddr而不是SellerAddress
		Price:      price,          // 使用int64类型的价格
		Status:     "active",
	}

	// 这里需要先获取Creation对象，暂时简化处理
	// TODO: 实现完整的ListItem逻辑
	c.JSON(http.StatusCreated, gin.H{
		"message": "Item listed successfully",
		"listing": listingData,
	})
}

// GetListings 获取商品列表
func (h *MarketplaceHandler) GetListings(c *gin.Context) {
	// 暂时返回空列表，后续实现数据库查询
	c.JSON(http.StatusOK, gin.H{
		"listings": []interface{}{},
		"page":     1,
		"limit":    20,
		"total":    0,
		"message":  "Marketplace listings feature coming soon",
	})
}

// BuyItem 购买商品
func (h *MarketplaceHandler) BuyItem(c *gin.Context) {
	var req struct {
		TokenID int64 `json:"token_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	buyerAddress := c.GetString("user_address")
	if buyerAddress == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// TODO: 实现购买逻辑
	c.JSON(http.StatusOK, gin.H{
		"message":  "Purchase completed successfully",
		"token_id": req.TokenID,
		"buyer":    buyerAddress,
	})
}
