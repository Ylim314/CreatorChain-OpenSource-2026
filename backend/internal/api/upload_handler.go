package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadHandler 上传处理器
type UploadHandler struct{}

// NewUploadHandler 创建上传处理器
func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadImage 上传图片文件
func (h *UploadHandler) UploadImage(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No file uploaded: " + err.Error(),
		})
		return
	}

	// 验证文件类型
	if !isValidImageType(file.Header.Get("Content-Type")) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid file type. Only images are allowed.",
		})
		return
	}

	// 验证文件大小 (最大 10MB)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "File too large. Maximum size is 10MB.",
		})
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Unix()
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", timestamp, generateRandomString(8), ext)

	// 确保上传目录存在
	uploadDir := "./uploads/images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create upload directory: " + err.Error(),
		})
		return
	}

	// 保存文件
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to save file: " + err.Error(),
		})
		return
	}

	// 生成访问URL
	imageURL := fmt.Sprintf("/uploads/images/%s", filename)

	// 生成模拟的IPFS哈希
	contentHash := generateContentHash(filename)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"filename":     filename,
			"originalName": file.Filename,
			"size":         file.Size,
			"url":          imageURL,
			"contentHash":  contentHash,
			"contentType":  file.Header.Get("Content-Type"),
		},
	})
}

// isValidImageType 验证图片类型
func isValidImageType(contentType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

// generateRandomString 生成随机字符串
func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

// generateContentHash 生成内容哈希
func generateContentHash(filename string) string {
	timestamp := time.Now().Unix()
	random := generateRandomString(12)
	cleanName := strings.ReplaceAll(filename, ".", "")

	// 生成类似IPFS的哈希格式
	return fmt.Sprintf("Qm%s%s%d", random, cleanName, timestamp)[:46]
}