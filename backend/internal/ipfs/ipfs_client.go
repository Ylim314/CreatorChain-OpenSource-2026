package ipfs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// IPFSClient IPFS客户端 - 企业级实现
type IPFSClient struct {
	gatewayURL string
	apiURL     string
	apiKey     string
	secretKey  string
	client     *http.Client
}

// IPFSResponse IPFS响应结构
type IPFSResponse struct {
	Hash      string            `json:"hash"`
	Size      int64             `json:"size"`
	Name      string            `json:"name"`
	URL       string            `json:"url"`
	Metadata  map[string]string `json:"metadata"`
	Timestamp int64             `json:"timestamp"`
}

// IPFSMetadata IPFS元数据结构
type IPFSMetadata struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Type        string            `json:"type"`
	Size        int64             `json:"size"`
	Hash        string            `json:"hash"`
	Timestamp   int64             `json:"timestamp"`
	Attributes  map[string]string `json:"attributes"`
	Creator     string            `json:"creator"`
	License     string            `json:"license"`
}

// ToJSON 将元数据转换为JSON字符串
func (m *IPFSMetadata) ToJSON() string {
	data, _ := json.Marshal(m)
	return string(data)
}

// PinataResponse Pinata API响应
type PinataResponse struct {
	IpfsHash  string `json:"IpfsHash"`
	PinSize   int64  `json:"PinSize"`
	Timestamp string `json:"Timestamp"`
}

