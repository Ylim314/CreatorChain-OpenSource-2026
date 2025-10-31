package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// ErrorResponse 统一错误响应结构
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
	Details string `json:"details,omitempty"`
}

// ErrorCode 错误代码常量
const (
	// 通用错误
	ErrCodeInternalServer = 1000
	ErrCodeInvalidRequest = 1001
	ErrCodeUnauthorized   = 1002
	ErrCodeForbidden      = 1003
	ErrCodeNotFound       = 1004
	ErrCodeConflict       = 1005

	// 业务错误
	ErrCodeInvalidAddress     = 2001
	ErrCodeInvalidHash        = 2002
	ErrCodeCreationNotFound   = 2003
	ErrCodeInsufficientPoints = 2004
	ErrCodeInvalidSignature   = 2005
	ErrCodeRateLimitExceeded  = 2006

	// 区块链错误
	ErrCodeBlockchainConnection = 3001
	ErrCodeTransactionFailed    = 3002
	ErrCodeGasEstimationFailed  = 3003
	ErrCodeContractCallFailed   = 3004
)

// ErrorHandler 统一错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录panic信息
				stack := debug.Stack()
				fmt.Printf("Panic recovered: %v\nStack: %s\n", err, stack)

				// 返回统一错误响应
				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error:   "Internal Server Error",
					Message: "An unexpected error occurred",
					Code:    ErrCodeInternalServer,
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// HandleError 处理错误的辅助函数
func HandleError(c *gin.Context, err error, code int, message string) {
	errorResp := ErrorResponse{
		Error:   message,
		Code:    code,
		Details: err.Error(),
	}

	// 根据错误代码设置HTTP状态码
	var statusCode int
	switch code {
	case ErrCodeInvalidRequest:
		statusCode = http.StatusBadRequest
	case ErrCodeUnauthorized:
		statusCode = http.StatusUnauthorized
	case ErrCodeForbidden:
		statusCode = http.StatusForbidden
	case ErrCodeNotFound:
		statusCode = http.StatusNotFound
	case ErrCodeConflict:
		statusCode = http.StatusConflict
	case ErrCodeRateLimitExceeded:
		statusCode = http.StatusTooManyRequests
	default:
		statusCode = http.StatusInternalServerError
	}

	c.JSON(statusCode, errorResp)
}

// HandleValidationError 处理验证错误
func HandleValidationError(c *gin.Context, err error) {
	HandleError(c, err, ErrCodeInvalidRequest, "Validation failed")
}

// HandleNotFoundError 处理未找到错误
func HandleNotFoundError(c *gin.Context, resource string) {
	err := fmt.Errorf("%s not found", resource)
	HandleError(c, err, ErrCodeNotFound, fmt.Sprintf("%s not found", resource))
}

// HandleUnauthorizedError 处理未授权错误
func HandleUnauthorizedError(c *gin.Context, message string) {
	err := fmt.Errorf("unauthorized: %s", message)
	HandleError(c, err, ErrCodeUnauthorized, message)
}

// HandleBusinessError 处理业务逻辑错误
func HandleBusinessError(c *gin.Context, err error, message string) {
	HandleError(c, err, ErrCodeConflict, message)
}

// HandleBlockchainError 处理区块链相关错误
func HandleBlockchainError(c *gin.Context, err error, operation string) {
	message := fmt.Sprintf("Blockchain %s failed", operation)
	HandleError(c, err, ErrCodeBlockchainConnection, message)
}

// LogError 记录错误日志
func LogError(err error, context map[string]interface{}) {
	logData := map[string]interface{}{
		"error":   err.Error(),
		"context": context,
	}

	if jsonData, marshalErr := json.Marshal(logData); marshalErr == nil {
		fmt.Printf("Error logged: %s\n", jsonData)
	} else {
		fmt.Printf("Error logged: %v (context: %+v)\n", err, context)
	}
}

// WrapError 包装错误，添加上下文信息
func WrapError(err error, context string) error {
	return fmt.Errorf("%s: %w", context, err)
}
