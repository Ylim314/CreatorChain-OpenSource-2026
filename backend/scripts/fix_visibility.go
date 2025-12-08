package main

import (
	"log"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/pkg/utils"

	"strings"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("🔧 Starting visibility fix script...")

	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found")
	}

	// 初始化配置
	config := utils.LoadConfig()

	// 初始化数据库
	db, err := initDatabase(config)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	log.Println("✅ Database connected")

	// 1. 查看当前状态
	log.Println("\n📊 Current visibility status:")
	var stats struct {
		Total        int64
		PublicCount  int64
		PrivateCount int64
		NullCount    int64
	}

	db.Model(&repository.Creation{}).Count(&stats.Total)
	db.Model(&repository.Creation{}).Where("visibility = ?", "public").Count(&stats.PublicCount)
	db.Model(&repository.Creation{}).Where("visibility = ?", "private").Count(&stats.PrivateCount)
	db.Model(&repository.Creation{}).Where("visibility IS NULL OR visibility = ''").Count(&stats.NullCount)

	log.Printf("  Total creations: %d", stats.Total)
	log.Printf("  Public: %d", stats.PublicCount)
	log.Printf("  Private: %d", stats.PrivateCount)
	log.Printf("  Null/Empty: %d", stats.NullCount)

	// 2. 更新已上链作品的可见性
	log.Println("\n🔄 Updating minted creations to public...")
	result := db.Model(&repository.Creation{}).
		Where("token_id > ?", 0).
		Where("visibility IS NULL OR visibility = '' OR visibility = 'private'").
		Update("visibility", "public")

	if result.Error != nil {
		log.Fatalf("❌ Failed to update minted creations: %v", result.Error)
	}
	log.Printf("✅ Updated %d minted creations to public", result.RowsAffected)

	// 3. 更新已上架作品的可见性
	log.Println("\n🔄 Updating listed creations to public...")
	result = db.Model(&repository.Creation{}).
		Where("is_listed = ?", true).
		Where("visibility IS NULL OR visibility = '' OR visibility = 'private'").
		Update("visibility", "public")

	if result.Error != nil {
		log.Fatalf("❌ Failed to update listed creations: %v", result.Error)
	}
	log.Printf("✅ Updated %d listed creations to public", result.RowsAffected)

	// 4. 查看更新后状态
	log.Println("\n📊 Updated visibility status:")
	db.Model(&repository.Creation{}).Count(&stats.Total)
	db.Model(&repository.Creation{}).Where("visibility = ?", "public").Count(&stats.PublicCount)
	db.Model(&repository.Creation{}).Where("visibility = ?", "private").Count(&stats.PrivateCount)
	db.Model(&repository.Creation{}).Where("visibility IS NULL OR visibility = ''").Count(&stats.NullCount)

	log.Printf("  Total creations: %d", stats.Total)
	log.Printf("  Public: %d", stats.PublicCount)
	log.Printf("  Private: %d", stats.PrivateCount)
	log.Printf("  Null/Empty: %d", stats.NullCount)

	// 5. 显示前10个作品
	log.Println("\n📝 Recent creations:")
	var creations []repository.Creation
	db.Order("created_at DESC").Limit(10).Find(&creations)

	for _, c := range creations {
		log.Printf("  ID: %d, TokenID: %d, Title: %s, Visibility: %s, Listed: %v",
			c.ID, c.TokenID, c.Title, c.Visibility, c.IsListed)
	}

	log.Println("\n✅ Visibility fix completed successfully!")
}

func initDatabase(config *utils.Config) (*gorm.DB, error) {
	dbConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	var db *gorm.DB
	var err error

	if strings.Contains(config.DatabaseURL, "mysql") || strings.Contains(config.DatabaseURL, "@tcp(") {
		log.Println("Using MySQL database")
		db, err = gorm.Open(mysql.Open(config.DatabaseURL), dbConfig)
	} else {
		log.Println("Using PostgreSQL database")
		db, err = gorm.Open(postgres.Open(config.DatabaseURL), dbConfig)
	}

	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	return db, nil
}
