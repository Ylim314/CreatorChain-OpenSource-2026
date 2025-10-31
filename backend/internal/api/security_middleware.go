package api

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// SecurityConfig 安全配置
type SecurityConfig struct {
	EnableRateLimit bool
	RateLimit       *rate.Limiter
	CORSOrigins     []string
	MaxRequestSize  int64
}

// RateLimitMiddleware 速率限制中间件
func RateLimitMiddleware(limiter *rate.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests, please try again later",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// SecureCORSMiddleware 安全的CORS中间件
func SecureCORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 检查origin是否在允许列表中
		if origin != "" {
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					allowed = true
					break
				}
			}

			if allowed {
				c.Header("Access-Control-Allow-Origin", origin)
			}
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, User-Address, Signature, Message, Timestamp")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24小时

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// RequestSizeLimitMiddleware 请求大小限制中间件
func RequestSizeLimitMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error":   "Request too large",
				"message": fmt.Sprintf("Request size exceeds limit of %d bytes", maxSize),
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// SecurityHeadersMiddleware 安全头中间件
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 防止点击劫持
		c.Header("X-Frame-Options", "DENY")

		// 防止MIME类型嗅探
		c.Header("X-Content-Type-Options", "nosniff")

		// XSS保护
		c.Header("X-XSS-Protection", "1; mode=block")

		// 强制HTTPS (生产环境)
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// 内容安全策略
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")

		// 引用者策略
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		c.Next()
	}
}

// IPWhitelistMiddleware IP白名单中间件
func IPWhitelistMiddleware(allowedIPs []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		// 如果没有配置白名单，允许所有IP
		if len(allowedIPs) == 0 {
			c.Next()
			return
		}

		allowed := false
		for _, allowedIP := range allowedIPs {
			if clientIP == allowedIP || strings.HasPrefix(clientIP, allowedIP) {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Access denied",
				"message": "Your IP address is not allowed",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequestTimeoutMiddleware 请求超时中间件
func RequestTimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置请求超时
		c.Request = c.Request.WithContext(c.Request.Context())

		// 这里可以添加超时逻辑
		// 实际实现需要结合context.WithTimeout
		c.Next()
	}
}

// InputSanitizationMiddleware 输入清理中间件
func InputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 清理查询参数
		for _, values := range c.Request.URL.Query() {
			for i, value := range values {
				// 移除潜在的恶意字符
				cleaned := strings.ReplaceAll(value, "<script>", "")
				cleaned = strings.ReplaceAll(cleaned, "javascript:", "")
				cleaned = strings.ReplaceAll(cleaned, "data:", "")
				values[i] = cleaned
			}
		}

		c.Next()
	}
}

// AuditLogMiddleware 审计日志中间件
func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// 记录请求信息
		logData := map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
			"timestamp":  start.Unix(),
		}

		// 如果有用户地址，记录
		if userAddr := c.GetHeader("User-Address"); userAddr != "" {
			logData["user_address"] = userAddr
		}

		c.Next()

		// 记录响应信息
		logData["status"] = c.Writer.Status()
		logData["duration"] = time.Since(start).Milliseconds()

		// 这里可以发送到日志系统
		fmt.Printf("AUDIT: %+v\n", logData)
	}
}
