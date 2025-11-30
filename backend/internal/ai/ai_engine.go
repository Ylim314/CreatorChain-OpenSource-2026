package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// AIEngine AI创作引擎 - 企业级实现
type AIEngine struct {
	apiKey  string
	baseURL string
	client  *http.Client
	models  map[string]AIModel
}

// AIModel AI模型配置
type AIModel struct {
    Name        string  `json:"name"`
    Provider    string  `json:"provider"`
    Accuracy    float64 `json:"accuracy"`
    Cost        float64 `json:"cost"`
    MaxTokens   int     `json:"max_tokens"`
    Temperature float64 `json:"temperature"`
    Capabilities []string `json:"capabilities,omitempty"`
    Type         string   `json:"type,omitempty"`
}

// GenerationRequest AI生成请求
type GenerationRequest struct {
    Prompt     string                 `json:"prompt"`
    Style      string                 `json:"style"`
    Complexity int                    `json:"complexity"`
    Creativity int                    `json:"creativity"`
    Model      string                 `json:"model"`
    Parameters map[string]interface{} `json:"parameters"`
    Iterations int                    `json:"iterations"`
    Task       string                 `json:"task"` // text | image
}

// GenerationResponse AI生成响应
type GenerationResponse struct {
	ID             string                 `json:"id"`
	Content        string                 `json:"content"`
	ImageURL       string                 `json:"image_url,omitempty"`
	Metadata       map[string]interface{} `json:"metadata"`
	Score          float64                `json:"score"`
	Confidence     float64                `json:"confidence"`
	ProcessingTime time.Duration          `json:"processing_time"`
	Model          string                 `json:"model"`
	Cost           float64                `json:"cost"`
}

// ContributionAnalysis 贡献度分析
type ContributionAnalysis struct {
	PromptComplexity      int     `json:"prompt_complexity"`
	ParameterOptimization int     `json:"parameter_optimization"`
	ModelDifficulty       int     `json:"model_difficulty"`
	OriginalityFactor     int     `json:"originality_factor"`
	IterationCount        int     `json:"iteration_count"`
	OverallScore          float64 `json:"overall_score"`
}

// NewAIEngine 创建AI引擎实例
func NewAIEngine(apiKey, baseURL string) *AIEngine {
	return &AIEngine{
		apiKey:  apiKey,
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		models: initializeModels(),
	}
}

