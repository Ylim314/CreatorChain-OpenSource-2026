package monitoring

import (
	"fmt"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// MetricsCollector 指标收集器
type MetricsCollector struct {
	mu sync.RWMutex

	// HTTP指标
	RequestCount    map[string]int64
	RequestDuration map[string][]time.Duration
	ErrorCount      map[string]int64

	// 业务指标
	UserCount        int64
	CreationCount    int64
	TransactionCount int64
	PointsBalance    int64

	// 系统指标
	MemoryUsage  int64
	CPUUsage     float64
	DatabaseConn int
	RedisConn    int

	// 时间戳
	LastUpdated time.Time
}

// NewMetricsCollector 创建指标收集器
func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{
		RequestCount:    make(map[string]int64),
		RequestDuration: make(map[string][]time.Duration),
		ErrorCount:      make(map[string]int64),
		LastUpdated:     time.Now(),
	}
}

// RecordRequest 记录HTTP请求
func (mc *MetricsCollector) RecordRequest(method, path string, duration time.Duration, statusCode int) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	key := fmt.Sprintf("%s %s", method, path)
	mc.RequestCount[key]++

	// 记录响应时间
	if mc.RequestDuration[key] == nil {
		mc.RequestDuration[key] = make([]time.Duration, 0, 100)
	}
	mc.RequestDuration[key] = append(mc.RequestDuration[key], duration)

	// 保持最近100个记录
	if len(mc.RequestDuration[key]) > 100 {
		mc.RequestDuration[key] = mc.RequestDuration[key][1:]
	}

	// 记录错误
	if statusCode >= 400 {
		mc.ErrorCount[key]++
	}

	mc.LastUpdated = time.Now()
}

// RecordBusinessMetric 记录业务指标
func (mc *MetricsCollector) RecordBusinessMetric(metric string, value int64) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	switch metric {
	case "user_count":
		mc.UserCount = value
	case "creation_count":
		mc.CreationCount = value
	case "transaction_count":
		mc.TransactionCount = value
	case "points_balance":
		mc.PointsBalance = value
	}

	mc.LastUpdated = time.Now()
}

// RecordSystemMetric 记录系统指标
func (mc *MetricsCollector) RecordSystemMetric(metric string, value interface{}) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	switch metric {
	case "memory_usage":
		if v, ok := value.(int64); ok {
			mc.MemoryUsage = v
		}
	case "cpu_usage":
		if v, ok := value.(float64); ok {
			mc.CPUUsage = v
		}
	case "database_conn":
		if v, ok := value.(int); ok {
			mc.DatabaseConn = v
		}
	case "redis_conn":
		if v, ok := value.(int); ok {
			mc.RedisConn = v
		}
	}

	mc.LastUpdated = time.Now()
}

// GetMetrics 获取所有指标
func (mc *MetricsCollector) GetMetrics() map[string]interface{} {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	metrics := map[string]interface{}{
		"timestamp": mc.LastUpdated.Unix(),
		"http": map[string]interface{}{
			"request_count":    mc.RequestCount,
			"request_duration": mc.getAverageDurations(),
			"error_count":      mc.ErrorCount,
		},
		"business": map[string]interface{}{
			"user_count":        mc.UserCount,
			"creation_count":    mc.CreationCount,
			"transaction_count": mc.TransactionCount,
			"points_balance":    mc.PointsBalance,
		},
		"system": map[string]interface{}{
			"memory_usage":  mc.MemoryUsage,
			"cpu_usage":     mc.CPUUsage,
			"database_conn": mc.DatabaseConn,
			"redis_conn":    mc.RedisConn,
		},
	}

	return metrics
}

// getAverageDurations 获取平均响应时间
func (mc *MetricsCollector) getAverageDurations() map[string]float64 {
	averages := make(map[string]float64)

	for key, durations := range mc.RequestDuration {
		if len(durations) == 0 {
			continue
		}

		var total time.Duration
		for _, duration := range durations {
			total += duration
		}
		averages[key] = float64(total.Milliseconds()) / float64(len(durations))
	}

	return averages
}

