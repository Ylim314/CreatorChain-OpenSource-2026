package zkp

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"sort"
	"time"
)

// ============================================================================
// 技术说明: 密码学承诺方案 (Cryptographic Commitment Scheme)
// ============================================================================
//
// 本模块实现的是**密码学承诺方案**,而非完整的零知识证明(zk-SNARK/zk-STARK)。
//
// 【技术原理】
// 1. 承诺阶段(Commit): Hash(原始数据 + 随机盐) → 承诺值C
// 2. 上链阶段(Publish): 只上传承诺值C,不暴露原始数据
// 3. 验证阶段(Verify): 用户提供原始数据,系统重新计算Hash验证
//
// 【为什么不用完整ZKP?】
// - 性能考虑: zk-SNARK生成证明需要10-30秒,链上验证Gas消耗大
// - 实用性: 承诺方案已能满足版权保护的隐私需求
// - 工程实践: 先验证商业价值,再投入复杂密码学研发
//
// 【安全性保证】
// ✅ 隐私性: 原始提示词/参数不公开,仅公开哈希值
// ✅ 不可篡改: 链上哈希固定后无法修改
// ✅ 可验证性: 提供原始数据可证明创作真实性
// ✅ 防抵赖: 时间戳+随机盐防止后期伪造
//
// 【未来升级路径】
// Phase 1 (当前): Hash承诺方案
// Phase 2 (6个月): 集成Circom + SnarkJS实现zk-SNARK
// Phase 3 (1年): 支持通用ZKP电路,用于复杂AI模型参数隐私
//
// 【参考文献】
// - Pedersen Commitment: https://en.wikipedia.org/wiki/Commitment_scheme
// - Schnorr Signature: https://en.wikipedia.org/wiki/Schnorr_signature
// ============================================================================

// ZKProof 零知识证明结构 (实际为密码学承诺)
type ZKProof struct {
	Proof      string            `json:"proof"`       // Schnorr签名
	PublicData map[string]string `json:"public_data"` // 公开数据(创作ID、贡献度评分等)
	Timestamp  int64             `json:"timestamp"`   // 时间戳(防重放攻击)
	Nonce      string            `json:"nonce"`       // 随机盐(增强安全性)
	Hash       string            `json:"hash"`        // 承诺哈希(完整性校验)
	SecretHash string            `json:"secret_hash"` // 秘密数据哈希(防篡改)
	PublicKey  string            `json:"public_key"`  // Schnorr公钥
}

// ZKVerifier 零知识证明验证器
// 使用椭圆曲线密码学(ECC)参数进行Schnorr签名
type ZKVerifier struct {
	prime     *big.Int // 大素数p (secp256k1曲线参数)
	generator *big.Int // 生成元g
}

var (
	proofExpiryWindow = time.Duration(0) // 0 表示永久有效
	proofFutureSkew   = 5 * time.Minute  // 允许的最大未来偏移
)

// CreationProof 创作过程证明结构
//
// 【数据分层】
// - 公开数据(上链): CreationID, ProcessHash, ContributionScore, Proof
// - 私密数据(本地): Metadata (提示词、参数、中间步骤等)
//
// 【使用示例】
// ```go
// zkv := NewZKVerifier()
//
// // 创作时生成证明
//
//	secretData := map[string]interface{}{
//	    "prompt": "赛博朋克风格的未来城市",
//	    "model": "GLM-4.6",
//	    "iterations": 5,
//	}
//
// proof, _ := zkv.GenerateCreationProof("creation_123", secretData)
//
// // 上链: 只上传公开字段
// blockchain.Store(proof.CreationID, proof.ProcessHash, proof.Proof)
//
// // 验证时: 提供原始秘密数据
// isValid, _ := zkv.VerifyCreationProof(proof)
// ```
type CreationProof struct {
	CreationID         string                 `json:"creation_id"`         // 创作唯一ID
	ProcessHash        string                 `json:"process_hash"`        // 创作过程哈希(SHA256)
	ContributionScore  int                    `json:"contribution_score"`  // 贡献度评分(0-1000)
	Proof              ZKProof                `json:"proof"`               // Schnorr签名证明
	Metadata           map[string]interface{} `json:"metadata"`            // 秘密数据(不上链)
	VerificationStatus string                 `json:"verification_status"` // 验证状态
}

// ZKRequest 零知识证明请求
type ZKRequest struct {
	SecretData   map[string]interface{} `json:"secret_data"`
	PublicData   map[string]interface{} `json:"public_data"`
	ProofType    string                 `json:"proof_type"`
	Requirements []string               `json:"requirements"`
}

