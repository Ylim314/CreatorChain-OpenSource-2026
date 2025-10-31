package repository

import (
	"log"
	"time"

	"gorm.io/gorm"
)

// DatabaseOptimizer 数据库优化器
type DatabaseOptimizer struct {
	db *gorm.DB
}

// NewDatabaseOptimizer 创建数据库优化器
func NewDatabaseOptimizer(db *gorm.DB) *DatabaseOptimizer {
	return &DatabaseOptimizer{db: db}
}

// OptimizeDatabase 优化数据库性能
func (do *DatabaseOptimizer) OptimizeDatabase() error {
	log.Println("🔧 Starting database optimization...")

	// 创建索引
	if err := do.createIndexes(); err != nil {
		return err
	}

	// 优化连接池
	if err := do.optimizeConnectionPool(); err != nil {
		return err
	}

	// 分析表统计信息
	if err := do.analyzeTables(); err != nil {
		return err
	}

	log.Println("✅ Database optimization completed")
	return nil
}

// createIndexes 创建性能索引
func (do *DatabaseOptimizer) createIndexes() error {
	log.Println("📊 Creating performance indexes...")

	indexes := []struct {
		table   string
		columns []string
		name    string
	}{
		// 用户表索引
		{"users", []string{"address"}, "idx_users_address"},
		{"users", []string{"username"}, "idx_users_username"},
		{"users", []string{"email"}, "idx_users_email"},
		{"users", []string{"created_at"}, "idx_users_created_at"},
		{"users", []string{"is_active"}, "idx_users_is_active"},

		// 创作表索引
		{"creations", []string{"creator_address"}, "idx_creations_creator"},
		{"creations", []string{"token_id"}, "idx_creations_token_id"},
		{"creations", []string{"created_at"}, "idx_creations_created_at"},
		{"creations", []string{"is_listed"}, "idx_creations_is_listed"},
		{"creations", []string{"price_in_points"}, "idx_creations_price"},
		{"creations", []string{"ai_model"}, "idx_creations_ai_model"},

		// 交易表索引
		{"transactions", []string{"tx_hash"}, "idx_transactions_hash"},
		{"transactions", []string{"from_address"}, "idx_transactions_from"},
		{"transactions", []string{"to_address"}, "idx_transactions_to"},
		{"transactions", []string{"token_id"}, "idx_transactions_token"},
		{"transactions", []string{"tx_type"}, "idx_transactions_type"},
		{"transactions", []string{"status"}, "idx_transactions_status"},
		{"transactions", []string{"created_at"}, "idx_transactions_created_at"},
		{"transactions", []string{"block_number"}, "idx_transactions_block"},

		// 积分交易表索引
		{"points_transactions", []string{"from_address"}, "idx_points_from"},
		{"points_transactions", []string{"to_address"}, "idx_points_to"},
		{"points_transactions", []string{"type"}, "idx_points_type"},
		{"points_transactions", []string{"created_at"}, "idx_points_created_at"},
		{"points_transactions", []string{"creation_id"}, "idx_points_creation"},

		// 授权表索引
		{"licenses", []string{"token_id"}, "idx_licenses_token"},
		{"licenses", []string{"licensor_addr"}, "idx_licenses_licensor"},
		{"licenses", []string{"licensee_addr"}, "idx_licenses_licensee"},
		{"licenses", []string{"status"}, "idx_licenses_status"},
		{"licenses", []string{"expires_at"}, "idx_licenses_expires"},

		// DAO提案表索引
		{"proposals", []string{"proposer_addr"}, "idx_proposals_proposer"},
		{"proposals", []string{"proposal_type"}, "idx_proposals_type"},
		{"proposals", []string{"status"}, "idx_proposals_status"},
		{"proposals", []string{"start_time"}, "idx_proposals_start"},
		{"proposals", []string{"end_time"}, "idx_proposals_end"},

		// 投票表索引
		{"votes", []string{"proposal_id"}, "idx_votes_proposal"},
		{"votes", []string{"voter_addr"}, "idx_votes_voter"},
		{"votes", []string{"created_at"}, "idx_votes_created_at"},

		// 市场挂牌表索引
		{"listings", []string{"token_id"}, "idx_listings_token"},
		{"listings", []string{"seller_addr"}, "idx_listings_seller"},
		{"listings", []string{"status"}, "idx_listings_status"},
		{"listings", []string{"price"}, "idx_listings_price"},
		{"listings", []string{"created_at"}, "idx_listings_created_at"},

		// 区块链事件表索引
		{"blockchain_events", []string{"tx_hash"}, "idx_events_tx_hash"},
		{"blockchain_events", []string{"block_number"}, "idx_events_block"},
		{"blockchain_events", []string{"event_type"}, "idx_events_type"},
		{"blockchain_events", []string{"contract_addr"}, "idx_events_contract"},
		{"blockchain_events", []string{"processed"}, "idx_events_processed"},
		{"blockchain_events", []string{"created_at"}, "idx_events_created_at"},
	}

	for _, idx := range indexes {
		if err := do.createIndexIfNotExists(idx.table, idx.columns, idx.name); err != nil {
			log.Printf("⚠️ Failed to create index %s: %v", idx.name, err)
		}
	}

	log.Println("✅ Indexes created successfully")
	return nil
}

