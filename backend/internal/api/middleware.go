package api

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"creatorchain-backend/internal/security"

	"github.com/gin-gonic/gin"
)

var (
	requestTimestampWindow = 5 * time.Minute
	requestTimestampGuard  = security.NewTimestampGuard()
)

// LoggerMiddleware 请求日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC3339),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// RecoveryMiddleware 恢复中间件
func RecoveryMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, err interface{}) {
		log.Printf("Panic recovered: %v\n%s", err, debug.Stack())
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal server error",
			"message": "An unexpected error occurred",
		})
	})
}

// AuthMiddleware 认证中间件 - 这个地方我调试了很久才搞定
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取认证头，前端会传这些信息过来
		userAddress := c.GetHeader("User-Address")
		signature := c.GetHeader("Signature")
		message := c.GetHeader("Message")
		timestamp := c.GetHeader("Timestamp")

		// 先检查必须的头信息，之前没检查这个导致很多问题
		if userAddress == "" || signature == "" || message == "" || timestamp == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Missing required authentication headers",
			})
			c.Abort()
			return
		}

		// 验证地址格式，以太坊地址必须是42位，并且以0x开头
		if !isValidEthereumAddress(userAddress) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid address format",
				"message": "User-Address must be a valid Ethereum address",
			})
			c.Abort()
			return
		}

		tsValue, err := security.ValidateTimestamp(timestamp, requestTimestampWindow)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid timestamp",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		if err := security.ValidateSignedMessage(userAddress, timestamp, message); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid signed message",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		if !requestTimestampGuard.CheckAndStore(userAddress, tsValue) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Replay detected",
				"message": "Timestamp already used",
			})
			c.Abort()
			return
		}

		// 验证以太坊签名，这个地方最复杂
		if err := security.VerifySignature(userAddress, message, signature); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid signature",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// 验证通过，设置用户信息
		c.Set("user_address", userAddress)
		c.Set("authenticated", true)
		c.Next()
	}
}

// isValidEthereumAddress 验证以太坊地址格式
func isValidEthereumAddress(address string) bool {
	if len(address) != 42 || address[:2] != "0x" {
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

// ValidateJSONMiddleware JSON验证中间件
func ValidateJSONMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			contentType := c.GetHeader("Content-Type")
			// 允许文件上传的multipart/form-data类型
			if contentType != "" &&
				contentType != "application/json" &&
				!strings.HasPrefix(contentType, "multipart/form-data") {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":   "Invalid content type",
					"message": "Content-Type must be application/json or multipart/form-data",
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

// CORSMiddleware CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, User-Address")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// SendError 发送错误响应
func SendError(c *gin.Context, code int, error, message string) {
	c.JSON(code, gin.H{
		"error":   error,
		"message": message,
		"code":    code,
	})
}

// SendSuccess 发送成功响应
func SendSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}