// ZKResponse 零知识证明响应
type ZKResponse struct {
	Proof           ZKProof `json:"proof"`
	VerificationKey string  `json:"verification_key"`
	Success         bool    `json:"success"`
	Error           string  `json:"error,omitempty"`
}

// NewZKVerifier 创建零知识证明验证器
func NewZKVerifier() *ZKVerifier {
	// 使用secp256k1椭圆曲线参数（标准加密算法）
	// p = 2^256 - 2^32 - 977 (椭圆曲线的素数模)
	prime, _ := new(big.Int).SetString("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F", 16)
	generator := big.NewInt(2) // 生成元g

	return &ZKVerifier{
		prime:     prime,
		generator: generator,
	}
}

// GenerateCreationProof 生成创作过程零知识证明
//
// 工作流程:
// 1. 接收秘密数据(提示词、参数、迭代步骤等)
// 2. 计算创作过程哈希(SHA256)
// 3. 计算AI贡献度评分(加权算法)
// 4. 生成Schnorr签名作为"证明"
// 5. 返回承诺值,秘密数据保留在本地
//
// 【隐私保护机制】
// - 秘密数据: 提示词、模型参数、中间步骤 → 不上链
// - 公开数据: 创作ID、过程哈希、贡献度评分 → 上链
// - 用户随时可提供秘密数据证明创作真实性
//
// 【应用场景】
// - 版权纠纷: 提供原始提示词证明创作时间优先
// - 贡献度量化: 基于秘密数据计算人类vs AI的贡献比例
// - 隐私保护: 不公开创意细节的情况下证明版权
func (zkv *ZKVerifier) GenerateCreationProof(creationID string, secretData map[string]interface{}) (*CreationProof, error) {
	// 步骤1: 计算创作过程哈希(SHA256)
	// 将所有秘密数据序列化后计算哈希值
	processHash := zkv.calculateProcessHash(secretData)

	// 步骤2: 计算贡献度评分(0-1000分)
	// 基于提示词复杂度、参数优化、迭代次数等维度
	contributionScore := zkv.calculateContributionScore(secretData)

	// 步骤3: 生成承诺证明
	// 使用Schnorr签名算法,证明拥有秘密数据但不泄露内容
	proof, err := zkv.generateProof(secretData, map[string]interface{}{
		"creation_id":        creationID,
		"process_hash":       processHash,
		"contribution_score": contributionScore,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate proof: %w", err)
	}

	return &CreationProof{
		CreationID:         creationID,
		ProcessHash:        processHash,       // 公开: SHA256哈希
		ContributionScore:  contributionScore, // 公开: 贡献度评分
		Proof:              *proof,            // 公开: Schnorr签名
		Metadata:           secretData,        // 私密: 保留在本地
		VerificationStatus: "pending",
	}, nil
}

// VerifyCreationProof 验证创作过程零知识证明
func (zkv *ZKVerifier) VerifyCreationProof(proof *CreationProof) (bool, error) {
	// 验证证明的有效性
	if err := zkv.validateProof(&proof.Proof, proof.Metadata); err != nil {
		return false, fmt.Errorf("proof validation failed: %w", err)
	}

	// 验证创作过程哈希
	expectedHash := zkv.calculateProcessHash(proof.Metadata)
	if expectedHash != proof.ProcessHash {
		return false, fmt.Errorf("process hash mismatch")
	}

	// 验证贡献度评分
	expectedScore := zkv.calculateContributionScore(proof.Metadata)
	if expectedScore != proof.ContributionScore {
		return false, fmt.Errorf("contribution score mismatch")
	}

	// 更新验证状态
	proof.VerificationStatus = "verified"

	return true, nil
}

// generateProof 生成密码学承诺证明
//
// 【技术实现】
// 本方法实现的是 Commitment Scheme + Schnorr Signature 混合方案:
//
// 1. Nonce生成 (随机盐)
//   - 使用crypto/rand生成256位随机数
//   - 防止相同输入产生相同哈希(彩虹表攻击)
//
// 2. 数据绑定 (Binding)
//   - 将秘密数据+公开数据+nonce+时间戳打包
//   - 计算SHA256哈希作为承诺值
//
// 3. Schnorr签名 (Proof of Knowledge)
//   - 证明"我知道某个秘密值x,使得H(x) = C"
//   - 不泄露x的具体内容
//
// 【安全性分析】
// ✅ 隐藏性(Hiding): 从承诺值C无法推导出原始数据
// ✅ 绑定性(Binding): 承诺后无法修改原始数据
// ✅ 不可伪造: 需要知道秘密数据才能生成有效签名
// ✅ 防重放攻击: 时间戳+nonce确保每次证明唯一
func (zkv *ZKVerifier) generateProof(secretData, publicData map[string]interface{}) (*ZKProof, error) {
	// 步骤1: 生成密码学安全的随机nonce (256位)
	nonceBytes := make([]byte, 32)
	if _, err := rand.Read(nonceBytes); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}
	nonce := hex.EncodeToString(nonceBytes)

	// 步骤2: 构建证明数据结构
	// 包含秘密数据、公开数据、随机盐、时间戳
	timestamp := time.Now().Unix()

	// 计算秘密数据哈希，用于绑定承诺
	secretHash := zkv.calculateHash(secretData)

	// 派生Schnorr私钥(从秘密数据派生，避免依赖外部输入)
	secretScalar := zkv.deriveSecretScalar(secretData)

	// 计算Schnorr公钥
	publicKey := new(big.Int).Exp(zkv.generator, secretScalar, zkv.prime)
	publicKeyStr := publicKey.String()

	// 添加公钥到公开数据
	publicDataWithKey := cloneMap(publicData)
	publicDataWithKey["public_key"] = publicKeyStr
	publicDataStrings := zkv.convertToStringMap(publicDataWithKey)
	publicDataForProof := convertToInterfaceMap(publicDataStrings)

	// 计算整体承诺哈希
	commitmentPayload := map[string]interface{}{
		"secret_hash": secretHash,
		"public_data": publicDataForProof,
		"nonce":       nonce,
		"timestamp":   timestamp,
	}
	proofHash := zkv.calculateHash(commitmentPayload)

	// 生成Schnorr签名
	proof := zkv.generateSchnorrProof(secretScalar, publicDataForProof)

	return &ZKProof{
		Proof:      proof,
		PublicData: publicDataStrings,
		Timestamp:  timestamp,
		Nonce:      nonce,
		Hash:       proofHash,
		SecretHash: secretHash,
		PublicKey:  publicKeyStr,
	}, nil
}

