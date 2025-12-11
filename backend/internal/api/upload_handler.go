package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
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
	log.Printf("📤 UploadImage 请求: ContentType=%s", c.ContentType())

	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("❌ UploadImage 获取文件失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No file uploaded: " + err.Error(),
		})
		return
	}

	log.Printf("✅ UploadImage 文件信息: name=%s, size=%d, type=%s",
		file.Filename, file.Size, file.Header.Get("Content-Type"))

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
	buffer := make([]byte, length)
	if _, err := rand.Read(buffer); err != nil {
		fallback := fmt.Sprintf("fallback%x", time.Now().UnixNano())
		if len(fallback) >= length {
			return fallback[:length]
		}
		return fallback
	}
	for i := range buffer {
		buffer[i] = charset[int(buffer[i])%len(charset)]
	}
	return string(buffer)
}

// UploadAudio 上传音频文件
func (h *UploadHandler) UploadAudio(c *gin.Context) {
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
	if !isValidAudioType(file.Header.Get("Content-Type")) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid file type. Only audio files are allowed.",
		})
		return
	}

	// 验证文件大小 (最大 100MB，音频文件通常较大)
	if file.Size > 100*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "File too large. Maximum size is 100MB.",
		})
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Unix()
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", timestamp, generateRandomString(8), ext)

	// 确保上传目录存在
	uploadDir := "./uploads/audio"
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
	audioURL := fmt.Sprintf("/uploads/audio/%s", filename)

	// 生成模拟的IPFS哈希
	contentHash := generateContentHash(filename)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"filename":     filename,
			"originalName": file.Filename,
			"size":         file.Size,
			"url":          audioURL,
			"contentHash":  contentHash,
			"contentType":  file.Header.Get("Content-Type"),
		},
	})
}

// isValidAudioType 验证音频类型
func isValidAudioType(contentType string) bool {
	validTypes := []string{
		"audio/mpeg",  // .mp3
		"audio/mp3",   // .mp3 (某些浏览器)
		"audio/wav",   // .wav
		"audio/wave",  // .wav (某些浏览器)
		"audio/x-wav", // .wav (某些浏览器)
		"audio/ogg",   // .ogg
		"audio/opus",  // .opus
		"audio/mp4",   // .m4a (iOS/Android录音)
		"audio/x-m4a", // .m4a (某些浏览器)
		"audio/aac",   // .aac
		"audio/aacp",  // .aac (某些浏览器)
		"audio/3gpp",  // .3gp (Android录音)
		"audio/amr",   // .amr (Android录音)
		"audio/x-caf", // .caf (iOS录音)
		"audio/flac",  // .flac
		"audio/webm",  // .webm
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

// generateContentHash 生成内容哈希
func generateContentHash(filename string) string {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		randomBytes = []byte(strconv.FormatInt(time.Now().UnixNano(), 10))
	}

	hash := sha256.New()
	hash.Write(randomBytes)
	hash.Write([]byte(filename))

	digest := hash.Sum(nil)
	digestHex := hex.EncodeToString(digest)
	// 模拟IPFS CID的长度特征
	if len(digestHex) < 44 {
		digestHex = fmt.Sprintf("%044s", digestHex)
	}
	return "Qm" + digestHex[:44]
}
