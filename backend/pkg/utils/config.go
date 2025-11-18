package utils

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"strconv"
	"strings"
)

// Config 应用配置
type Config struct {
	// 应用基础配置
	Port       string
	GinMode    string
	AppName    string
	AppVersion string

	// 数据库配置
	DatabaseURL string

	// Redis配置
	RedisURL      string
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// 区块链配置
	EthereumRPC string
	PrivateKey  string

	// 安全配置
	JWTSecret string

	// 外部服务配置
	IPFSGateway  string
	PinataAPIKey string
	PinataSecret string

	// AI服务配置
	AIAPIKey  string
	AIBaseURL string

	// 日志和监控
	LogLevel      string
	EnableMetrics bool

	// 限流配置
	RateLimitRequests int
	RateLimitWindow   int
	EnableRateLimit   bool

	// CORS配置
	CORSOrigins     []string
	CORSCredentials bool

	// 请求超时
	RequestTimeoutSeconds int
}

// LoadConfig 加载配置
func LoadConfig() *Config {
	config := &Config{
		// 应用基础配置
		Port:       getEnv("PORT", "8080"),
		GinMode:    getEnv("GIN_MODE", "debug"),
		AppName:    getEnv("APP_NAME", "CreatorChain Backend"),
		AppVersion: getEnv("APP_VERSION", "1.0.0"),

		// 数据库配置
		DatabaseURL: getEnv("DATABASE_URL", ""),

		// Redis配置
		RedisURL:      getEnv("REDIS_URL", ""),
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// 区块链配置
		EthereumRPC: getEnv("ETHEREUM_RPC", "http://localhost:8545"),
		PrivateKey:  getEnv("PRIVATE_KEY", ""),

		// 安全配置 - 企业级安全实现
		JWTSecret: getEnv("JWT_SECRET", generateSecureSecret()),

		// 外部服务配置
		IPFSGateway:  getEnv("IPFS_GATEWAY", "https://ipfs.io/ipfs/"),
		PinataAPIKey: getEnv("PINATA_API_KEY", ""),
		PinataSecret: getEnv("PINATA_SECRET_KEY", ""),

		// AI服务配置
		AIAPIKey:  getEnv("AI_API_KEY", ""),
		AIBaseURL: getEnv("AI_BASE_URL", "https://api.openai.com/v1"),

		// 日志和监控
		LogLevel:      getEnv("LOG_LEVEL", "info"),
		EnableMetrics: getEnvAsBool("ENABLE_METRICS", false),

		// 限流配置
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnvAsInt("RATE_LIMIT_WINDOW", 60),
		EnableRateLimit:   getEnvAsBool("ENABLE_RATE_LIMIT", true),

		// CORS配置
		CORSOrigins:     getEnvAsSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"}),
		CORSCredentials: getEnvAsBool("CORS_CREDENTIALS", true),

		// 请求超时
		RequestTimeoutSeconds: getEnvAsInt("REQUEST_TIMEOUT_SECONDS", 30),
	}

	// 验证关键配置
	validateConfig(config)

	return config
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return strings.TrimSpace(value)
	}
	if defaultValue != "" {
		log.Printf("Environment variable %s not set, using default: %s", key, defaultValue)
	}
	return strings.TrimSpace(defaultValue)
}

// getEnvAsInt 获取环境变量并转换为整数
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}

	log.Printf("Invalid integer value for %s: %s, using default: %d", key, valueStr, defaultValue)
	return defaultValue
}

// getEnvAsBool 获取环境变量并转换为布尔值
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}

	log.Printf("Invalid boolean value for %s: %s, using default: %t", key, valueStr, defaultValue)
	return defaultValue
}

// getEnvAsSlice 获取环境变量并转换为字符串切片
func getEnvAsSlice(key string, defaultValue []string) []string {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	return strings.Split(valueStr, ",")
}

// validateConfig 验证关键配置
func validateConfig(config *Config) {
	// 验证端口号
	if port, err := strconv.Atoi(config.Port); err != nil || port < 1 || port > 65535 {
		log.Printf("Warning: Invalid port %s, using default 8080", config.Port)
		config.Port = "8080"
	}

	// 验证数据库URL
	if config.DatabaseURL == "" {
		log.Printf("Warning: DATABASE_URL not set, using MySQL default")
		config.DatabaseURL = "root:720720@tcp(localhost:3306)/creatorchain"
	}

	// 验证JWT密钥长度
	if len(config.JWTSecret) < 32 {
		log.Printf("Warning: JWT_SECRET too short (%d chars), using generated secret", len(config.JWTSecret))
		config.JWTSecret = generateSecureSecret()
	}

	// 验证限流配置
	if config.RateLimitRequests < 1 {
		log.Printf("Warning: Invalid RATE_LIMIT_REQUESTS %d, using default 100", config.RateLimitRequests)
		config.RateLimitRequests = 100
	}

	if config.RateLimitWindow < 1 {
		log.Printf("Warning: Invalid RATE_LIMIT_WINDOW %d, using default 60", config.RateLimitWindow)
		config.RateLimitWindow = 60
	}

	// 验证CORS配置
	if len(config.CORSOrigins) == 0 {
		log.Printf("Warning: No CORS origins configured, using localhost defaults")
		config.CORSOrigins = []string{"http://localhost:3000", "http://localhost:3001"}
	}

	if config.RequestTimeoutSeconds < 0 {
		log.Printf("Warning: REQUEST_TIMEOUT_SECONDS cannot be negative, using default 30")
		config.RequestTimeoutSeconds = 30
	}

	log.Println("✅ Configuration validation completed")
}

// generateSecureSecret 生成安全的随机密钥
func generateSecureSecret() string {
	bytes := make([]byte, 32) // 256位密钥
	if _, err := rand.Read(bytes); err != nil {
		log.Printf("Warning: Failed to generate secure secret, using fallback")
		return "fallback-secret-key-" + strconv.FormatInt(int64(len(os.Args)), 10)
	}
	return hex.EncodeToString(bytes)
}