// createIndexIfNotExists 创建索引（如果不存在）
func (do *DatabaseOptimizer) createIndexIfNotExists(table string, columns []string, indexName string) error {
	// 检查索引是否已存在
	var count int64
	err := do.db.Raw("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND index_name = ?", indexName).Scan(&count).Error
	if err != nil {
		// 如果不是MySQL，尝试其他数据库
		err = do.db.Raw("SELECT COUNT(*) FROM information_schema.statistics WHERE table_name=? AND index_name=?", table, indexName).Scan(&count).Error
		if err != nil {
			// 如果都失败，直接创建索引
			return do.createIndex(table, columns, indexName)
		}
	}

	if count > 0 {
		log.Printf("📋 Index %s already exists", indexName)
		return nil
	}

	return do.createIndex(table, columns, indexName)
}

// createIndex 创建索引
func (do *DatabaseOptimizer) createIndex(table string, columns []string, indexName string) error {
	columnStr := ""
	for i, col := range columns {
		if i > 0 {
			columnStr += ", "
		}
		columnStr += col
	}

	sql := "CREATE INDEX " + indexName + " ON " + table + " (" + columnStr + ")"
	log.Printf("📊 Creating index: %s", sql)

	return do.db.Exec(sql).Error
}

// optimizeConnectionPool 优化连接池
func (do *DatabaseOptimizer) optimizeConnectionPool() error {
	log.Println("🔧 Optimizing connection pool...")

	sqlDB, err := do.db.DB()
	if err != nil {
		return err
	}

	// 设置连接池参数
	sqlDB.SetMaxOpenConns(25)                 // 最大打开连接数
	sqlDB.SetMaxIdleConns(10)                 // 最大空闲连接数
	sqlDB.SetConnMaxLifetime(5 * time.Minute) // 连接最大生存时间
	sqlDB.SetConnMaxIdleTime(1 * time.Minute) // 连接最大空闲时间

	log.Println("✅ Connection pool optimized")
	return nil
}

// analyzeTables 分析表统计信息
func (do *DatabaseOptimizer) analyzeTables() error {
	log.Println("📊 Analyzing table statistics...")

	tables := []string{
		"users", "creations", "transactions", "points_transactions",
		"licenses", "proposals", "votes", "listings", "blockchain_events",
	}

	for _, table := range tables {
		// 对于MySQL，使用ANALYZE TABLE命令
		err := do.db.Exec("ANALYZE TABLE " + table).Error
		if err != nil {
			log.Printf("⚠️ Failed to analyze table %s: %v", table, err)
		}
	}

	log.Println("✅ Table analysis completed")
	return nil
}

// GetDatabaseStats 获取数据库统计信息
func (do *DatabaseOptimizer) GetDatabaseStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	sqlDB, err := do.db.DB()
	if err != nil {
		return nil, err
	}

	// 获取连接池统计
	stats["max_open_conns"] = sqlDB.Stats().MaxOpenConnections
	stats["open_conns"] = sqlDB.Stats().OpenConnections
	stats["in_use"] = sqlDB.Stats().InUse
	stats["idle"] = sqlDB.Stats().Idle
	stats["wait_count"] = sqlDB.Stats().WaitCount
	stats["wait_duration"] = sqlDB.Stats().WaitDuration.String()

	// 获取表大小信息
	var tableCounts []map[string]interface{}
	tables := []string{"users", "creations", "transactions", "points_transactions", "licenses", "proposals", "votes", "listings", "blockchain_events"}

	for _, table := range tables {
		var count int64
		if err := do.db.Table(table).Count(&count).Error; err == nil {
			tableCounts = append(tableCounts, map[string]interface{}{
				"table": table,
				"count": count,
			})
		}
	}

	stats["table_counts"] = tableCounts
	return stats, nil
}

// CleanupOldData 清理旧数据
func (do *DatabaseOptimizer) CleanupOldData() error {
	log.Println("🧹 Cleaning up old data...")

	// 清理30天前的区块链事件
	cutoffDate := time.Now().AddDate(0, 0, -30)
	result := do.db.Where("created_at < ? AND processed = ?", cutoffDate, true).Delete(&BlockchainEvent{})
	if result.Error != nil {
		log.Printf("⚠️ Failed to cleanup blockchain events: %v", result.Error)
	} else {
		log.Printf("🗑️ Cleaned up %d old blockchain events", result.RowsAffected)
	}

	// 清理已完成的交易记录（保留最近7天）
	cutoffDate = time.Now().AddDate(0, 0, -7)
	result = do.db.Where("created_at < ? AND status = ?", cutoffDate, "confirmed").Delete(&Transaction{})
	if result.Error != nil {
		log.Printf("⚠️ Failed to cleanup transactions: %v", result.Error)
	} else {
		log.Printf("🗑️ Cleaned up %d old transactions", result.RowsAffected)
	}

	log.Println("✅ Data cleanup completed")
	return nil
}
