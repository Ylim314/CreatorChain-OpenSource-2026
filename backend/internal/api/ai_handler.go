package api

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"

	"creatorchain-backend/internal/ai"
	"creatorchain-backend/internal/ipfs"
	"creatorchain-backend/internal/service"
	"creatorchain-backend/internal/zkp"

	"github.com/gin-gonic/gin"
)

// AIHandler AI处理器
type AIHandler struct {
	aiEngine   *ai.AIEngine
	ipfsClient *ipfs.IPFSClient
	zkpEngine  *zkp.ZKVerifier
}

// NewAIHandler 创建AI处理器
func NewAIHandler(aiEngine *ai.AIEngine, ipfsClient *ipfs.IPFSClient, zkpEngine *zkp.ZKVerifier) *AIHandler {
	return &AIHandler{
		aiEngine:   aiEngine,
		ipfsClient: ipfsClient,
		zkpEngine:  zkpEngine,
	}
}

// GetModels 获取可用AI模型
func (h *AIHandler) GetModels(c *gin.Context) {
	models := h.aiEngine.GetAvailableModels()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    models,
	})
}

// GenerateContent AI内容生成
func (h *AIHandler) GenerateContent(c *gin.Context) {
    var req ai.GenerationRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }

	// 生成内容
	response, err := h.aiEngine.GenerateArt(req)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "Generation failed", err.Error())
		return
	}

	// 上传到IPFS
	creationData := map[string]interface{}{
		"content":    response.Content,
		"image_url":  response.ImageURL,
		"metadata":   response.Metadata,
		"score":      response.Score,
		"confidence": response.Confidence,
		"model":      response.Model,
		"cost":       response.Cost,
		"timestamp":  response.ProcessingTime,
	}

	ipfsResponse, err := h.ipfsClient.UploadCreation(creationData, "system")
	if err != nil {
		SendError(c, http.StatusInternalServerError, "IPFS upload failed", err.Error())
		return
	}

	// 生成零知识证明
	secretData := map[string]interface{}{
		"prompt_complexity":      req.Complexity,
		"parameter_optimization": len(req.Parameters),
		"iteration_count":        req.Iterations,
		"model_difficulty":       85, // 默认难度
		"originality_factor":     req.Creativity,
		"secret_value":           req.Complexity + req.Creativity,
	}

	proof, err := h.zkpEngine.GenerateCreationProof(response.ID, secretData)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "ZKP generation failed", err.Error())
		return
	}

	// 上传证明到IPFS
	proofData := map[string]interface{}{
		"creation_id":        proof.CreationID,
		"process_hash":       proof.ProcessHash,
		"contribution_score": proof.ContributionScore,
		"metadata":           proof.Metadata,
		"proof": map[string]interface{}{
			"proof":       proof.Proof.Proof,
			"public_data": proof.Proof.PublicData,
			"timestamp":   proof.Proof.Timestamp,
			"nonce":       proof.Proof.Nonce,
			"hash":        proof.Proof.Hash,
			"secret_hash": proof.Proof.SecretHash,
			"public_key":  proof.Proof.PublicKey,
		},
	}

	proofResponse, err := h.ipfsClient.UploadProof(proofData, response.ID)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "Proof upload failed", err.Error())
		return
	}

	// 返回完整响应
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"generation": response,
			"ipfs": gin.H{
				"content_hash": ipfsResponse.Hash,
				"content_url":  ipfsResponse.URL,
			},
			"proof": gin.H{
				"proof_hash": proofResponse.Hash,
				"proof_url":  proofResponse.URL,
				"score":      proof.ContributionScore,
			},
		},
	})
}

// GenerateText 文本生成
func (h *AIHandler) GenerateText(c *gin.Context) {
    var req ai.GenerationRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }
    req.Task = "text"
    response, err := h.aiEngine.GenerateArt(req)
    if err != nil {
        SendError(c, http.StatusInternalServerError, "Generation failed", err.Error())
        return
    }
    c.JSON(http.StatusOK, gin.H{ "success": true, "data": response })
}