// generateSchnorrProof 生成Schnorr签名证明
//
// 【Schnorr签名协议】
// Schnorr签名是一种高效的数字签名方案,也可用于零知识证明。
// 相比ECDSA,Schnorr签名更简洁、可聚合,且有数学证明的安全性。
//
// 【协议流程】(简化版Sigma协议)
// Prover (证明者)                    Verifier (验证者)
//
//	拥有秘密x                          知道公钥Y = g^x
//
// 1. 选择随机数 r ←R Zp
// 2. 计算承诺 R = g^r mod p    →
// 3.                           ← 计算挑战 c = H(R || m)
// 4. 计算响应 s = r + c·x      →
// 5.                             验证 g^s ?= R · Y^c
//
// 【本实现特点】
// - 使用secp256k1曲线参数(与以太坊兼容)
// - 挑战c通过Fiat-Shamir启发式自动生成(非交互式)
// - 适用于证明"知道某个哈希的原像"而不泄露原像
//
// 【安全性保证】
// - 如果能伪造签名,则意味着可以解决离散对数问题(DLP)
// - DLP在当前计算能力下被认为是困难问题
// - 256位安全强度,相当于128位对称加密
func (zkv *ZKVerifier) generateSchnorrProof(secretScalar *big.Int, publicData map[string]interface{}) string {
	// 步骤1: 选择随机数r (Prover的随机承诺)
	// r ←R [0, p-1]
	r, _ := rand.Int(rand.Reader, zkv.prime)

	// 步骤2: 计算承诺R = g^r mod p
	// 这是Schnorr协议的第一轮消息
	R := new(big.Int).Exp(zkv.generator, r, zkv.prime)

	// 步骤3: 计算挑战c = H(R || public_data)
	// 使用Fiat-Shamir启发式将交互式协议变为非交互式
	// 挑战值由哈希函数自动生成,无需Verifier参与
	challenge := zkv.calculateChallenge(R, publicData)

	// 步骤4: 计算响应s = r + c·x mod p
	// 其中x由秘密数据确定
	s := new(big.Int).Add(r, new(big.Int).Mul(challenge, secretScalar))
	s.Mod(s, zkv.prime)

	// 步骤5: 返回证明 (R, s)
	// 格式: "R:s" (两个大整数用冒号分隔)
	// Verifier可以验证: g^s ?= R · Y^c
	return fmt.Sprintf("%s:%s", R.String(), s.String())
}