// NewIPFSClient 创建IPFS客户端
func NewIPFSClient(gatewayURL, apiURL, apiKey, secretKey string) *IPFSClient {
	return &IPFSClient{
		gatewayURL: gatewayURL,
		apiURL:     apiURL,
		apiKey:     apiKey,
		secretKey:  secretKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// UploadFile 上传文件到IPFS
func (ipfs *IPFSClient) UploadFile(filePath string, metadata *IPFSMetadata) (*IPFSResponse, error) {
	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file not found: %s", filePath)
	}

	// 创建multipart form
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// 添加文件
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	fw, err := w.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err = io.Copy(fw, file); err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// 添加元数据
	if metadata != nil {
		metadataJSON, err := json.Marshal(metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}

		if err := w.WriteField("pinataMetadata", string(metadataJSON)); err != nil {
			return nil, fmt.Errorf("failed to write metadata: %w", err)
		}
	}

	w.Close()

	// 发送请求
	req, err := http.NewRequest("POST", ipfs.apiURL+"/pinning/pinFileToIPFS", &b)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("pinata_api_key", ipfs.apiKey)
	req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

	resp, err := ipfs.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var pinataResp PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &IPFSResponse{
		Hash:      pinataResp.IpfsHash,
		Size:      pinataResp.PinSize,
		Name:      filepath.Base(filePath),
		URL:       fmt.Sprintf("%s/ipfs/%s", ipfs.gatewayURL, pinataResp.IpfsHash),
		Metadata:  map[string]string{},
		Timestamp: time.Now().Unix(),
	}, nil
}

// UploadMultipartFile 上传multipart.FileHeader到IPFS
func (ipfs *IPFSClient) UploadMultipartFile(file *multipart.FileHeader, metadata *IPFSMetadata) (*IPFSResponse, error) {
	// 创建multipart form
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// 添加文件
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	fw, err := w.CreateFormFile("file", file.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := io.Copy(fw, src); err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// 添加元数据
	if metadata != nil {
		if err := w.WriteField("metadata", metadata.ToJSON()); err != nil {
			return nil, fmt.Errorf("failed to write metadata: %w", err)
		}
	}

	w.Close()

	// 创建请求
	req, err := http.NewRequest("POST", ipfs.apiURL+"/pinning/pinFileToIPFS", &b)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("pinata_api_key", ipfs.apiKey)
	req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

	// 发送请求
	resp, err := ipfs.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var pinataResp PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &IPFSResponse{
		Hash:      pinataResp.IpfsHash,
		Size:      pinataResp.PinSize,
		Name:      file.Filename,
		URL:       fmt.Sprintf("%s/ipfs/%s", ipfs.gatewayURL, pinataResp.IpfsHash),
		Metadata:  map[string]string{},
		Timestamp: time.Now().Unix(),
	}, nil
}

// UploadJSON 上传JSON数据到IPFS
func (ipfs *IPFSClient) UploadJSON(data interface{}, metadata *IPFSMetadata) (*IPFSResponse, error) {
	// 序列化JSON数据
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// 创建multipart form
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// 添加JSON数据
	fw, err := w.CreateFormFile("file", "data.json")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err = fw.Write(jsonData); err != nil {
		return nil, fmt.Errorf("failed to write JSON data: %w", err)
	}

	// 添加元数据
	if metadata != nil {
		metadataJSON, err := json.Marshal(metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}

		if err := w.WriteField("pinataMetadata", string(metadataJSON)); err != nil {
			return nil, fmt.Errorf("failed to write metadata: %w", err)
		}
	}

	w.Close()

	// 发送请求
	req, err := http.NewRequest("POST", ipfs.apiURL+"/pinning/pinFileToIPFS", &b)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("pinata_api_key", ipfs.apiKey)
	req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

	resp, err := ipfs.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload JSON: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var pinataResp PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &IPFSResponse{
		Hash:      pinataResp.IpfsHash,
		Size:      pinataResp.PinSize,
		Name:      "data.json",
		URL:       fmt.Sprintf("%s/ipfs/%s", ipfs.gatewayURL, pinataResp.IpfsHash),
		Metadata:  map[string]string{},
		Timestamp: time.Now().Unix(),
	}, nil
}

// DownloadFile 从IPFS下载文件
func (ipfs *IPFSClient) DownloadFile(hash string) ([]byte, error) {
	url := fmt.Sprintf("%s/ipfs/%s", ipfs.gatewayURL, hash)

	resp, err := ipfs.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return data, nil
}

// DownloadJSON 从IPFS下载JSON数据
func (ipfs *IPFSClient) DownloadJSON(hash string, target interface{}) error {
	data, err := ipfs.DownloadFile(hash)
	if err != nil {
		return fmt.Errorf("failed to download JSON: %w", err)
	}

	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return nil
}

// PinHash 固定IPFS哈希
func (ipfs *IPFSClient) PinHash(hash string) error {
	data := map[string]string{
		"hashToPin": hash,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	req, err := http.NewRequest("POST", ipfs.apiURL+"/pinning/pinByHash", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("pinata_api_key", ipfs.apiKey)
	req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

	resp, err := ipfs.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to pin hash: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("pin failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// UnpinHash 取消固定IPFS哈希
func (ipfs *IPFSClient) UnpinHash(hash string) error {
	req, err := http.NewRequest("DELETE", ipfs.apiURL+"/pinning/unpin/"+hash, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("pinata_api_key", ipfs.apiKey)
	req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

	resp, err := ipfs.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to unpin hash: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unpin failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetFileInfo 获取文件信息
func (ipfs *IPFSClient) GetFileInfo(hash string) (*IPFSResponse, error) {
	// 尝试从多个网关获取文件信息
	gateways := []string{
		ipfs.gatewayURL,
		"https://ipfs.io",
		"https://gateway.pinata.cloud",
		"https://cloudflare-ipfs.com",
	}

	for _, gateway := range gateways {
		url := fmt.Sprintf("%s/ipfs/%s", gateway, hash)

		resp, err := ipfs.client.Head(url)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			size := resp.ContentLength
			if size == -1 {
				size = 0
			}

			return &IPFSResponse{
				Hash:      hash,
				Size:      size,
				Name:      "unknown",
				URL:       url,
				Metadata:  map[string]string{},
				Timestamp: time.Now().Unix(),
			}, nil
		}
	}

	return nil, fmt.Errorf("file not found in any gateway")
}

// VerifyHash 验证IPFS哈希
func (ipfs *IPFSClient) VerifyHash(hash string) bool {
	// 验证哈希格式
	if len(hash) != 46 || !strings.HasPrefix(hash, "Qm") {
		return false
	}

	// 尝试访问文件
	_, err := ipfs.GetFileInfo(hash)
	return err == nil
}

// CreateMetadata 创建IPFS元数据
func (ipfs *IPFSClient) CreateMetadata(name, description, fileType, creator, license string, attributes map[string]string) *IPFSMetadata {
	return &IPFSMetadata{
		Name:        name,
		Description: description,
		Type:        fileType,
		Size:        0,
		Hash:        "",
		Timestamp:   time.Now().Unix(),
		Attributes:  attributes,
		Creator:     creator,
		License:     license,
	}
}

// UploadCreation 上传创作作品到IPFS
func (ipfs *IPFSClient) UploadCreation(creationData map[string]interface{}, creatorAddress string) (*IPFSResponse, error) {
	// 创建创作元数据
	metadata := ipfs.CreateMetadata(
		"AI Creation",
		"AI generated artwork",
		"image",
		creatorAddress,
		"CC BY-NC 4.0",
		map[string]string{
			"creator":  creatorAddress,
			"type":     "ai_creation",
			"platform": "creatorchain",
		},
	)

	// 上传创作数据
	return ipfs.UploadJSON(creationData, metadata)
}

// UploadProof 上传零知识证明到IPFS
func (ipfs *IPFSClient) UploadProof(proofData map[string]interface{}, creationID string) (*IPFSResponse, error) {
	// 创建证明元数据
	metadata := ipfs.CreateMetadata(
		"ZK Proof",
		"Zero-knowledge proof of creation",
		"proof",
		"system",
		"MIT",
		map[string]string{
			"creation_id": creationID,
			"type":        "zk_proof",
			"platform":    "creatorchain",
		},
	)

	// 上传证明数据
	return ipfs.UploadJSON(proofData, metadata)
}
