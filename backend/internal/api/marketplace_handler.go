package api

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MarketplaceHandler 市场处理器
type MarketplaceHandler struct {
	marketplaceService service.MarketplaceService
	userRepo           repository.UserRepository
	licenseRepo        repository.LicenseRepository
	creationRepo       repository.CreationRepository
	db                 *gorm.DB // 添加数据库访问以支持事务
}

// NewMarketplaceHandler 创建市场处理器
func NewMarketplaceHandler(marketplaceService service.MarketplaceService, userRepo repository.UserRepository, licenseRepo repository.LicenseRepository, creationRepo repository.CreationRepository, db *gorm.DB) *MarketplaceHandler {
	return &MarketplaceHandler{
		marketplaceService: marketplaceService,
		userRepo:           userRepo,
		licenseRepo:        licenseRepo,
		creationRepo:       creationRepo,
		db:                 db,
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

// BuyItem 购买商品/授权
func (h *MarketplaceHandler) BuyItem(c *gin.Context) {
	// 记录请求开始
	log.Printf("🔍 BuyItem: Request received - Method: %s, Path: %s, Content-Type: %s",
		c.Request.Method, c.Request.URL.Path, c.GetHeader("Content-Type"))
	
	// 记录认证信息
	buyerAddress := c.GetString("user_address")
	log.Printf("🔍 BuyItem: Authentication check - user_address: %s", buyerAddress)
	
	if buyerAddress == "" {
		log.Printf("❌ BuyItem: User not authenticated (user_address is empty)")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		TokenID     int64  `json:"token_id"`
		CreationID  uint   `json:"creation_id"`
		Price       int64  `json:"price"`
		LicenseType string `json:"license_type"`
		Duration    int    `json:"duration"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ BuyItem: JSON binding error: %v", err)
		// 提供更友好的错误消息
		errorMsg := err.Error()
		if strings.Contains(errorMsg, "cannot unmarshal string into") {
			errorMsg = "Invalid data type: creation_id must be a number, not a string"
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": errorMsg})
		return
	}

	log.Printf("🔍 BuyItem: Request received - buyer: %s, token_id: %d, creation_id: %d, price: %d, license_type: %s, duration: %d",
		buyerAddress, req.TokenID, req.CreationID, req.Price, req.LicenseType, req.Duration)

	// 获取创作信息 - 优先使用 creation_id，如果没有则使用 token_id
	var creation *repository.Creation
	var err error
	
	if req.CreationID > 0 {
		// 如果提供了 creation_id，使用它查找
		log.Printf("🔍 BuyItem: Looking up creation by ID: %d", req.CreationID)
		creation, err = h.creationRepo.GetByID(req.CreationID)
		if err != nil {
			log.Printf("❌ BuyItem: Creation not found for ID: %d, error: %v", req.CreationID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Creation not found"})
			return
		}
		// 如果找到了，使用 creation 的 token_id 作为后续操作的 token_id
		if req.TokenID == 0 {
			req.TokenID = creation.TokenID
		}
	} else if req.TokenID > 0 {
		// 如果只提供了 token_id，使用它查找
		log.Printf("🔍 BuyItem: Looking up creation by TokenID: %d", req.TokenID)
		creation, err = h.creationRepo.GetByTokenID(req.TokenID)
		if err != nil {
			log.Printf("❌ BuyItem: Creation not found for token_id: %d, error: %v", req.TokenID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Creation not found"})
			return
		}
	} else {
		log.Printf("❌ BuyItem: Neither creation_id nor token_id provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either creation_id or token_id is required"})
		return
	}

	log.Printf("✅ BuyItem: Found creation - creator: %s", creation.CreatorAddress)

	// 🔒 安全修复：验证价格是否与创作的实际价格一致（防止价格篡改攻击）
	if req.Price > 0 && creation.PriceInPoints > 0 {
		if req.Price != creation.PriceInPoints {
			log.Printf("❌ BuyItem: Price mismatch - requested: %d, actual: %d", req.Price, creation.PriceInPoints)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Price mismatch",
				"message": "The requested price does not match the creation's actual price",
				"expected_price": creation.PriceInPoints,
				"provided_price": req.Price,
			})
			return
		}
		log.Printf("✅ BuyItem: Price verified - %d points", req.Price)
	}

	// 判断是否为购买授权：如果提供了 license_type 和 duration，或者 price > 0，则认为是购买授权
	isLicensePurchase := (req.LicenseType != "" && req.Duration > 0) || req.Price > 0

	log.Printf("🔍 BuyItem: isLicensePurchase: %v", isLicensePurchase)

	if isLicensePurchase {
		// 验证必需字段
		if req.Price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be greater than 0"})
			return
		}
		
		// 🔒 安全修复：再次验证价格（双重检查）
		if creation.PriceInPoints > 0 && req.Price != creation.PriceInPoints {
			log.Printf("❌ BuyItem: Price validation failed - requested: %d, actual: %d", req.Price, creation.PriceInPoints)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Price validation failed",
				"message": "The price does not match the creation's listed price",
			})
			return
		}
		// 如果没有提供 license_type，使用默认值 "standard"
		if req.LicenseType == "" {
			req.LicenseType = "standard"
			log.Printf("🔍 BuyItem: Using default license type: standard")
		}
		// 如果没有提供 duration，使用默认值 365 天（1年）
		if req.Duration <= 0 {
			req.Duration = 365
			log.Printf("🔍 BuyItem: Using default duration: 365 days")
		}

		// 检查买家积分是否足够
		buyer, err := h.userRepo.GetByAddress(buyerAddress)
		if err != nil {
			log.Printf("❌ BuyItem: Buyer not found - address: %s, error: %v", buyerAddress, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Buyer not found"})
			return
		}

		log.Printf("💰 BuyItem: Buyer current points: %d, required: %d", buyer.Points, req.Price)

		if buyer.Points < req.Price {
			log.Printf("❌ BuyItem: Insufficient points - have: %d, need: %d", buyer.Points, req.Price)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient points"})
			return
		}

		// 🔒 安全修复：使用数据库事务确保积分转移和授权创建的原子性
		// 如果授权创建失败，自动回滚积分转移
		log.Printf("🔄 BuyItem: Starting transaction - transferring %d points from %s to %s", req.Price, buyerAddress, creation.CreatorAddress)
		
		expiresAt := time.Now().AddDate(0, 0, req.Duration)
		license := &repository.License{
			TokenID:      req.TokenID,
			LicenseType:  req.LicenseType,
			LicensorAddr: creation.CreatorAddress,
			LicenseeAddr: buyerAddress,
			Price:        strconv.FormatInt(req.Price, 10),
			Duration:     req.Duration,
			Status:       "active",
			ExpiresAt:    &expiresAt,
		}

		// 在事务中执行积分转移和授权创建
		err = h.db.Transaction(func(tx *gorm.DB) error {
			// 1. 检查买家余额（在事务中再次验证，防止并发问题）
			var buyerInTx repository.User
			if err := tx.Where("address = ?", buyerAddress).First(&buyerInTx).Error; err != nil {
				return err
			}
			if buyerInTx.Points < req.Price {
				return fmt.Errorf("insufficient points: have %d, need %d", buyerInTx.Points, req.Price)
			}

			// 2. 扣除买家积分
			if err := tx.Model(&repository.User{}).Where("address = ?", buyerAddress).
				Update("points", gorm.Expr("points - ?", req.Price)).Error; err != nil {
				return fmt.Errorf("failed to deduct buyer points: %w", err)
			}

			// 3. 增加创作者积分
			if err := tx.Model(&repository.User{}).Where("address = ?", creation.CreatorAddress).
				Update("points", gorm.Expr("points + ?", req.Price)).Error; err != nil {
				return fmt.Errorf("failed to add creator points: %w", err)
			}

			// 4. 记录积分交易
			transaction := repository.PointsTransaction{
				FromAddress: buyerAddress,
				ToAddress:   creation.CreatorAddress,
				Amount:      req.Price,
				Type:        "purchase",
				Description: "购买授权",
			}
			if err := tx.Create(&transaction).Error; err != nil {
				return fmt.Errorf("failed to create points transaction: %w", err)
			}

			// 5. 创建授权记录
			if err := tx.Create(license).Error; err != nil {
				return fmt.Errorf("failed to create license record: %w", err)
			}

			log.Printf("✅ BuyItem: Transaction completed successfully - license_id: %d", license.ID)
			return nil
		})

		if err != nil {
			log.Printf("❌ BuyItem: Transaction failed - error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Purchase failed",
				"details": err.Error(),
				"message": "The transaction was rolled back. No points were deducted.",
			})
			return
		}
		log.Printf("✅ BuyItem: Points transferred and license created successfully - license_id: %d", license.ID)

		// 获取更新后的积分余额
		updatedBuyer, err := h.userRepo.GetByAddress(buyerAddress)
		if err != nil {
			log.Printf("⚠️ BuyItem: Could not retrieve updated balance - error: %v", err)
			// 即使获取更新后的余额失败，也返回成功，因为授权已创建
			c.JSON(http.StatusOK, gin.H{
				"message":      "License purchased successfully",
				"token_id":     req.TokenID,
				"license_id":   license.ID,
				"buyer":        buyerAddress,
				"price":        req.Price,
				"license_type": req.LicenseType,
				"duration":     req.Duration,
				"warning":      "Could not retrieve updated balance, please refresh",
			})
			return
		}

		log.Printf("✅ BuyItem: License purchase completed - buyer: %s, new_balance: %d, license_id: %d",
			buyerAddress, updatedBuyer.Points, license.ID)

		c.JSON(http.StatusOK, gin.H{
			"message":      "License purchased successfully",
			"token_id":     req.TokenID,
			"license_id":   license.ID,
			"buyer":        buyerAddress,
			"price":        req.Price,
			"new_balance":  updatedBuyer.Points,
			"license_type": req.LicenseType,
			"duration":     req.Duration,
		})
		return
	}

	// 普通购买逻辑（暂时保留）
	log.Printf("⚠️ BuyItem: Regular purchase (not license) - buyer: %s, token_id: %d", buyerAddress, req.TokenID)
	c.JSON(http.StatusOK, gin.H{
		"message":  "Purchase completed successfully",
		"token_id": req.TokenID,
		"buyer":    buyerAddress,
	})
}

// GetMyLicenses 获取用户的授权列表
func (h *MarketplaceHandler) GetMyLicenses(c *gin.Context) {
	userAddress := c.GetString("user_address")
	if userAddress == "" {
		log.Printf("❌ GetMyLicenses: User not authenticated (user_address is empty)")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 获取分页参数
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if limit > 100 {
		limit = 100
	}

	log.Printf("🔍 GetMyLicenses: Querying licenses for user: %s, offset: %d, limit: %d", userAddress, offset, limit)
	licenses, err := h.licenseRepo.GetByLicensee(userAddress, offset, limit)
	if err != nil {
		log.Printf("❌ GetMyLicenses: Failed to get licenses - error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get licenses"})
		return
	}

	log.Printf("✅ GetMyLicenses: Found %d licenses for user: %s", len(licenses), userAddress)
	c.JSON(http.StatusOK, gin.H{
		"licenses": licenses,
		"offset":   offset,
		"limit":    limit,
		"total":    len(licenses),
	})
}