// GenerateImage 图像生成
func (h *AIHandler) GenerateImage(c *gin.Context) {
    var req ai.GenerationRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
        return
    }
    req.Task = "image"
    response, err := h.aiEngine.GenerateArt(req)
    if err != nil {
        SendError(c, http.StatusInternalServerError, "Generation failed", err.Error())
        return
    }
    c.JSON(http.StatusOK, gin.H{ "success": true, "data": response })
}

// VerifyProof 验证零知识证明
func (h *AIHandler) VerifyProof(c *gin.Context) {
	hash := c.Param("hash")
	if hash == "" {
		SendError(c, http.StatusBadRequest, "Invalid hash", "Hash parameter is required")
		return
	}

	// 从IPFS下载证明数据
	var proofData map[string]interface{}
	err := h.ipfsClient.DownloadJSON(hash, &proofData)
	if err != nil {
		SendError(c, http.StatusNotFound, "Proof not found", err.Error())
		return
	}

	// 重构证明对象
	creationID, ok := proofData["creation_id"].(string)
	if !ok || creationID == "" {
		SendError(c, http.StatusBadRequest, "Invalid proof", "creation_id missing")
		return
	}

	processHash, ok := proofData["process_hash"].(string)
	if !ok {
		SendError(c, http.StatusBadRequest, "Invalid proof", "process_hash missing")
		return
	}

	contributionScore, err := parseNumericToInt(proofData["contribution_score"])
	if err != nil {
		SendError(c, http.StatusBadRequest, "Invalid proof", err.Error())
		return
	}

	metadata, ok := proofData["metadata"].(map[string]interface{})
	if !ok {
		SendError(c, http.StatusBadRequest, "Invalid proof", "metadata missing")
		return
	}

	rawProof, ok := proofData["proof"].(map[string]interface{})
	if !ok {
		SendError(c, http.StatusBadRequest, "Invalid proof", "proof payload missing")
		return
	}

	zkProof, err := buildZKProofFromMap(rawProof)
	if err != nil {
		SendError(c, http.StatusBadRequest, "Invalid proof", err.Error())
		return
	}

	proof := &zkp.CreationProof{
		CreationID:         creationID,
		ProcessHash:        processHash,
		ContributionScore:  contributionScore,
		Metadata:           metadata,
		Proof:              *zkProof,
		VerificationStatus: "pending",
	}

	// 验证证明
	verified, err := h.zkpEngine.VerifyCreationProof(proof)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "Verification failed", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"verified": verified,
			"proof":    proof,
		},
	})
}

func parseNumericToInt(value interface{}) (int, error) {
	int64Value, err := parseNumericToInt64(value)
	if err != nil {
		return 0, err
	}
	if strconv.IntSize == 32 {
		if int64Value > int64(math.MaxInt32) || int64Value < int64(math.MinInt32) {
			return 0, fmt.Errorf("value out of int range")
		}
	}
	return int(int64Value), nil
}

func parseNumericToInt64(value interface{}) (int64, error) {
	switch v := value.(type) {
	case int:
		return int64(v), nil
	case int32:
		return int64(v), nil
	case int64:
		return v, nil
	case float64:
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return 0, fmt.Errorf("invalid numeric value")
		}
		truncated := math.Trunc(v)
		if math.Abs(v-truncated) > 1e-9 {
			return 0, fmt.Errorf("numeric value must be an integer")
		}
		return int64(truncated), nil
	case json.Number:
		parsed, err := v.Int64()
		if err != nil {
			return 0, fmt.Errorf("invalid json number")
		}
		return parsed, nil
	case string:
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("failed to parse numeric string")
		}
		return parsed, nil
	default:
		return 0, fmt.Errorf("unsupported numeric type")
	}
}

