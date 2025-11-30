package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/security"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

// UserService 用户服务接口
type UserService interface {
	CreateUser(user *repository.User) error
	GetUserByAddress(address string) (*repository.User, error)
	UpdateUser(user *repository.User) error
	AuthenticateUser(address, message, signature, timestamp string) (string, error)
	Register(address string) (*repository.User, error)
	Login(address string) (string, error)
	GetUser(address string) (*repository.User, error)
	UpdateProfile(address string, username, bio string) (*repository.User, error)
	ToggleFavorite(userAddress string, creationID uint) (bool, error)
	GetFavorites(userAddress string) ([]repository.Creation, error)
}

// userService 用户服务实现
type userService struct {
	userRepo  repository.UserRepository
	redis     *redis.Client
	jwtSecret string
}

var (
	loginTimestampWindow = 5 * time.Minute
	loginTimestampGuard  = security.NewTimestampGuard()
)

// NewUserService 创建用户服务
func NewUserService(userRepo repository.UserRepository, redis *redis.Client) UserService {
	// 使用固定的JWT密钥，确保重启后token仍然有效
	jwtSecret := getJWTSecret()
	return &userService{
		userRepo:  userRepo,
		redis:     redis,
		jwtSecret: jwtSecret,
	}
}

// CreateUser 创建用户
func (s *userService) CreateUser(user *repository.User) error {
	return s.userRepo.Create(user)
}

// GetUserByAddress 根据地址获取用户
func (s *userService) GetUserByAddress(address string) (*repository.User, error) {
	return s.userRepo.FindByAddress(address)
}

// UpdateUser 更新用户信息
func (s *userService) UpdateUser(user *repository.User) error {
	return s.userRepo.Update(user)
}

// AuthenticateUser 验证用户身份 - 企业级安全实现
func (s *userService) AuthenticateUser(address, message, signature, timestamp string) (string, error) {
	// 验证以太坊地址格式
	if !isValidEthereumAddress(address) {
		return "", fmt.Errorf("invalid ethereum address: %s", address)
	}

	// 验证签名格式
	if !isValidSignature(signature) {
		return "", fmt.Errorf("invalid signature format: length=%d, prefix=%v", len(signature), strings.HasPrefix(signature, "0x"))
	}

	tsValue, err := security.ValidateTimestamp(timestamp, loginTimestampWindow)
	if err != nil {
		return "", fmt.Errorf("timestamp validation failed: %w", err)
	}

	if err := security.ValidateSignedMessage(address, timestamp, message); err != nil {
		return "", fmt.Errorf("message validation failed: %w", err)
	}

	// 检查时间戳是否已被使用
	// CheckAndStore 现在会在5分钟后自动清除旧记录，允许重新登录
	if !loginTimestampGuard.CheckAndStore(address, tsValue) {
		lastTs := loginTimestampGuard.GetLastTimestamp(address)
		return "", fmt.Errorf("timestamp already used or too old (last: %d, current: %d)", lastTs, tsValue)
	}

	if err := security.VerifySignature(address, message, signature); err != nil {
		// 记录详细的错误信息以便调试
		log.Printf("Signature verification failed for address %s: %v", address, err)
		log.Printf("Message: %q (length: %d)", message, len(message))
		log.Printf("Signature: %s (length: %d)", signature, len(signature))
		return "", fmt.Errorf("signature verification failed: %w", err)
	}

	// 生成JWT token
	token, err := s.generateJWTToken(address)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	// 将token存储到Redis，设置过期时间
	if s.redis != nil {
		ctx := context.Background()
		err = s.redis.Set(ctx, "auth_"+address, token, 24*time.Hour).Err()
		if err != nil {
			return "", fmt.Errorf("failed to store token: %w", err)
		}
	}

	return token, nil
}

func (s *userService) Register(address string) (*repository.User, error) {
	user := &repository.User{Address: address}
	err := s.userRepo.Create(user)
	return user, err
}

func (s *userService) Login(address string) (string, error) {
	user, err := s.userRepo.FindByAddress(address)
	if err != nil {
		return "", err
	}
	token := "jwt_token_" + user.Address
	return token, nil
}

func (s *userService) GetUser(address string) (*repository.User, error) {
	return s.userRepo.FindByAddress(address)
}

func (s *userService) UpdateProfile(address string, username, bio string) (*repository.User, error) {
	user, err := s.userRepo.FindByAddress(address)
	if err != nil {
		return nil, err
	}
	user.Username = username
	user.Bio = bio
	return user, s.userRepo.Update(user)
}

func (s *userService) ToggleFavorite(userAddress string, creationID uint) (bool, error) {
	user, err := s.userRepo.FindByAddress(userAddress)
	if err != nil {
		return false, err
	}
	return s.userRepo.ToggleFavorite(user.ID, creationID)
}

func (s *userService) GetFavorites(userAddress string) ([]repository.Creation, error) {
	user, err := s.userRepo.FindByAddress(userAddress)
	if err != nil {
		return nil, err
	}
	return s.userRepo.GetFavorites(user.ID)
}

// getJWTSecret 获取JWT密钥
func getJWTSecret() string {
	// 从环境变量读取JWT密钥
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable is required for security")
	}
	return secret
}

// generateSecureSecret 生成安全的随机密钥（保留用于其他用途）
func generateSecureSecret() string {
	bytes := make([]byte, 32) // 256位密钥
	if _, err := rand.Read(bytes); err != nil {
		log.Fatal("Failed to generate secure secret: " + err.Error())
	}
	return hex.EncodeToString(bytes)
}

// isValidEthereumAddress 验证以太坊地址格式
func isValidEthereumAddress(address string) bool {
	if len(address) != 42 || !strings.HasPrefix(address, "0x") {
		return false
	}

	// 验证十六进制字符
	for i := 2; i < len(address); i++ {
		if !((address[i] >= '0' && address[i] <= '9') ||
			(address[i] >= 'a' && address[i] <= 'f') ||
			(address[i] >= 'A' && address[i] <= 'F')) {
			return false
		}
	}
	return true
}

// isValidSignature 验证签名格式
func isValidSignature(signature string) bool {
	return len(signature) == 132 && strings.HasPrefix(signature, "0x")
}

// generateJWTToken 生成JWT token
func (s *userService) generateJWTToken(address string) (string, error) {
	// 创建JWT claims
	claims := jwt.MapClaims{
		"address": address,
		"iat":     time.Now().Unix(),
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iss":     "creatorchain",
	}

	// 创建token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名token
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateJWTToken 验证JWT token
func (s *userService) ValidateJWTToken(tokenString string) (string, error) {
	// 解析token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// 验证签名算法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	// 验证token有效性
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if address, ok := claims["address"].(string); ok {
			return address, nil
		}
		return "", errors.New("invalid token claims")
	}

	return "", errors.New("invalid token")
}
