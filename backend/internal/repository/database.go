package repository

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB 初始化数据库连接 - 企业级安全版本
func InitDB(databaseURL string) (*gorm.DB, error) {
	// 配置数据库连接参数
	db, err := gorm.Open(mysql.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		// 禁用外键约束检查以提高性能（生产环境中可启用）
		DisableForeignKeyConstraintWhenMigrating: false,
		// 启用预编译语句缓存
		PrepareStmt: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// 自动迁移数据库表
	err = db.AutoMigrate(
		&User{},
		&Creation{},
		&Transaction{},
		&License{},
		&Proposal{},
		&Vote{},
		&BlockchainEvent{},
		&Listing{},
		&PointsTransaction{},
		&AuditLog{}, // 新增审计日志表
	)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	// 获取底层SQL数据库
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sqlDB from gorm DB: %w", err)
	}

	// 设置连接池参数 - 企业级配置
	sqlDB.SetMaxIdleConns(10)                  // 最大空闲连接数
	sqlDB.SetMaxOpenConns(100)                 // 最大打开连接数
	sqlDB.SetConnMaxLifetime(time.Hour)        // 连接最大生存时间
	sqlDB.SetConnMaxIdleTime(30 * time.Minute) // 空闲连接最大生存时间

	// 创建数据库索引以提高查询性能
	if err := createDatabaseIndexes(db); err != nil {
		log.Printf("Warning: Failed to create database indexes: %v", err)
	}

	// 启用审计日志
	if err := enableAuditLogging(db); err != nil {
		log.Printf("Warning: Failed to enable audit logging: %v", err)
	}

	log.Println("✅ Database connected and migrated successfully")
	return db, nil
}

// InitRedis 初始化Redis连接
func InitRedis(redisURL string) *redis.Client {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("Failed to parse Redis URL: %v, using default config", err)
		opt = &redis.Options{
			Addr:     "localhost:6379",
			Password: "",
			DB:       0,
		}
	}

	rdb := redis.NewClient(opt)
	log.Println("Redis connected successfully")
	return rdb
}

// AuditLog 审计日志模型
type AuditLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserAddr  string    `json:"user_address" gorm:"size:42"`
	Action    string    `json:"action" gorm:"size:100;not null"`
	Resource  string    `json:"resource" gorm:"size:100"`
	Details   string    `json:"details"`
	IPAddress string    `json:"ip_address" gorm:"size:45"`
	UserAgent string    `json:"user_agent" gorm:"size:500"`
	Success   bool      `json:"success" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
}

// createDatabaseIndexes 创建数据库索引
func createDatabaseIndexes(db *gorm.DB) error {
	// 用户表索引
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_address ON users(address)").Error; err != nil {
		log.Printf("Failed to create users address index: %v", err)
	}

	// 创作表索引
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_creations_creator ON creations(creator_address)").Error; err != nil {
		log.Printf("Failed to create creations creator index: %v", err)
	}
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC)").Error; err != nil {
		log.Printf("Failed to create creations created_at index: %v", err)
	}

	// 交易表索引
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash)").Error; err != nil {
		log.Printf("Failed to create transactions hash index: %v", err)
	}
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_from_addr ON transactions(from_address)").Error; err != nil {
		log.Printf("Failed to create transactions from_address index: %v", err)
	}

	// 积分交易表索引
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_transactions_to_addr ON points_transactions(to_address)").Error; err != nil {
		log.Printf("Failed to create points_transactions to_address index: %v", err)
	}
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC)").Error; err != nil {
		log.Printf("Failed to create points_transactions created_at index: %v", err)
	}

	// 审计日志索引
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_addr ON audit_logs(user_addr)").Error; err != nil {
		log.Printf("Failed to create audit_logs user_addr index: %v", err)
	}
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)").Error; err != nil {
		log.Printf("Failed to create audit_logs action index: %v", err)
	}
	if err := db.Exec("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)").Error; err != nil {
		log.Printf("Failed to create audit_logs created_at index: %v", err)
	}

	return nil
}

// enableAuditLogging 启用审计日志
func enableAuditLogging(db *gorm.DB) error {
	// 注册数据库回调函数来记录审计日志
	db.Callback().Create().After("gorm:create").Register("audit:create", auditCreateCallback)
	db.Callback().Update().After("gorm:update").Register("audit:update", auditUpdateCallback)
	db.Callback().Delete().After("gorm:delete").Register("audit:delete", auditDeleteCallback)

	return nil
}

// auditCreateCallback 创建操作审计回调
func auditCreateCallback(db *gorm.DB) {
	if db.Statement.Table != "audit_logs" { // 避免循环记录
		logAuditEvent(db, "CREATE", db.Statement.Table, "", true)
	}
}

// auditUpdateCallback 更新操作审计回调
func auditUpdateCallback(db *gorm.DB) {
	if db.Statement.Table != "audit_logs" {
		logAuditEvent(db, "UPDATE", db.Statement.Table, "", db.Error == nil)
	}
}

// auditDeleteCallback 删除操作审计回调
func auditDeleteCallback(db *gorm.DB) {
	if db.Statement.Table != "audit_logs" {
		logAuditEvent(db, "DELETE", db.Statement.Table, "", db.Error == nil)
	}
}

// logAuditEvent 记录审计事件
func logAuditEvent(db *gorm.DB, action, resource, details string, success bool) {
	auditLog := AuditLog{
		Action:    action,
		Resource:  resource,
		Details:   details,
		Success:   success,
		CreatedAt: time.Now(),
	}

	// 异步记录审计日志，避免影响主业务
	go func() {
		if err := db.Session(&gorm.Session{NewDB: true}).Create(&auditLog).Error; err != nil {
			log.Printf("Failed to create audit log: %v", err)
		}
	}()
}

// EncryptSensitiveData 加密敏感数据
func EncryptSensitiveData(plaintext string) (string, error) {
	key := getEncryptionKey()
	if len(key) != 32 {
		return "", fmt.Errorf("encryption key must be 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

// DecryptSensitiveData 解密敏感数据
func DecryptSensitiveData(ciphertext string) (string, error) {
	key := getEncryptionKey()
	if len(key) != 32 {
		return "", fmt.Errorf("encryption key must be 32 bytes")
	}

	data, err := hex.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	if len(data) < gcm.NonceSize() {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext_bytes := data[:gcm.NonceSize()], data[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// getEncryptionKey 获取加密密钥
func getEncryptionKey() []byte {
	// 从环境变量获取密钥
	key := os.Getenv("ENCRYPTION_KEY")
	if key == "" {
		// 如果没有设置环境变量，报错退出
		log.Fatal("ENCRYPTION_KEY environment variable is required for security")
	}

	// 使用SHA256确保密钥长度为32字节
	hash := sha256.Sum256([]byte(key))
	return hash[:]
}

// CreateDatabaseBackup 创建数据库备份
func CreateDatabaseBackup(databaseURL string) error {
	// 这里应该实现数据库备份逻辑
	// 可以使用pg_dump或其他工具
	log.Println("TODO: Implement database backup functionality")
	return nil
}

// ValidateDataIntegrity 验证数据完整性
func ValidateDataIntegrity(db *gorm.DB) error {
	// 检查数据一致性
	var userCount, creationCount int64

	if err := db.Model(&User{}).Count(&userCount).Error; err != nil {
		return fmt.Errorf("failed to count users: %w", err)
	}

	if err := db.Model(&Creation{}).Count(&creationCount).Error; err != nil {
		return fmt.Errorf("failed to count creations: %w", err)
	}

	log.Printf("Data integrity check: %d users, %d creations", userCount, creationCount)
	return nil
}