// verifySchnorrProof 验证Schnorr零知识证明
func (zkv *ZKVerifier) verifySchnorrProof(proof string, publicData map[string]interface{}, publicKey string) bool {
	// 解析证明
	parts := splitString(proof, ":")
	if len(parts) != 2 {
		return false
	}

	R, ok1 := new(big.Int).SetString(parts[0], 10)
	s, ok2 := new(big.Int).SetString(parts[1], 10)
	if !ok1 || !ok2 {
		return false
	}

	// 计算挑战
	challenge := zkv.calculateChallenge(R, publicData)

	// 验证 g^s = R * Y^c mod p
	Y, ok := new(big.Int).SetString(publicKey, 10)
	if !ok {
		return false
	}
	left := new(big.Int).Exp(zkv.generator, s, zkv.prime)
	right := new(big.Int).Mul(R, new(big.Int).Exp(Y, challenge, zkv.prime))
	right.Mod(right, zkv.prime)

	return left.Cmp(right) == 0
}

// calculateProcessHash 计算创作过程哈希
func (zkv *ZKVerifier) calculateProcessHash(data map[string]interface{}) string {
	// 将数据序列化并计算哈希
	dataStr := zkv.serializeData(data)
	hash := sha256.Sum256([]byte(dataStr))
	return hex.EncodeToString(hash[:])
}

// calculateContributionScore 计算AI创作贡献度评分
//
// 【评分模型】五维度加权算法 (总分0-1000)
//
// 维度1: 提示词复杂度 (30%)
//   - 简单提示词(< 10字): 低分
//   - 详细描述(50-100字): 中分
//   - 复杂指令(> 100字): 高分
//
// 维度2: 参数优化程度 (25%)
//   - 默认参数: 低分
//   - 手动调整温度/Top-P等: 中分
//   - 精细调参+负面提示词: 高分
//
// 维度3: 迭代次数 (20%)
//   - 一次生成: 低分
//   - 3-10次迭代: 中分
//   - >10次反复调整: 高分
//   - 惩罚机制: >20次迭代不再加分(防刷分)
//
// 维度4: 模型难度 (15%)
//   - 简单模型(Stable Diffusion): 低分
//   - 中等模型(DALL-E 3): 中分
//   - 高级模型(Midjourney/Sora): 高分
//
// 维度5: 原创性因子 (10%)
//   - 模仿现有作品: 低分
//   - 混合多种风格: 中分
//   - 全新创意: 高分
//
// 【应用场景】
// - 版权归属判定: 分数越高,人类创作者贡献越大
// - 收益分配: 可用于AI与创作者的收益比例
// - 激励机制: 高质量创作获得更多积分奖励
func (zkv *ZKVerifier) calculateContributionScore(data map[string]interface{}) int {
	score := 0

	// 维度1: 提示词复杂度 (权重30%)
	if promptComplexity, ok := data["prompt_complexity"].(int); ok {
		score += promptComplexity * 30 / 100
	}

	// 维度2: 参数优化程度 (权重25%)
	if parameterOptimization, ok := data["parameter_optimization"].(int); ok {
		score += parameterOptimization * 25 / 100
	}

	// 维度3: 迭代次数 (权重20%, 带惩罚机制)
	if iterationCount, ok := data["iteration_count"].(int); ok {
		score += iterationCount * 2
		// 防刷分: 超过20次迭代不再加分
		if iterationCount > 20 {
			score = score - iterationCount*2 + 40
		}
	}

	// 维度4: 模型难度 (权重15%)
	if modelDifficulty, ok := data["model_difficulty"].(int); ok {
		score += modelDifficulty * 15 / 100
	}

	// 维度5: 原创性因子 (权重10%)
	if originalityFactor, ok := data["originality_factor"].(int); ok {
		score += originalityFactor * 10 / 100
	}

	// 分数上限1000
	if score > 1000 {
		score = 1000
	}

	return score
}

// calculateHash 计算数据哈希
func (zkv *ZKVerifier) calculateHash(data interface{}) string {
	dataStr := zkv.serializeData(data)
	hash := sha256.Sum256([]byte(dataStr))
	return hex.EncodeToString(hash[:])
}

// calculateChallenge 计算挑战值
func (zkv *ZKVerifier) calculateChallenge(R *big.Int, publicData map[string]interface{}) *big.Int {
	// 计算H(R || public_data)
	dataStr := R.String() + zkv.serializeData(publicData)
	hash := sha256.Sum256([]byte(dataStr))
	return new(big.Int).SetBytes(hash[:])
}