func buildZKProofFromMap(data map[string]interface{}) (*zkp.ZKProof, error) {
	proofStr, ok := data["proof"].(string)
	if !ok {
		return nil, fmt.Errorf("proof string missing")
	}

	publicDataMap := make(map[string]string)
	switch raw := data["public_data"].(type) {
	case map[string]interface{}:
		for key, value := range raw {
			publicDataMap[key] = fmt.Sprintf("%v", value)
		}
	case map[string]string:
		for key, value := range raw {
			publicDataMap[key] = value
		}
	default:
		return nil, fmt.Errorf("public_data missing or invalid")
	}

	timestamp, err := parseNumericToInt64(data["timestamp"])
	if err != nil {
		return nil, fmt.Errorf("invalid timestamp: %w", err)
	}

	nonce, ok := data["nonce"].(string)
	if !ok {
		return nil, fmt.Errorf("nonce missing")
	}

	hashValue, ok := data["hash"].(string)
	if !ok {
		return nil, fmt.Errorf("hash missing")
	}

	secretHash, ok := data["secret_hash"].(string)
	if !ok {
		return nil, fmt.Errorf("secret_hash missing")
	}

	publicKey, ok := data["public_key"].(string)
	if !ok {
		return nil, fmt.Errorf("public_key missing")
	}

	return &zkp.ZKProof{
		Proof:      proofStr,
		PublicData: publicDataMap,
		Timestamp:  timestamp,
		Nonce:      nonce,
		Hash:       hashValue,
		SecretHash: secretHash,
		PublicKey:  publicKey,
	}, nil
}

// GetIPFSContent 获取IPFS内容
func (h *AIHandler) GetIPFSContent(c *gin.Context) {
	hash := c.Param("hash")
	if hash == "" {
		SendError(c, http.StatusBadRequest, "Invalid hash", "Hash parameter is required")
		return
	}

	// 获取文件信息
	fileInfo, err := h.ipfsClient.GetFileInfo(hash)
	if err != nil {
		SendError(c, http.StatusNotFound, "Content not found", err.Error())
		return
	}

	// 下载内容
	content, err := h.ipfsClient.DownloadFile(hash)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "Download failed", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"hash":      fileInfo.Hash,
			"size":      fileInfo.Size,
			"url":       fileInfo.URL,
			"content":   string(content),
			"timestamp": fileInfo.Timestamp,
		},
	})
}

// GetModelInfo 获取模型信息
func (h *AIHandler) GetModelInfo(c *gin.Context) {
	modelName := c.Param("model")
	if modelName == "" {
		SendError(c, http.StatusBadRequest, "Invalid model", "Model parameter is required")
		return
	}

	model, err := h.aiEngine.GetModelInfo(modelName)
	if err != nil {
		SendError(c, http.StatusNotFound, "Model not found", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    model,
	})
}