// Reset 重置指标
func (mc *MetricsCollector) Reset() {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	mc.RequestCount = make(map[string]int64)
	mc.RequestDuration = make(map[string][]time.Duration)
	mc.ErrorCount = make(map[string]int64)
	mc.LastUpdated = time.Now()
}

// MetricsMiddleware Gin中间件
func MetricsMiddleware(collector *MetricsCollector) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start)
		collector.RecordRequest(c.Request.Method, c.FullPath(), duration, c.Writer.Status())
	}
}

// MetricsHandler 指标处理器
func MetricsHandler(collector *MetricsCollector) gin.HandlerFunc {
	return func(c *gin.Context) {
		metrics := collector.GetMetrics()
		c.JSON(200, gin.H{
			"success": true,
			"data":    metrics,
		})
	}
}

// HealthChecker 健康检查器
type HealthChecker struct {
	checks map[string]func() error
}

// NewHealthChecker 创建健康检查器
func NewHealthChecker() *HealthChecker {
	return &HealthChecker{
		checks: make(map[string]func() error),
	}
}

// AddCheck 添加健康检查
func (hc *HealthChecker) AddCheck(name string, check func() error) {
	hc.checks[name] = check
}

// CheckAll 执行所有健康检查
func (hc *HealthChecker) CheckAll() map[string]interface{} {
	results := make(map[string]interface{})
	overall := "healthy"

	for name, check := range hc.checks {
		if err := check(); err != nil {
			results[name] = map[string]interface{}{
				"status": "unhealthy",
				"error":  err.Error(),
			}
			overall = "unhealthy"
		} else {
			results[name] = map[string]interface{}{
				"status": "healthy",
			}
		}
	}

	return map[string]interface{}{
		"overall":   overall,
		"checks":    results,
		"timestamp": time.Now().Unix(),
	}
}

// HealthHandler 健康检查处理器
func HealthHandler(checker *HealthChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		results := checker.CheckAll()

		status := 200
		if results["overall"] == "unhealthy" {
			status = 503
		}

		c.JSON(status, gin.H{
			"success": true,
			"data":    results,
		})
	}
}

// LogCollector 日志收集器
type LogCollector struct {
	logs []LogEntry
	mu   sync.RWMutex
	max  int
}

// LogEntry 日志条目
type LogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields"`
}

// NewLogCollector 创建日志收集器
func NewLogCollector(maxLogs int) *LogCollector {
	return &LogCollector{
		logs: make([]LogEntry, 0, maxLogs),
		max:  maxLogs,
	}
}

// AddLog 添加日志
func (lc *LogCollector) AddLog(level, message string, fields map[string]interface{}) {
	lc.mu.Lock()
	defer lc.mu.Unlock()

	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Message:   message,
		Fields:    fields,
	}

	lc.logs = append(lc.logs, entry)

	// 保持最大日志数量
	if len(lc.logs) > lc.max {
		lc.logs = lc.logs[1:]
	}
}

// GetLogs 获取日志
func (lc *LogCollector) GetLogs(limit int) []LogEntry {
	lc.mu.RLock()
	defer lc.mu.RUnlock()

	if limit <= 0 || limit > len(lc.logs) {
		limit = len(lc.logs)
	}

	start := len(lc.logs) - limit
	return lc.logs[start:]
}

// LogMiddleware Gin日志中间件
func LogMiddleware(collector *LogCollector) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start)
		fields := map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.FullPath(),
			"status":     c.Writer.Status(),
			"duration":   duration.Milliseconds(),
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		}

		if userAddr := c.GetHeader("User-Address"); userAddr != "" {
			fields["user_address"] = userAddr
		}

		level := "info"
		if c.Writer.Status() >= 400 {
			level = "error"
		}

		collector.AddLog(level, fmt.Sprintf("%s %s", c.Request.Method, c.FullPath()), fields)
	}
}

// LogsHandler 日志处理器
func LogsHandler(collector *LogCollector) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := 100
		if l := c.Query("limit"); l != "" {
			if parsed, err := fmt.Sscanf(l, "%d", &limit); err == nil && parsed == 1 {
				// limit已设置
			}
		}

		logs := collector.GetLogs(limit)
		c.JSON(200, gin.H{
			"success": true,
			"data":    logs,
		})
	}
}
