package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// 测试智谱AI API集成
// 使用方法: go run scripts/test_zhipu_api.go

func main() {
	fmt.Println("🚀 智谱AI API 集成测试")
	fmt.Println("=" + string(make([]byte, 50)) + "=")

	// 从环境变量获取API Key
	apiKey := os.Getenv("ZHIPU_API_KEY")
	if apiKey == "" {
		fmt.Println("⚠️  未配置ZHIPU_API_KEY环境变量")
		fmt.Println("📝 请执行: set ZHIPU_API_KEY=your_api_key")
		fmt.Println()
		fmt.Println("💡 如果没有API Key，可以:")
		fmt.Println("   1. 访问 https://open.bigmodel.cn 注册账号")
		fmt.Println("   2. 创建API Key (新用户有免费额度)")
		fmt.Println()
		fmt.Println("🎭 继续使用Mock模式测试...")
		testMockMode()
		return
	}

	fmt.Printf("✅ API Key已配置: %s...%s\n", apiKey[:8], apiKey[len(apiKey)-4:])
	fmt.Println()

	// 测试场景1: GLM-4文本生成
	fmt.Println("📋 测试场景1: GLM-4文本生成")
	testGLM4TextGeneration(apiKey)
	fmt.Println()

	// 测试场景2: GLM-4-Air快速响应
	fmt.Println("📋 测试场景2: GLM-4-Air快速响应")
	testGLM4Air(apiKey)
	fmt.Println()

	// 测试场景3: 版权声明生成
	fmt.Println("📋 测试场景3: AI版权声明生成")
	testCopyrightGeneration(apiKey)
	fmt.Println()

	fmt.Println("✅ 所有测试完成!")
}

// testGLM4TextGeneration 测试GLM-4文本生成
func testGLM4TextGeneration(apiKey string) {
	prompt := "请用50字介绍区块链技术在数字版权保护中的应用"

	startTime := time.Now()
	response, err := callZhipuAPI(apiKey, "glm-4-plus", prompt)
	duration := time.Since(startTime)

	if err != nil {
		fmt.Printf("❌ 错误: %v\n", err)
		return
	}

	fmt.Printf("✅ 响应成功 (耗时: %v)\n", duration)
	fmt.Printf("📝 提示词: %s\n", prompt)
	fmt.Printf("💬 回复: %s\n", response.Choices[0].Message.Content)
	fmt.Printf("📊 Token使用: %d (提示: %d, 生成: %d)\n",
		response.Usage.TotalTokens,
		response.Usage.PromptTokens,
		response.Usage.CompletionTokens)
}

// testGLM4Air 测试GLM-4-Air
func testGLM4Air(apiKey string) {
	prompt := "用一句话描述CreatorChain项目"

	startTime := time.Now()
	response, err := callZhipuAPI(apiKey, "glm-4-air", prompt)
	duration := time.Since(startTime)

	if err != nil {
		fmt.Printf("❌ 错误: %v\n", err)
		return
	}

	fmt.Printf("✅ 响应成功 (耗时: %v)\n", duration)
	fmt.Printf("💬 回复: %s\n", response.Choices[0].Message.Content)
	fmt.Printf("⚡ Air模型特点: 快速、高性价比\n")
}

// testCopyrightGeneration 测试版权声明生成
func testCopyrightGeneration(apiKey string) {
	prompt := `为一个使用GLM-4生成的数字艺术作品编写版权声明。
作品信息:
- 标题: 赛博朋克城市夜景
- 创作者: 用户Alice
- AI模型: GLM-4.6
- 创作时间: 2025-10-31
- 提示词复杂度: 85/100
- 贡献度评分: 750/1000

要求: 简洁、专业、强调人类创作者的贡献`

	response, err := callZhipuAPI(apiKey, "glm-4-plus", prompt)
	if err != nil {
		fmt.Printf("❌ 错误: %v\n", err)
		return
	}

	fmt.Printf("✅ 版权声明生成成功\n")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println(response.Choices[0].Message.Content)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

// testMockMode 测试Mock模式
func testMockMode() {
	fmt.Println()
	fmt.Println("🎭 Mock模式演示")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	scenarios := []struct {
		model  string
		prompt string
	}{
		{"GLM-4.6", "区块链+AI确权方案"},
		{"GLM-4-Air", "快速生成版权声明"},
		{"CogView-4", "生成赛博朋克风格图像"},
	}

	for i, scenario := range scenarios {
		fmt.Printf("\n场景%d: 使用%s\n", i+1, scenario.model)
		fmt.Printf("提示词: %s\n", scenario.prompt)

		// 模拟处理
		time.Sleep(500 * time.Millisecond)

		fmt.Printf("✅ [Mock] 生成成功\n")
		fmt.Printf("💬 内容: 这是%s模型的演示响应\n", scenario.model)
		fmt.Printf("📊 元数据: {mode: \"demo\", timestamp: %d}\n", time.Now().Unix())
	}

	fmt.Println()
	fmt.Println("💡 提示: 配置API Key后可使用真实AI服务")
}

// ZhipuResponse 智谱API响应结构
type ZhipuResponse struct {
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
	Error *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error"`
}

// callZhipuAPI 调用智谱AI API
func callZhipuAPI(apiKey, model, prompt string) (*ZhipuResponse, error) {
	baseURL := "https://open.bigmodel.cn/api/paas/v4"

	requestBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]interface{}{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.7,
		"top_p":       0.95,
		"max_tokens":  2048,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequest("POST", baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	var zhipuResp ZhipuResponse
	if err := json.Unmarshal(body, &zhipuResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w\n原始响应: %s", err, string(body))
	}

	if resp.StatusCode != http.StatusOK {
		if zhipuResp.Error != nil {
			return nil, fmt.Errorf("API错误 (HTTP %d): %s [%s]",
				resp.StatusCode, zhipuResp.Error.Message, zhipuResp.Error.Code)
		}
		return nil, fmt.Errorf("API错误 (HTTP %d): %s", resp.StatusCode, string(body))
	}

	if len(zhipuResp.Choices) == 0 {
		return nil, fmt.Errorf("API返回空响应")
	}

	zhipuResp.Choices[0].Message.Content = zhipuResp.Choices[0].Message.Content
	return &zhipuResp, nil
}
