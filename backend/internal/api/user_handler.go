package api

import (
	"net/http"
	"regexp"
	"strconv"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/service"

	"github.com/gin-gonic/gin"
)

// UserHandler 用户处理器
type UserHandler struct {
	userService service.UserService
}

// NewUserHandler 创建用户处理器
func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Address   string `json:"address" binding:"required"`
	Signature string `json:"signature" binding:"required"`
	Message   string `json:"message" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string           `json:"token"`
	User  *repository.User `json:"user"`
}

// Login 用户登录
func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证用户身份
	token, err := h.userService.AuthenticateUser(req.Address, req.Signature)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
		return
	}

	// 获取或创建用户
	user, err := h.userService.GetUserByAddress(req.Address)
	if err != nil {
		// 用户不存在，创建新用户
		user = &repository.User{
			Address: req.Address,
		}
		if err := h.userService.CreateUser(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

// Logout 用户登出
func (h *UserHandler) Logout(c *gin.Context) {
	// TODO: 实现登出逻辑，清除token
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetProfile 获取用户资料
func (h *UserHandler) GetProfile(c *gin.Context) {
	address := c.Query("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address is required"})
		return
	}

	user, err := h.userService.GetUserByAddress(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfileRequest 更新资料请求
type UpdateProfileRequest struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	Bio       string `json:"bio"`
}

// UpdateProfile 更新用户资料
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 输入验证
	if len(req.Username) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名长度不能超过50个字符"})
		return
	}
	if len(req.Bio) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "个人简介长度不能超过500个字符"})
		return
	}
	if req.Email != "" && !isValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "邮箱格式不正确"})
		return
	}

	address := c.GetString("user_address")
	if address == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user, err := h.userService.UpdateProfile(address, req.Username, req.Bio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// Register 注册用户
func (h *UserHandler) Register(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.Register(req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// GetUser 获取用户信息
func (h *UserHandler) GetUser(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address is required"})
		return
	}

	user, err := h.userService.GetUserByAddress(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ToggleFavorite 切换收藏状态
func (h *UserHandler) ToggleFavorite(c *gin.Context) {
	creationID := c.Param("id")
	if creationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Creation ID is required"})
		return
	}

	address := c.GetString("user_address")
	if address == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 将字符串ID转换为uint
	id, err := strconv.ParseUint(creationID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid creation ID"})
		return
	}

	isLiked, err := h.userService.ToggleFavorite(address, uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle favorite"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_liked": isLiked,
		"message": func() string {
			if isLiked {
				return "已添加到收藏"
			}
			return "已取消收藏"
		}(),
	})
}

// GetFavorites 获取用户收藏列表
func (h *UserHandler) GetFavorites(c *gin.Context) {
	address := c.GetString("user_address")
	if address == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	favorites, err := h.userService.GetFavorites(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"favorites": favorites})
}

// isValidEmail 验证邮箱格式
func isValidEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(pattern)
	return re.MatchString(email)
}