// initializeModels 初始化AI模型配置 - 2025版本
func initializeModels() map[string]AIModel {
    return map[string]AIModel{
        // 国产AI模型优先
        "glm-4.6": {
            Name:        "智谱GLM-4.6",
            Provider:    "智谱AI",
            Accuracy:    0.96,
            Cost:        2, // 积分
            MaxTokens:   150000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "glm-4-air": {
            Name:        "智谱GLM-4-Air",
            Provider:    "智谱AI",
            Accuracy:    0.91,
            Cost:        1, // 积分 - 高性价比
            MaxTokens:   128000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "glm-4v-plus": {
            Name:        "智谱GLM-4V-Plus",
            Provider:    "智谱AI",
            Accuracy:    0.95,
            Cost:        4, // 积分 - 多模态
            MaxTokens:   8000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "cogview-4": {
            Name:        "智谱CogView-4",
            Provider:    "智谱AI",
            Accuracy:    0.93,
            Cost:        5, // 积分 - 图像生成
            MaxTokens:   2000,
            Temperature: 0.8,
            Capabilities: []string{"image"},
            Type:         "image_generation",
        },
        // 国外模型作为备选
        "stable-diffusion": {
            Name:        "Stable Diffusion XL",
            Provider:    "Stability AI",
            Accuracy:    0.92,
            Cost:        5, // 积分
            MaxTokens:   1000,
            Temperature: 0.7,
            Capabilities: []string{"image"},
            Type:         "image_generation",
        },
        "dall-e-3": {
            Name:        "DALL-E 3",
            Provider:    "OpenAI",
            Accuracy:    0.95,
            Cost:        8, // 积分
            MaxTokens:   4000,
            Temperature: 0.8,
            Capabilities: []string{"image"},
            Type:         "image_generation",
        },
        "midjourney": {
            Name:        "Midjourney v6",
            Provider:    "Midjourney",
            Accuracy:    0.94,
            Cost:        10, // 积分
            MaxTokens:   2000,
            Temperature: 0.6,
            Capabilities: []string{"image"},
            Type:         "image_generation",
        },
        "creative-ai": {
            Name:        "CreativeAI Pro",
            Provider:    "Custom",
            Accuracy:    0.88,
            Cost:        3, // 积分
            MaxTokens:   1500,
            Temperature: 0.9,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        // 优先文本模型（豆包、DeepSeek、Kimi、Qwen）
        "doubao-text": {
            Name:        "Doubao",
            Provider:    "Doubao",
            Accuracy:    0.92,
            Cost:        2,
            MaxTokens:   128000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "deepseek-text": {
            Name:        "DeepSeek",
            Provider:    "DeepSeek",
            Accuracy:    0.93,
            Cost:        2,
            MaxTokens:   128000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "kimi-text": {
            Name:        "Kimi",
            Provider:    "Kimi",
            Accuracy:    0.92,
            Cost:        2,
            MaxTokens:   128000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
        "qwen-text": {
            Name:        "Qwen",
            Provider:    "Qwen",
            Accuracy:    0.93,
            Cost:        2,
            MaxTokens:   128000,
            Temperature: 0.7,
            Capabilities: []string{"text"},
            Type:         "text_generation",
        },
    }
}

// GenerateArt 生成艺术作品 - 企业级AI实现
func (ai *AIEngine) GenerateArt(req GenerationRequest) (*GenerationResponse, error) {
    startTime := time.Now()

	// 验证输入参数
	if err := ai.validateRequest(req); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

    // 选择模型：优先使用显式 req.Model；否则按任务与风格选择
    var model AIModel
    if req.Model != "" {
        if m, ok := ai.models[req.Model]; ok {
            model = m
        } else {
            model = ai.selectBestModel(req)
        }
    } else {
        model = ai.selectBestModel(req)
    }

	// 构建增强提示词
	enhancedPrompt := ai.buildEnhancedPrompt(req)

    // 按任务类型调用
    if req.Task == "text" || (len(model.Capabilities) > 0 && contains(model.Capabilities, "text")) {
        // 文本任务统一走文本生成管线
        response, err := ai.callAIAPI(model, enhancedPrompt, req)
        if err != nil {
            return nil, fmt.Errorf("AI API call failed: %w", err)
        }
        response.ProcessingTime = time.Since(startTime)
        return response, nil
    }

    // 图像任务
    response, err := ai.callAIAPI(model, enhancedPrompt, req)
    if err != nil {
        return nil, fmt.Errorf("AI API call failed: %w", err)
    }

	// 分析贡献度
	analysis := ai.analyzeContribution(req, response)

	processingTime := time.Since(startTime)

	return &GenerationResponse{
		ID:             generateID(),
		Content:        response.Content,
		ImageURL:       response.ImageURL,
		Metadata:       response.Metadata,
		Score:          analysis.OverallScore,
		Confidence:     response.Confidence,
		ProcessingTime: processingTime,
		Model:          model.Name,
		Cost:           model.Cost,
	}, nil
}

// validateRequest 验证请求参数
func (ai *AIEngine) validateRequest(req GenerationRequest) error {
	if req.Prompt == "" {
		return fmt.Errorf("prompt cannot be empty")
	}
	if req.Complexity < 1 || req.Complexity > 100 {
		return fmt.Errorf("complexity must be between 1 and 100")
	}
	if req.Creativity < 1 || req.Creativity > 100 {
		return fmt.Errorf("creativity must be between 1 and 100")
	}
	if req.Iterations < 1 || req.Iterations > 100 {
		return fmt.Errorf("iterations must be between 1 and 100")
	}
	return nil
}

// selectBestModel 选择最佳AI模型
func (ai *AIEngine) selectBestModel(req GenerationRequest) AIModel {
	// 根据风格和复杂度选择最佳模型
	switch req.Style {
	case "realistic", "photorealistic":
		return ai.models["dall-e-3"]
	case "artistic", "painting":
		return ai.models["stable-diffusion"]
	case "creative", "abstract":
		return ai.models["midjourney"]
	default:
		return ai.models["creative-ai"]
	}
}

// buildEnhancedPrompt 构建增强提示词
func (ai *AIEngine) buildEnhancedPrompt(req GenerationRequest) string {
	// 根据复杂度和创造力调整提示词
	complexityModifier := ""
	if req.Complexity > 80 {
		complexityModifier = "highly detailed, intricate, "
	} else if req.Complexity > 50 {
		complexityModifier = "detailed, "
	}

	creativityModifier := ""
	if req.Creativity > 80 {
		creativityModifier = "highly creative, innovative, "
	} else if req.Creativity > 50 {
		creativityModifier = "creative, "
	}

	return fmt.Sprintf("%s%s%s, %s style, professional quality, masterpiece",
		complexityModifier,
		creativityModifier,
		req.Prompt,
		req.Style)
}

// IsMockMode 检查是否为Mock模式（用于Demo演示）
func (ai *AIEngine) IsMockMode() bool {
	// 检查是否配置了任何有效的API Key
	zhipuKey := os.Getenv("ZHIPU_API_KEY")
	openaiKey := os.Getenv("OPENAI_API_KEY")
	stabilityKey := os.Getenv("STABILITY_API_KEY")

	return (zhipuKey == "" || zhipuKey == "mock") &&
		(openaiKey == "" || openaiKey == "mock") &&
		(stabilityKey == "" || stabilityKey == "mock") &&
		(ai.apiKey == "" || ai.apiKey == "mock")
}

// callAIAPI 调用AI API - 支持Mock模式和多模型切换
func (ai *AIEngine) callAIAPI(model AIModel, prompt string, req GenerationRequest) (*GenerationResponse, error) {
	// 检查是否为Mock模式
	if ai.IsMockMode() {
		return ai.callAIAPIMock(model, prompt, req)
	}

	// 根据模型提供商调用不同的API
    switch model.Provider {
    case "智谱AI":
        return ai.callZhipuAI(prompt, req, model)
    case "Doubao":
        return ai.callOpenAIChatCompatible(prompt, req, os.Getenv("DOUBAO_API_KEY"), os.Getenv("DOUBAO_BASE_URL"), req.Model)
    case "DeepSeek":
        return ai.callOpenAIChatCompatible(prompt, req, os.Getenv("DEEPSEEK_API_KEY"), os.Getenv("DEEPSEEK_BASE_URL"), req.Model)
    case "Kimi":
        base := os.Getenv("KIMI_BASE_URL")
        if base == "" { base = "https://api.moonshot.cn" }
        return ai.callOpenAIChatCompatible(prompt, req, os.Getenv("KIMI_API_KEY"), base, req.Model)
    case "Qwen":
        return ai.callOpenAIChatCompatible(prompt, req, os.Getenv("QWEN_API_KEY"), os.Getenv("QWEN_BASE_URL"), req.Model)
    case "Stability AI":
        return ai.callStabilityAI(prompt, req)
    case "OpenAI":
        return ai.callOpenAI(prompt, req)
    case "Midjourney":
        return ai.callMidjourney(prompt, req)
    default:
        return ai.callGenericAI(prompt, req)
    }
}

// callOpenAIChatCompatible 统一的聊天文本生成（OpenAI 兼容协议）
func (ai *AIEngine) callOpenAIChatCompatible(prompt string, req GenerationRequest, apiKey, baseURL, modelID string) (*GenerationResponse, error) {
    if ai.IsMockMode() || apiKey == "" || baseURL == "" {
        // 回退到 Mock 文本生成
        return ai.callAIAPIMock(AIModel{Name: modelID, Provider: "OpenAI-Compatible", Accuracy: 0.9, Temperature: 0.7}, prompt, req)
    }

    body := map[string]interface{}{
        "model":   modelID,
        "messages": []map[string]interface{}{{"role": "user", "content": prompt}},
        "temperature": 0.7,
    }
    jsonData, err := json.Marshal(body)
    if err != nil { return nil, fmt.Errorf("marshal request failed: %w", err) }

    url := baseURL
    if !strings.HasSuffix(url, "/") { url += "/" }
    url += "chat/completions"

    httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil { return nil, fmt.Errorf("create request failed: %w", err) }
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Authorization", "Bearer "+apiKey)

    resp, err := ai.client.Do(httpReq)
    if err != nil { return nil, fmt.Errorf("call API failed: %w", err) }
    defer resp.Body.Close()
    if resp.StatusCode != http.StatusOK {
        b, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(b))
    }

    var r struct {
        Choices []struct{ Message struct{ Content string `json:"content"` } `json:"message"` } `json:"choices"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&r); err != nil { return nil, fmt.Errorf("decode failed: %w", err) }
    content := ""
    if len(r.Choices) > 0 { content = r.Choices[0].Message.Content }

    return &GenerationResponse{
        Content:    content,
        Confidence: 0.9,
        Metadata: map[string]interface{}{
            "provider": "OpenAI-Compatible",
            "model":    modelID,
            "timestamp": time.Now().Unix(),
        },
    }, nil
}

func contains(arr []string, t string) bool {
    for _, v := range arr { if v == t { return true } }
    return false
}

// callAIAPIMock Mock模式的AI调用（用于Demo演示）
func (ai *AIEngine) callAIAPIMock(model AIModel, prompt string, req GenerationRequest) (*GenerationResponse, error) {
	// 模拟处理时间（根据复杂度）
	processingTime := time.Duration(req.Complexity*10+req.Iterations*50) * time.Millisecond
	time.Sleep(processingTime)

	// 生成Mock响应内容
	content := fmt.Sprintf("[Demo模式] 使用%s生成的%s风格作品。\n提示词: %s\n\n这是演示数据，实际使用时会调用真实AI API。配置API Key后即可使用真实AI生成功能。",
		model.Name, req.Style, prompt)

	// 使用随机图片服务作为示例（picsum提供免费占位图）
	mockImageURL := fmt.Sprintf("https://picsum.photos/1024/1024?random=%d", time.Now().Unix())

	// 如果是文本模型，不返回图片URL
	if model.Provider == "智谱AI" && model.Name != "智谱CogView-4" {
		mockImageURL = ""
	}

	return &GenerationResponse{
		Content:        content,
		ImageURL:       mockImageURL,
		Confidence:     0.88 + float64(req.Complexity)/1000, // 模拟置信度
		ProcessingTime: processingTime,
		Metadata: map[string]interface{}{
			"model":      model.Name,
			"provider":   model.Provider,
			"mode":       "DEMO_MOCK",
			"iterations": req.Iterations,
			"complexity": req.Complexity,
			"creativity": req.Creativity,
			"timestamp":  time.Now().Unix(),
			"notice":     "这是演示模式，配置API Key后可使用真实AI服务",
		},
	}, nil
}

// callOpenAI 调用OpenAI API
func (ai *AIEngine) callOpenAI(prompt string, req GenerationRequest) (*GenerationResponse, error) {
	// OpenAI DALL-E API调用
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		apiKey = ai.apiKey
	}

	baseURL := os.Getenv("OPENAI_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}

	requestBody := map[string]interface{}{
		"model":   "dall-e-3",
		"prompt":  prompt,
		"n":       1,
		"size":    "1024x1024",
		"quality": "standard",
		"style":   "vivid",
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", baseURL+"/images/generations", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error %d: %s", resp.StatusCode, string(body))
	}

	var openAIResp struct {
		Data []struct {
			URL string `json:"url"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, fmt.Errorf("failed to decode OpenAI response: %w", err)
	}

	if len(openAIResp.Data) == 0 {
		return nil, fmt.Errorf("no image generated")
	}

	return &GenerationResponse{
		Content:    fmt.Sprintf("Generated %s artwork: %s", req.Style, prompt),
		ImageURL:   openAIResp.Data[0].URL,
		Confidence: 0.95,
		Metadata: map[string]interface{}{
			"model":      "DALL-E 3",
			"provider":   "OpenAI",
			"iterations": req.Iterations,
			"timestamp":  time.Now().Unix(),
		},
	}, nil
}

// callZhipuAI 调用智谱AI API - 支持GLM-4.6等模型
func (ai *AIEngine) callZhipuAI(prompt string, req GenerationRequest, model AIModel) (*GenerationResponse, error) {
	apiKey := os.Getenv("ZHIPU_API_KEY")
	if apiKey == "" {
		apiKey = ai.apiKey
	}
	if apiKey == "" {
		return nil, fmt.Errorf("ZHIPU_API_KEY not configured")
	}

	baseURL := os.Getenv("ZHIPU_BASE_URL")
	if baseURL == "" {
		baseURL = "https://open.bigmodel.cn/api/paas/v4"
	}

	// 判断是否为图像生成模型
	if model.Name == "智谱CogView-4" {
		return ai.callCogView(prompt, req, apiKey, baseURL)
	}

	// 文本/多模态生成请求
	requestBody := map[string]interface{}{
		"model": ai.getZhipuModelID(model.Name),
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": model.Temperature,
		"top_p":       0.95,
		"max_tokens":  4096,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var zhipuResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			TotalTokens      int `json:"total_tokens"`
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
		} `json:"usage"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&zhipuResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(zhipuResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from API")
	}

	content := zhipuResp.Choices[0].Message.Content

	return &GenerationResponse{
		Content:    content,
		ImageURL:   "",
		Confidence: model.Accuracy,
		Metadata: map[string]interface{}{
			"model":             model.Name,
			"provider":          "智谱AI",
			"tokens_used":       zhipuResp.Usage.TotalTokens,
			"prompt_tokens":     zhipuResp.Usage.PromptTokens,
			"completion_tokens": zhipuResp.Usage.CompletionTokens,
			"iterations":        req.Iterations,
			"timestamp":         time.Now().Unix(),
			"国产大模型":             true,
		},
	}, nil
}

// callCogView 调用CogView图像生成API
func (ai *AIEngine) callCogView(prompt string, req GenerationRequest, apiKey, baseURL string) (*GenerationResponse, error) {
	requestBody := map[string]interface{}{
		"model":  "cogview-4",
		"prompt": prompt,
		"size":   "1024x1024",
		"n":      1,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", baseURL+"/images/generations", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var imageResp struct {
		Data []struct {
			URL string `json:"url"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&imageResp); err != nil {
		return nil, fmt.Errorf("failed to decode image response: %w", err)
	}

	if len(imageResp.Data) == 0 {
		return nil, fmt.Errorf("no image generated")
	}

	return &GenerationResponse{
		Content:    fmt.Sprintf("Generated %s style artwork using CogView-4", req.Style),
		ImageURL:   imageResp.Data[0].URL,
		Confidence: 0.93,
		Metadata: map[string]interface{}{
			"model":     "CogView-4",
			"provider":  "智谱AI",
			"style":     req.Style,
			"timestamp": time.Now().Unix(),
			"国产AI图像生成":  true,
		},
	}, nil
}

// getZhipuModelID 获取智谱AI的模型ID
func (ai *AIEngine) getZhipuModelID(modelName string) string {
	modelMap := map[string]string{
		"智谱GLM-4.6":     "glm-4-plus", // 使用最新Plus版本
		"智谱GLM-4-Air":   "glm-4-air",
		"智谱GLM-4V-Plus": "glm-4v-plus",
		"智谱CogView-4":   "cogview-4",
	}

	if id, ok := modelMap[modelName]; ok {
		return id
	}
	return "glm-4-plus" // 默认使用最强版本
}

// callStabilityAI 调用Stability AI API
func (ai *AIEngine) callStabilityAI(prompt string, req GenerationRequest) (*GenerationResponse, error) {
	apiKey := os.Getenv("STABILITY_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("STABILITY_API_KEY not configured")
	}

	baseURL := os.Getenv("STABILITY_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.stability.ai/v1"
	}

	requestBody := map[string]interface{}{
		"text_prompts": []map[string]interface{}{
			{
				"text":   prompt,
				"weight": 1.0,
			},
		},
		"cfg_scale": 7,
		"height":    1024,
		"width":     1024,
		"samples":   1,
		"steps":     30,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", baseURL+"/generation/stable-diffusion-xl-1024-v1-0/text-to-image", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call Stability AI API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Stability AI API error %d: %s", resp.StatusCode, string(body))
	}

	var stabilityResp struct {
		Artifacts []struct {
			Base64 string `json:"base64"`
		} `json:"artifacts"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&stabilityResp); err != nil {
		return nil, fmt.Errorf("failed to decode Stability AI response: %w", err)
	}

	if len(stabilityResp.Artifacts) == 0 {
		return nil, fmt.Errorf("no image generated")
	}

	// 将base64转换为URL（这里简化处理）
	imageURL := fmt.Sprintf("data:image/png;base64,%s", stabilityResp.Artifacts[0].Base64)

	return &GenerationResponse{
		Content:    fmt.Sprintf("Generated %s artwork: %s", req.Style, prompt),
		ImageURL:   imageURL,
		Confidence: 0.92,
		Metadata: map[string]interface{}{
			"model":      "Stable Diffusion XL",
			"provider":   "Stability AI",
			"iterations": req.Iterations,
			"timestamp":  time.Now().Unix(),
		},
	}, nil
}

// callMidjourney 调用Midjourney API（模拟）
func (ai *AIEngine) callMidjourney(prompt string, req GenerationRequest) (*GenerationResponse, error) {
	// Midjourney API通常需要特殊的集成方式
	// 这里提供模拟实现
	time.Sleep(time.Duration(req.Iterations) * 200 * time.Millisecond)

	return &GenerationResponse{
		Content:    fmt.Sprintf("Generated %s artwork: %s", req.Style, prompt),
		ImageURL:   fmt.Sprintf("https://cdn.midjourney.com/generated/%d.jpg", time.Now().Unix()),
		Confidence: 0.94,
		Metadata: map[string]interface{}{
			"model":      "Midjourney v6",
			"provider":   "Midjourney",
			"iterations": req.Iterations,
			"timestamp":  time.Now().Unix(),
		},
	}, nil
}

// callGenericAI 调用通用AI API
func (ai *AIEngine) callGenericAI(prompt string, req GenerationRequest) (*GenerationResponse, error) {
	// 通用AI API调用
	requestBody := map[string]interface{}{
		"prompt":     prompt,
		"style":      req.Style,
		"complexity": req.Complexity,
		"creativity": req.Creativity,
		"iterations": req.Iterations,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", ai.baseURL+"/generate", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+ai.apiKey)

	resp, err := ai.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call AI API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI API error %d: %s", resp.StatusCode, string(body))
	}

	var aiResp struct {
		Content  string  `json:"content"`
		ImageURL string  `json:"image_url"`
		Score    float64 `json:"score"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return nil, fmt.Errorf("failed to decode AI response: %w", err)
	}

	return &GenerationResponse{
		Content:    aiResp.Content,
		ImageURL:   aiResp.ImageURL,
		Confidence: aiResp.Score,
		Metadata: map[string]interface{}{
			"model":      "CreativeAI Pro",
			"provider":   "Custom",
			"iterations": req.Iterations,
			"timestamp":  time.Now().Unix(),
		},
	}, nil
}

// analyzeContribution 分析创作贡献度
func (ai *AIEngine) analyzeContribution(req GenerationRequest, response *GenerationResponse) ContributionAnalysis {
	// 计算提示词复杂度
	promptComplexity := ai.calculatePromptComplexity(req.Prompt)

	// 计算参数优化难度
	parameterOptimization := ai.calculateParameterOptimization(req.Parameters)

	// 计算模型难度
	modelDifficulty := ai.calculateModelDifficulty(req.Model)

	// 计算原创性因子
	originalityFactor := ai.calculateOriginalityFactor(req.Prompt, req.Style)

	// 计算总体评分
	overallScore := float64(promptComplexity)*0.3 +
		float64(parameterOptimization)*0.25 +
		float64(req.Iterations)*0.2 +
		float64(modelDifficulty)*0.15 +
		float64(originalityFactor)*0.1

	return ContributionAnalysis{
		PromptComplexity:      promptComplexity,
		ParameterOptimization: parameterOptimization,
		ModelDifficulty:       modelDifficulty,
		OriginalityFactor:     originalityFactor,
		IterationCount:        req.Iterations,
		OverallScore:          overallScore,
	}
}

// calculatePromptComplexity 计算提示词复杂度
func (ai *AIEngine) calculatePromptComplexity(prompt string) int {
	// 基于提示词长度、关键词数量、复杂度等计算
	length := len(prompt)
	words := len(bytes.Fields([]byte(prompt)))

	// 复杂度评分 (0-100)
	complexity := (length/10 + words/2) % 100
	if complexity > 100 {
		complexity = 100
	}
	return complexity
}

// calculateParameterOptimization 计算参数优化难度
func (ai *AIEngine) calculateParameterOptimization(params map[string]interface{}) int {
	// 基于参数数量和复杂度计算
	paramCount := len(params)
	return (paramCount * 10) % 100
}

// calculateModelDifficulty 计算模型难度
func (ai *AIEngine) calculateModelDifficulty(model string) int {
	// 基于模型类型计算难度
	switch model {
	case "dall-e-3":
		return 95
	case "midjourney":
		return 90
	case "stable-diffusion":
		return 85
	default:
		return 70
	}
}

// calculateOriginalityFactor 计算原创性因子
func (ai *AIEngine) calculateOriginalityFactor(prompt, style string) int {
	// 基于提示词和风格的独特性计算
	// 这里使用简化的算法
	return (len(prompt) + len(style)) % 100
}

// generateID 生成唯一ID
func generateID() string {
	return fmt.Sprintf("ai_gen_%d", time.Now().UnixNano())
}

// GetAvailableModels 获取可用模型列表
func (ai *AIEngine) GetAvailableModels() map[string]AIModel {
	return ai.models
}

// GetModelInfo 获取模型信息
func (ai *AIEngine) GetModelInfo(modelName string) (AIModel, error) {
	model, exists := ai.models[modelName]
	if !exists {
		return AIModel{}, fmt.Errorf("model %s not found", modelName)
	}
	return model, nil
}
