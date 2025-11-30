package api

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// SecurityConfig holds middleware-related toggles.
type SecurityConfig struct {
	EnableRateLimit bool
	RateLimit       *rate.Limiter
	CORSOrigins     []string
	MaxRequestSize  int64
}

// RateLimitMiddleware applies a simple token-bucket limiter.
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

// SecureCORSMiddleware enforces an allow list for browser origins while keeping credentials optional.
func SecureCORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	normalized := make([]string, 0, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			normalized = append(normalized, trimmed)
		}
	}
	allowAll := len(normalized) == 0

	return func(c *gin.Context) {
		// 记录所有请求（特别是 OPTIONS）以便调试
		if c.Request.Method == http.MethodOptions {
			origin := c.Request.Header.Get("Origin")
			requestHeaders := c.Request.Header.Get("Access-Control-Request-Headers")
			log.Printf("🔍 CORS Middleware: OPTIONS request detected for path: %s", c.Request.URL.Path)
			log.Printf("🔍 CORS Middleware: Origin=%s, Request-Headers=%s", origin, requestHeaders)
		}
		
		origin := c.Request.Header.Get("Origin")
		originAllowed := allowAll

		if !allowAll && origin != "" {
			for _, allowed := range normalized {
				if origin == allowed {
					originAllowed = true
					break
				}
			}
		}

		if !originAllowed && origin != "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "Origin not allowed",
				"message": "This domain is not permitted to access the API",
			})
			return
		}

		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Credentials", "false")
		} else if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Vary", "Origin")
		}

		// CORS headers - 包含所有可能的 header 名称变体
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		// 注意：浏览器在 CORS 预检请求中会将自定义 header 名称转换为小写
		// 因此我们必须包含小写版本以确保兼容性
		// 按照 CORS 规范，header 名称应该是大小写不敏感的，但实际实现可能严格匹配
		// 🔥 关键：必须包含 message-encoding（小写），这是浏览器实际发送的格式
		// 同时包含大小写变体以确保兼容性
		allowedHeaders := "Origin, Content-Type, Accept, Authorization, User-Address, user-address, Signature, signature, Message, message, Message-Encoding, message-encoding, Timestamp, timestamp, X-Requested-With, x-requested-with"
		c.Header("Access-Control-Allow-Headers", allowedHeaders)
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		c.Header("Access-Control-Max-Age", "86400")

		// 处理 OPTIONS 预检请求
		if c.Request.Method == http.MethodOptions {
			// 记录预检请求的详细信息以便调试
			requestHeaders := c.Request.Header.Get("Access-Control-Request-Headers")
			log.Printf("🔍 CORS Preflight: Origin=%s, Request-Headers=%s", origin, requestHeaders)
			log.Printf("🔍 CORS Preflight: Allowed-Headers=%s", allowedHeaders)
			// 确保所有 CORS 响应头都已设置（在 abort 之前）
			// 注意：之前已经通过 c.Header() 设置了，这里再次确认
			if allowAll {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			} else if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			}
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			// 确保使用相同的 allowedHeaders 字符串
			c.Writer.Header().Set("Access-Control-Allow-Headers", allowedHeaders)
			c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
			c.Writer.Header().Set("Access-Control-Max-Age", "86400")
			// 验证 header 是否真的设置了
			actualHeaders := c.Writer.Header().Get("Access-Control-Allow-Headers")
			log.Printf("🔍 CORS Preflight: Actual Response Headers - Access-Control-Allow-Headers=%s", actualHeaders)
			// 检查是否包含 message-encoding
			if !strings.Contains(strings.ToLower(actualHeaders), "message-encoding") {
				log.Printf("⚠️ WARNING: message-encoding not found in allowed headers!")
			} else {
				log.Printf("✅ message-encoding found in allowed headers")
			}
			log.Printf("🔍 CORS Preflight: Response headers set, returning 204")
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// RequestSizeLimitMiddleware guards against large payloads.
func RequestSizeLimitMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if maxSize > 0 && c.Request.ContentLength > maxSize {
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

// SecurityHeadersMiddleware adds a baseline set of hardening headers.
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

// IPWhitelistMiddleware allows requests only from the configured set.
func IPWhitelistMiddleware(allowedIPs []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(allowedIPs) == 0 {
			c.Next()
			return
		}

		clientIPStr := c.ClientIP()
		clientIP := net.ParseIP(clientIPStr)
		if clientIP == nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Access denied",
				"message": "Unable to parse client IP",
			})
			c.Abort()
			return
		}

		allowed := false
		for _, entry := range allowedIPs {
			rule := strings.TrimSpace(entry)
			if rule == "" {
				continue
			}
			if rule == "*" {
				allowed = true
				break
			}
			if strings.Contains(rule, "/") {
				if _, network, err := net.ParseCIDR(rule); err == nil && network.Contains(clientIP) {
					allowed = true
					break
				}
				continue
			}
			if ip := net.ParseIP(rule); ip != nil && ip.Equal(clientIP) {
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

// RequestTimeoutMiddleware cancels handlers that exceed the configured duration.
func RequestTimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	if timeout <= 0 {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		finished := make(chan struct{})
		go func() {
			c.Next()
			close(finished)
		}()

		select {
		case <-finished:
			return
		case <-ctx.Done():
			c.AbortWithStatusJSON(http.StatusGatewayTimeout, gin.H{
				"error":   "Request timeout",
				"message": fmt.Sprintf("Request exceeded timeout of %s", timeout),
			})
		}
	}
}

// InputSanitizationMiddleware performs basic query sanitization.
func InputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		for _, values := range c.Request.URL.Query() {
			for i, value := range values {
				cleaned := strings.ReplaceAll(value, "<script>", "")
				cleaned = strings.ReplaceAll(cleaned, "javascript:", "")
				cleaned = strings.ReplaceAll(cleaned, "data:", "")
				values[i] = cleaned
			}
		}

		c.Next()
	}
}

// AuditLogMiddleware emits a basic audit trail for each request.
func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		logData := map[string]interface{}{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
			"timestamp":  start.Unix(),
		}

		if userAddr := c.GetHeader("User-Address"); userAddr != "" {
			logData["user_address"] = userAddr
		}

		c.Next()

		logData["status"] = c.Writer.Status()
		logData["duration"] = time.Since(start).Milliseconds()
		fmt.Printf("AUDIT: %+v\n", logData)
	}
}
