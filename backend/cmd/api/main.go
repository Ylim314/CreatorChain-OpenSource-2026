package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"strings"
	"syscall"
	"time"

	"creatorchain-backend/internal/ai"
	"creatorchain-backend/internal/api"
	"creatorchain-backend/internal/ipfs"
	"creatorchain-backend/internal/monitoring"
	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/service"
	"creatorchain-backend/internal/zkp"
	"creatorchain-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("❌ Panic recovered: %v", r)
			debug.PrintStack()
		}
	}()

	// 设置日志格式
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("🚀 Starting CreatorChain Backend...")
	log.Println("📋 Debug: Main function started")

	// 添加更多调试信息
	log.Println("📋 Environment variables:")
	log.Printf("  - GIN_MODE: %s", os.Getenv("GIN_MODE"))
	log.Printf("  - PORT: %s", os.Getenv("PORT"))
	log.Printf("  - DATABASE_URL: %s", os.Getenv("DATABASE_URL"))

	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using default configuration")
	}

	// 初始化配置
	config := utils.LoadConfig()
	log.Printf("📋 Configuration loaded - Port: %s, Database: %s", config.Port, config.DatabaseURL)

	// 设置Gin模式
	if config.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化数据库 - 使用连接池和健康检查
	db, err := initDatabaseWithRetry(config)
	if err != nil {
		log.Fatalf("❌ Database initialization failed: %v", err)
	}

	// 测试数据库连接
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get database instance: %v", err)
	}

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("✅ Database connected successfully")

	// 自动迁移数据库表
	log.Println("Running database migrations...")
	err = db.AutoMigrate(
		&repository.User{},
		&repository.Creation{},
		&repository.Listing{},
		&repository.Transaction{},
		&repository.PointsTransaction{},
		&repository.License{},
		&repository.Proposal{},
		&repository.Vote{},
		&repository.BlockchainEvent{},
	)
	if err != nil {
		log.Printf("Database migration warning: %v", err)
		// 不退出，继续运行
	}
	log.Println("✅ Database migration completed")

	// 优化数据库性能
	dbOptimizer := repository.NewDatabaseOptimizer(db)
	if err := dbOptimizer.OptimizeDatabase(); err != nil {
		log.Printf("⚠️ Database optimization failed: %v", err)
	}

	// 初始化Redis
	var rdb *redis.Client
	if config.RedisURL != "" {
		log.Printf("Connecting to Redis: %s", config.RedisURL)
		opt, err := redis.ParseURL(config.RedisURL)
		if err != nil {
			log.Printf("⚠️ Failed to parse Redis URL, using in-memory cache: %v", err)
			rdb = nil
		} else {
			rdb = redis.NewClient(opt)
			// 测试Redis连接
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := rdb.Ping(ctx).Err(); err != nil {
				log.Printf("⚠️ Failed to connect to Redis, using in-memory cache: %v", err)
				rdb = nil
			} else {
				log.Println("✅ Redis connected successfully")
			}
		}
	} else {
		log.Println("⚠️ Redis URL not configured, using in-memory cache")
		rdb = nil
	}

	// 初始化AI引擎
	aiEngine := ai.NewAIEngine(config.AIAPIKey, config.AIBaseURL)
	log.Println("✅ AI Engine initialized")

	// 初始化IPFS客户端
	ipfsClient := ipfs.NewIPFSClient(
		config.IPFSGateway,
		"https://api.pinata.cloud",
		config.PinataAPIKey,
		config.PinataSecret,
	)
	log.Println("✅ IPFS Client initialized")

	// 初始化零知识证明引擎
	zkpEngine := zkp.NewZKVerifier()
	log.Println("✅ ZKP Engine initialized")

	// 初始化Repository层
	userRepo := repository.NewUserRepository(db)
	creationRepo := repository.NewCreationRepository(db)
	txRepo := repository.NewTransactionRepository(db)
	pointsTxRepo := repository.NewPointsTransactionRepository(db)

	// 初始化Service层
	userService := service.NewUserService(userRepo, rdb)
	creationService := service.NewCreationService(creationRepo, nil) // 暂时不使用区块链客户端
	marketplaceService := service.NewMarketplaceService(txRepo, nil)

	// 初始化处理器
	userHandler := api.NewUserHandler(userService)
	creationHandler := api.NewCreationHandler(creationService)
	marketplaceHandler := api.NewMarketplaceHandler(marketplaceService)
	pointsHandler := api.NewPointsHandler(userRepo)
	pointsTransactionHandler := api.NewPointsTransactionHandler(pointsTxRepo)
	aiHandler := api.NewAIHandler(aiEngine, ipfsClient, zkpEngine)
	uploadHandler := api.NewUploadHandler()

	// 初始化监控系统
	metricsCollector := monitoring.NewMetricsCollector()
	logCollector := monitoring.NewLogCollector(1000)
	healthChecker := monitoring.NewHealthChecker()

	// 添加健康检查
	healthChecker.AddCheck("database", func() error {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Ping()
	})

	if rdb != nil {
		healthChecker.AddCheck("redis", func() error {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			return rdb.Ping(ctx).Err()
		})
	}

	// 初始化路由
	router := setupRouter(
		config,
		userService,
		creationService,
		txRepo,
		userRepo,
		userHandler,
		creationHandler,
		marketplaceHandler,
		pointsHandler,
		pointsTransactionHandler,
		aiHandler,
		uploadHandler,
		metricsCollector,
		logCollector,
		healthChecker,
	)

	// 启动HTTP服务
	server := &http.Server{
		Addr:    ":" + config.Port,
		Handler: router,
	}

	// 启动服务器（非阻塞）
	go func() {
		log.Printf("✅ Server listening on port %s", config.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// 优雅关闭设置
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 等待信号或保持运行
	log.Println("🚀 CreatorChain Backend is running!")
	log.Printf("📡 Health check: http://localhost:%s/health", config.Port)
	log.Printf("📊 Metrics: http://localhost:%s/monitoring/metrics", config.Port)
	log.Printf("📝 Logs: http://localhost:%s/monitoring/logs", config.Port)
	log.Println("Press Ctrl+C to stop the server")

	<-quit
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("✅ Server exiting")
}

// setupRouter 设置路由
func setupRouter(
	config *utils.Config,
	userService service.UserService,
	creationService service.CreationService,
	txRepo repository.TransactionRepository,
	userRepo repository.UserRepository,
	userHandler *api.UserHandler,
	creationHandler *api.CreationHandler,
	marketplaceHandler *api.MarketplaceHandler,
	pointsHandler *api.PointsHandler,
	pointsTransactionHandler *api.PointsTransactionHandler,
	aiHandler *api.AIHandler,
	uploadHandler *api.UploadHandler,
	metricsCollector *monitoring.MetricsCollector,
	logCollector *monitoring.LogCollector,
	healthChecker *monitoring.HealthChecker,
) *gin.Engine {
	// 设置Gin模式
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// 初始化速率限制器
	var limiter *rate.Limiter
	if config.EnableRateLimit {
		limiter = rate.NewLimiter(rate.Limit(config.RateLimitRequests), config.RateLimitWindow)
	}

	// 添加安全中间件
	router.Use(api.ErrorHandler()) // 统一错误处理
	router.Use(api.LoggerMiddleware())
	router.Use(api.RecoveryMiddleware())
	router.Use(api.SecurityHeadersMiddleware())
	router.Use(api.SecureCORSMiddleware(config.CORSOrigins))
	if config.RequestTimeoutSeconds > 0 {
		timeout := time.Duration(config.RequestTimeoutSeconds) * time.Second
		router.Use(api.RequestTimeoutMiddleware(timeout))
	}
	router.Use(api.RequestSizeLimitMiddleware(10 * 1024 * 1024)) // 10MB
	router.Use(api.InputSanitizationMiddleware())
	router.Use(api.AuditLogMiddleware())
	router.Use(monitoring.MetricsMiddleware(metricsCollector))
	router.Use(monitoring.LogMiddleware(logCollector))
	if limiter != nil {
		router.Use(api.RateLimitMiddleware(limiter))
	}
	router.Use(api.ValidateJSONMiddleware())

	// 健康检查（无需认证）
	router.GET("/health", monitoring.HealthHandler(healthChecker))

	// 静态文件服务 - 用于图片显示
	router.Static("/uploads", "./uploads")

	// 监控路由
	monitoringGroup := router.Group("/monitoring")
	{
		monitoringGroup.GET("/metrics", monitoring.MetricsHandler(metricsCollector))
		monitoringGroup.GET("/logs", monitoring.LogsHandler(logCollector))
		monitoringGroup.GET("/health", monitoring.HealthHandler(healthChecker))
	}

	// API路由组
	apiV1 := router.Group("/api/v1")
	{
		// 初始化API处理器
		// userHandler := api.NewUserHandler(userService)
		// creationHandler := api.NewCreationHandler(creationService)
		// transactionHandler := api.NewTransactionHandler(txRepo)
		// pointsHandler := api.NewPointsHandler(userRepo)

		// 用户相关路由（登录不需要认证，其他需要）
		users := apiV1.Group("/users")
		{
			users.POST("/register", userHandler.Register)
			users.POST("/login", userHandler.Login)
			users.GET("/:address", userHandler.GetUser)
		}

		// 需要认证的路由组
		authed := apiV1.Group("/")
		authed.Use(api.AuthMiddleware())
		{
			// 个人资料
			profile := authed.Group("/profile")
			{
				profile.GET("", userHandler.GetProfile)
				profile.PUT("", userHandler.UpdateProfile)
				profile.GET("/favorites", userHandler.GetFavorites) // 获取收藏列表
			}

			// 创作
			creations := authed.Group("/creations")
			{
				creations.POST("", creationHandler.CreateCreation)
				creations.PUT("/:id", creationHandler.UpdateCreation)
				creations.DELETE("/:id", creationHandler.DeleteCreation)
				creations.POST("/:id/mint", creationHandler.MintNFT)
				creations.POST("/:id/favorite", userHandler.ToggleFavorite) // 切换收藏状态
			}

			// 积分管理
			points := authed.Group("/points")
			{
				points.GET("/balance/:address", pointsHandler.GetPointsBalance)
				points.POST("/transfer", pointsHandler.TransferPoints)
				points.POST("/add", pointsHandler.AddPoints)
				points.GET("/history/:address", pointsHandler.GetPointsHistory)
			}

			// 市场相关接口
			marketplace := authed.Group("/marketplace")
			{
				marketplace.GET("/listings", marketplaceHandler.GetListings)
				marketplace.POST("/list", marketplaceHandler.ListItem)
				marketplace.POST("/buy", marketplaceHandler.BuyItem)
			}
		}

		// 公开路由
		public := apiV1.Group("/public")
		{
			public.GET("/creations", creationHandler.GetCreations)
			public.GET("/creations/:id", creationHandler.GetCreation)
			public.GET("/marketplace/listings", marketplaceHandler.GetListings)
			// 暂时移除交易相关路由，等实现TransactionHandler后再添加
		}

		// AI路由
		api.SetupAIRoutes(router, aiHandler)

		// 上传路由（无需认证，但会在处理中验证）
		upload := apiV1.Group("/upload")
		{
			upload.POST("/image", uploadHandler.UploadImage)
		}
	}

	return router
}

// initDatabaseWithRetry 使用重试机制初始化数据库连接
func initDatabaseWithRetry(config *utils.Config) (*gorm.DB, error) {
	const maxRetries = 3
	const retryDelay = 2 * time.Second

	// 配置GORM日志级别
	dbConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	var db *gorm.DB
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		log.Printf("🔄 Database connection attempt %d/%d", attempt, maxRetries)

		if strings.Contains(config.DatabaseURL, "mysql") || strings.Contains(config.DatabaseURL, "@tcp(") {
			log.Println("Using MySQL database")
			db, err = gorm.Open(mysql.Open(config.DatabaseURL), dbConfig)
		} else {
			log.Println("Using PostgreSQL database")
			db, err = gorm.Open(postgres.Open(config.DatabaseURL), dbConfig)
		}

		if err == nil {
			// 测试连接
			sqlDB, err := db.DB()
			if err == nil {
				err = sqlDB.Ping()
			}
			if err == nil {
				log.Println("✅ Database connected successfully")
				return db, nil
			}
		}

		log.Printf("❌ Database connection attempt %d failed: %v", attempt, err)

		if attempt < maxRetries {
			log.Printf("🔄 Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	return nil, fmt.Errorf("database connection failed after %d attempts: %v", maxRetries, err)
}