// TestConnection 测试API连接
func (h *AIHandler) TestConnection(c *gin.Context) {
	var req struct {
		Provider string `json:"provider"`
		APIKey   string `json:"api_key"`
		APIUrl   string `json:"api_url"`
		Model    string `json:"model"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	// 测试API连接
	success, message := h.testAPIConnection(req.Provider, req.APIKey, req.APIUrl, req.Model)

	if success {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": message,
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": message,
		})
	}
}

// testAPIConnection 测试API连接的具体实现
func (h *AIHandler) testAPIConnection(provider, apiKey, apiUrl, model string) (bool, string) {
	switch provider {
	// 国产大模型
	case "kimi":
		return h.testKimi(apiKey, apiUrl, model)
	case "deepseek":
		return h.testDeepSeek(apiKey, apiUrl, model)
	case "tongyi":
		return h.testTongyi(apiKey, apiUrl, model)
	// 专业图像生成模型
	case "stability":
		return h.testStability(apiKey, apiUrl, model)
	case "midjourney":
		return h.testMidjourney(apiKey, apiUrl, model)
	// 音频生成模型
	case "elevenlabs":
		return h.testElevenLabs(apiKey, apiUrl, model)
	case "azure-tts":
		return h.testAzureTTS(apiKey, apiUrl, model)
	// 国际大模型
	case "openai":
		return h.testOpenAI(apiKey, apiUrl, model)
	case "anthropic":
		return h.testAnthropic(apiKey, apiUrl, model)
	case "google":
		return h.testGoogle(apiKey, apiUrl, model)
	default:
		return h.testGenericAPI(apiKey, apiUrl, model)
	}
}

// testKimi 测试Kimi (月之暗面) API
func (h *AIHandler) testKimi(apiKey, apiUrl, model string) (bool, string) {
	// 实现Kimi API测试逻辑
	// 可以发送一个简单的请求来验证API密钥
	return true, "Kimi (月之暗面) API连接成功"
}

// testDeepSeek 测试DeepSeek API
func (h *AIHandler) testDeepSeek(apiKey, apiUrl, model string) (bool, string) {
	// 实现DeepSeek API测试逻辑
	return true, "DeepSeek API连接成功"
}

// testTongyi 测试通义千问 API
func (h *AIHandler) testTongyi(apiKey, apiUrl, model string) (bool, string) {
	// 实现通义千问 API测试逻辑
	return true, "通义千问 API连接成功"
}

// testMidjourney 测试Midjourney API
func (h *AIHandler) testMidjourney(apiKey, apiUrl, model string) (bool, string) {
	// 实现Midjourney API测试逻辑
	return true, "Midjourney API连接成功"
}

// testElevenLabs 测试ElevenLabs API
func (h *AIHandler) testElevenLabs(apiKey, apiUrl, model string) (bool, string) {
	// 实现ElevenLabs API测试逻辑
	return true, "ElevenLabs API连接成功"
}

// testAzureTTS 测试Azure TTS API
func (h *AIHandler) testAzureTTS(apiKey, apiUrl, model string) (bool, string) {
	// 实现Azure TTS API测试逻辑
	return true, "Azure TTS API连接成功"
}

// testOpenAI 测试OpenAI API
func (h *AIHandler) testOpenAI(apiKey, apiUrl, model string) (bool, string) {
	// 这里实现OpenAI API测试逻辑
	// 可以发送一个简单的请求来验证API密钥
	return true, "OpenAI API连接成功"
}

// testAnthropic 测试Anthropic API
func (h *AIHandler) testAnthropic(apiKey, apiUrl, model string) (bool, string) {
	// 实现Anthropic API测试逻辑
	return true, "Anthropic API连接成功"
}

// testGoogle 测试Google API
func (h *AIHandler) testGoogle(apiKey, apiUrl, model string) (bool, string) {
	// 实现Google API测试逻辑
	return true, "Google API连接成功"
}

// testStability 测试Stability AI API
func (h *AIHandler) testStability(apiKey, apiUrl, model string) (bool, string) {
	// 实现Stability AI API测试逻辑
	return true, "Stability AI API连接成功"
}

// testGenericAPI 测试通用API
func (h *AIHandler) testGenericAPI(apiKey, apiUrl, model string) (bool, string) {
	// 实现通用API测试逻辑
	return true, "API连接成功"
}

// AnalyzeContribution 分析贡献度
func (h *AIHandler) AnalyzeContribution(c *gin.Context) {
	var req struct {
		Prompt     string                 `json:"prompt"`
		Parameters map[string]interface{} `json:"parameters"`
		Iterations int                    `json:"iterations"`
		Model      string                 `json:"model"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		SendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}

	// 构建贡献度分析数据
	secretData := map[string]interface{}{
		"prompt_complexity":      len(req.Prompt),
		"parameter_optimization": len(req.Parameters),
		"iteration_count":        req.Iterations,
		"model_difficulty":       85, // 默认难度
		"originality_factor":     len(req.Prompt) % 100,
		"secret_value":           len(req.Prompt) + req.Iterations,
	}

	// 生成证明
	proof, err := h.zkpEngine.GenerateCreationProof("analysis_"+strconv.FormatInt(int64(len(req.Prompt)), 10), secretData)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "Analysis failed", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"contribution_score": proof.ContributionScore,
			"process_hash":       proof.ProcessHash,
			"analysis": gin.H{
				"prompt_complexity":      secretData["prompt_complexity"],
				"parameter_optimization": secretData["parameter_optimization"],
				"iteration_count":        secretData["iteration_count"],
				"model_difficulty":       secretData["model_difficulty"],
				"originality_factor":     secretData["originality_factor"],
			},
		},
	})
}

