package service

import (
	"creatorchain-backend/internal/analysis"
	"creatorchain-backend/internal/ipfs"
	"creatorchain-backend/internal/repository"
	"fmt"
	"mime/multipart"
	"strings"
	"time"
)

// FileService 文件处理服务
type FileService struct {
	ipfsClient      *ipfs.IPFSClient
	contentAnalyzer *analysis.ContentAnalyzer
	creationRepo    repository.CreationRepository
}

// ProcessedFile 处理后的文件
type ProcessedFile struct {
	File      *multipart.FileHeader     `json:"file"`
	Analysis  *analysis.ContentAnalysis `json:"analysis"`
	IPFSHash  string                    `json:"ipfs_hash"`
	Metadata  map[string]interface{}    `json:"metadata"`
	Timestamp int64                     `json:"timestamp"`
}

// NewFileService 创建文件服务
func NewFileService(ipfsClient *ipfs.IPFSClient, creationRepo repository.CreationRepository) *FileService {
	return &FileService{
		ipfsClient:      ipfsClient,
		contentAnalyzer: analysis.NewContentAnalyzer(),
		creationRepo:    creationRepo,
	}
}

// ProcessFile 处理文件
func (fs *FileService) ProcessFile(file *multipart.FileHeader, contentType string) (*ProcessedFile, error) {
	// 1. 验证文件
	if err := fs.validateFile(file, contentType); err != nil {
		return nil, fmt.Errorf("file validation failed: %w", err)
	}

	// 2. 分析内容
	analysis, err := fs.contentAnalyzer.AnalyzeContent(file, contentType)
	if err != nil {
		return nil, fmt.Errorf("content analysis failed: %w", err)
	}

	// 3. 上传到IPFS
	ipfsResp, err := fs.ipfsClient.UploadMultipartFile(file, nil)
	if err != nil {
		return nil, fmt.Errorf("IPFS upload failed: %w", err)
	}
	ipfsHash := ipfsResp.Hash

	// 4. 生成元数据
	metadata := map[string]interface{}{
		"original_name": file.Filename,
		"content_type":  contentType,
		"file_size":     file.Size,
		"upload_time":   time.Now().Unix(),
		"analysis":      analysis,
	}

	return &ProcessedFile{
		File:      file,
		Analysis:  analysis,
		IPFSHash:  ipfsHash,
		Metadata:  metadata,
		Timestamp: time.Now().Unix(),
	}, nil
}

// validateFile 验证文件
func (fs *FileService) validateFile(file *multipart.FileHeader, contentType string) error {
	// 检查文件大小
	maxSize := fs.getMaxSizeForType(contentType)
	if file.Size > maxSize {
		return fmt.Errorf("file size %d exceeds maximum allowed size %d", file.Size, maxSize)
	}

	// 检查文件类型
	if !fs.isAllowedType(contentType) {
		return fmt.Errorf("file type %s is not allowed", contentType)
	}

	return nil
}

// getMaxSizeForType 获取文件类型的最大大小
func (fs *FileService) getMaxSizeForType(contentType string) int64 {
	switch {
	case strings.HasPrefix(contentType, "video/"):
		return 500 * 1024 * 1024 // 500MB
	case strings.HasPrefix(contentType, "audio/"):
		return 100 * 1024 * 1024 // 100MB
	case strings.HasPrefix(contentType, "image/"):
		return 50 * 1024 * 1024 // 50MB
	case strings.HasPrefix(contentType, "text/"):
		return 10 * 1024 * 1024 // 10MB
	default:
		return 100 * 1024 * 1024 // 100MB
	}
}

// isAllowedType 检查文件类型是否允许
func (fs *FileService) isAllowedType(contentType string) bool {
	allowedTypes := []string{
		"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
		"video/mp4", "video/avi", "video/mov", "video/webm", "video/quicktime",
		"audio/mp3", "audio/wav", "audio/flac", "audio/aac", "audio/ogg",
		"text/plain", "application/pdf", "application/msword",
		"application/zip", "application/octet-stream",
	}

	for _, allowedType := range allowedTypes {
		if contentType == allowedType {
			return true
		}
	}

	return false
}