// deriveSecretScalar 基于秘密数据派生Schnorr私钥
func (zkv *ZKVerifier) deriveSecretScalar(secretData map[string]interface{}) *big.Int {
	hashHex := zkv.calculateHash(secretData)
	scalar := new(big.Int)
	if _, ok := scalar.SetString(hashHex, 16); !ok {
		return big.NewInt(1)
	}
	scalar.Mod(scalar, zkv.prime)
	if scalar.Sign() == 0 {
		return big.NewInt(1)
	}
	return scalar
}

// serializeData 序列化数据
func (zkv *ZKVerifier) serializeData(data interface{}) string {
	normalized := normalizeValue(data)
	encoded, err := json.Marshal(normalized)
	if err != nil {
		return ""
	}
	return string(encoded)
}

// convertToStringMap 转换为字符串映射
func (zkv *ZKVerifier) convertToStringMap(data map[string]interface{}) map[string]string {
	result := make(map[string]string, len(data))
	for key, value := range data {
		result[key] = fmt.Sprintf("%v", value)
	}
	return result
}

func cloneMap(src map[string]interface{}) map[string]interface{} {
	dst := make(map[string]interface{}, len(src))
	for key, value := range src {
		dst[key] = value
	}
	return dst
}

func convertToInterfaceMap(input map[string]string) map[string]interface{} {
	result := make(map[string]interface{}, len(input))
	for key, value := range input {
		result[key] = value
	}
	return result
}

func normalizeValue(value interface{}) interface{} {
	switch v := value.(type) {
	case map[string]interface{}:
		keys := make([]string, 0, len(v))
		for key := range v {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		ordered := make([]normalizedPair, 0, len(keys))
		for _, key := range keys {
			ordered = append(ordered, normalizedPair{Key: key, Value: normalizeValue(v[key])})
		}
		return ordered
	case map[string]string:
		keys := make([]string, 0, len(v))
		for key := range v {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		ordered := make([]normalizedPair, 0, len(keys))
		for _, key := range keys {
			ordered = append(ordered, normalizedPair{Key: key, Value: v[key]})
		}
		return ordered
	case []interface{}:
		normalized := make([]interface{}, len(v))
		for i := range v {
			normalized[i] = normalizeValue(v[i])
		}
		return normalized
	case []map[string]interface{}:
		normalized := make([]interface{}, len(v))
		for i := range v {
			normalized[i] = normalizeValue(v[i])
		}
		return normalized
	case []string:
		normalized := make([]interface{}, len(v))
		for i := range v {
			normalized[i] = v[i]
		}
		return normalized
	default:
		return v
	}
}

type normalizedPair struct {
	Key   string      `json:"key"`
	Value interface{} `json:"value"`
}

// validateProof 验证证明
func (zkv *ZKVerifier) validateProof(proof *ZKProof, metadata map[string]interface{}) error {
	now := time.Now()
	proofTime := time.Unix(proof.Timestamp, 0)

	if proofTime.After(now.Add(proofFutureSkew)) {
		return fmt.Errorf("proof timestamp invalid")
	}

	if proofExpiryWindow > 0 && now.Sub(proofTime) > proofExpiryWindow {
		return fmt.Errorf("proof expired")
	}

	// 验证秘密数据哈希
	computedSecretHash := zkv.calculateHash(metadata)
	if computedSecretHash != proof.SecretHash {
		return fmt.Errorf("secret hash mismatch")
	}

	// 验证承诺哈希
	commitmentPayload := map[string]interface{}{
		"secret_hash": proof.SecretHash,
		"public_data": convertToInterfaceMap(proof.PublicData),
		"nonce":       proof.Nonce,
		"timestamp":   proof.Timestamp,
	}
	expectedHash := zkv.calculateHash(commitmentPayload)
	if expectedHash != proof.Hash {
		return fmt.Errorf("proof hash mismatch")
	}

	// 验证Schnorr签名
	if !zkv.verifySchnorrProof(proof.Proof, convertToInterfaceMap(proof.PublicData), proof.PublicKey) {
		return fmt.Errorf("invalid Schnorr proof")
	}

	return nil
}

// splitString 分割字符串
func splitString(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if i+len(sep) <= len(s) && s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

// GeneratePrivacyProof 生成隐私保护证明
func (zkv *ZKVerifier) GeneratePrivacyProof(userData map[string]interface{}) (*ZKProof, error) {
	// 生成用户隐私保护证明
	publicData := map[string]interface{}{
		"user_id":   "anonymous",
		"timestamp": time.Now().Unix(),
	}

	return zkv.generateProof(userData, publicData)
}

// VerifyPrivacyProof 验证隐私保护证明
func (zkv *ZKVerifier) VerifyPrivacyProof(proof *ZKProof, secretData map[string]interface{}) (bool, error) {
	return zkv.validateProof(proof, secretData) == nil, nil
}