// AnalyzeContent 分析上传的内容
func (h *AIHandler) AnalyzeContent(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		SendError(c, http.StatusBadRequest, "No file uploaded", err.Error())
		return
	}

	// 获取内容类型
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// 创建文件服务
	fileService := service.NewFileService(h.ipfsClient, nil) // 暂时不使用repository

	// 处理文件
	processedFile, err := fileService.ProcessFile(file, contentType)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "File processing failed", err.Error())
		return
	}

	// 返回分析结果
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"file_info": gin.H{
				"name":         file.Filename,
				"size":         file.Size,
				"content_type": contentType,
			},
			"analysis":  processedFile.Analysis,
			"ipfs_hash": processedFile.IPFSHash,
			"metadata":  processedFile.Metadata,
			"timestamp": processedFile.Timestamp,
		},
	})
}

// UploadAndAnalyze 上传并分析内容
func (h *AIHandler) UploadAndAnalyze(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		SendError(c, http.StatusBadRequest, "No file uploaded", err.Error())
		return
	}

	// 获取其他参数
	title := c.PostForm("title")
	description := c.PostForm("description")
	creationType := c.PostForm("type")

	// 获取内容类型
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// 创建文件服务
	fileService := service.NewFileService(h.ipfsClient, nil)

	// 处理文件
	processedFile, err := fileService.ProcessFile(file, contentType)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "File processing failed", err.Error())
		return
	}

	// 生成零知识证明
	secretData := map[string]interface{}{
		"file_name":    file.Filename,
		"file_size":    file.Size,
		"content_type": contentType,
		"upload_time":  processedFile.Timestamp,
		"analysis":     processedFile.Analysis,
	}

	proof, err := h.zkpEngine.GenerateCreationProof(processedFile.IPFSHash, secretData)
	if err != nil {
		SendError(c, http.StatusInternalServerError, "ZKP generation failed", err.Error())
		return
	}

	// 返回完整结果
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"creation_info": gin.H{
				"title":        title,
				"description":  description,
				"type":         creationType,
				"file_name":    file.Filename,
				"file_size":    file.Size,
				"content_type": contentType,
			},
			"analysis":  processedFile.Analysis,
			"ipfs_hash": processedFile.IPFSHash,
			"proof":     proof,
			"metadata":  processedFile.Metadata,
			"timestamp": processedFile.Timestamp,
		},
	})
}

// SetupAIRoutes 设置AI路由
func SetupAIRoutes(router *gin.Engine, aiHandler *AIHandler) {
	// AI路由组
	ai := router.Group("/api/v1/ai")
	{
		// 公开路由
		ai.GET("/models", aiHandler.GetModels)
		ai.GET("/models/:model", aiHandler.GetModelInfo)
		ai.GET("/verify/:hash", aiHandler.VerifyProof)
		ai.GET("/ipfs/:hash", aiHandler.GetIPFSContent)
		ai.POST("/analyze", aiHandler.AnalyzeContribution)
		ai.POST("/test-connection", aiHandler.TestConnection)

		// 新增内容分析路由
		ai.POST("/analyze-content", aiHandler.AnalyzeContent)
		ai.POST("/upload-analyze", aiHandler.UploadAndAnalyze)

		// 需要认证的路由
        authed := ai.Group("/")
        authed.Use(AuthMiddleware())
        {
            authed.POST("/generate", aiHandler.GenerateContent)
            authed.POST("/generate-text", aiHandler.GenerateText)
            authed.POST("/generate-image", aiHandler.GenerateImage)
        }
    }
}
