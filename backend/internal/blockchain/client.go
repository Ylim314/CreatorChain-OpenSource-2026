package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// BlockchainClient 区块链客户端 - 企业级实现
type BlockchainClient struct {
	client     *ethclient.Client
	privateKey *ecdsa.PrivateKey
	chainID    *big.Int
	gasPrice   *big.Int
	gasLimit   uint64
}

// ContractAddresses 合约地址配置
type ContractAddresses struct {
	CreatorChainRegistry string
	CreationMarketplace  string
	CreationRegistry     string
	CreatorDAO           string
	LicenseManager       string
	MultiLayerRights     string
	ProofOfCreation      string
}

// TransactionResult 交易结果
type TransactionResult struct {
	TxHash      string `json:"tx_hash"`
	BlockNumber uint64 `json:"block_number"`
	GasUsed     uint64 `json:"gas_used"`
	Status      string `json:"status"`
	Error       string `json:"error,omitempty"`
}

// EventLog 事件日志
type EventLog struct {
	TxHash       string                 `json:"tx_hash"`
	BlockNumber  uint64                 `json:"block_number"`
	EventType    string                 `json:"event_type"`
	ContractAddr string                 `json:"contract_address"`
	Data         map[string]interface{} `json:"data"`
	Timestamp    int64                  `json:"timestamp"`
}

// NewBlockchainClient 创建区块链客户端
func NewBlockchainClient(rpcURL string) (*BlockchainClient, error) {
	// 连接到以太坊节点
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %w", err)
	}

	// 获取链ID
	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get network ID: %w", err)
	}

	// 获取私钥
	privateKeyStr := os.Getenv("PRIVATE_KEY")
	if privateKeyStr == "" {
		return nil, fmt.Errorf("PRIVATE_KEY environment variable is required")
	}

	privateKey, err := crypto.HexToECDSA(strings.TrimPrefix(privateKeyStr, "0x"))
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	// 获取当前gas价格
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}

	return &BlockchainClient{
		client:     client,
		privateKey: privateKey,
		chainID:    chainID,
		gasPrice:   gasPrice,
		gasLimit:   300000, // 默认gas限制
	}, nil
}

// GetAccountAddress 获取账户地址
func (bc *BlockchainClient) GetAccountAddress() common.Address {
	return crypto.PubkeyToAddress(bc.privateKey.PublicKey)
}

// GetBalance 获取账户余额
func (bc *BlockchainClient) GetBalance(address common.Address) (*big.Int, error) {
	balance, err := bc.client.BalanceAt(context.Background(), address, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get balance: %w", err)
	}
	return balance, nil
}

// SendTransaction 发送交易
func (bc *BlockchainClient) SendTransaction(to common.Address, value *big.Int, data []byte) (*TransactionResult, error) {
	// 获取nonce
	nonce, err := bc.client.PendingNonceAt(context.Background(), bc.GetAccountAddress())
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	// 创建交易
	tx := types.NewTransaction(nonce, to, value, bc.gasLimit, bc.gasPrice, data)

	// 签名交易
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(bc.chainID), bc.privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %w", err)
	}

	// 发送交易
	err = bc.client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return nil, fmt.Errorf("failed to send transaction: %w", err)
	}

	// 等待交易确认
	receipt, err := bc.waitForTransactionReceipt(signedTx.Hash())
	if err != nil {
		return nil, fmt.Errorf("failed to wait for transaction receipt: %w", err)
	}

	return &TransactionResult{
		TxHash:      signedTx.Hash().Hex(),
		BlockNumber: receipt.BlockNumber.Uint64(),
		GasUsed:     receipt.GasUsed,
		Status:      "success",
	}, nil
}

// waitForTransactionReceipt 等待交易确认
func (bc *BlockchainClient) waitForTransactionReceipt(txHash common.Hash) (*types.Receipt, error) {
	// 等待最多5分钟
	timeout := time.After(5 * time.Minute)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			return nil, fmt.Errorf("transaction timeout")
		case <-ticker.C:
			receipt, err := bc.client.TransactionReceipt(context.Background(), txHash)
			if err == nil && receipt != nil {
				return receipt, nil
			}
		}
	}
}

// CallContract 调用合约方法（只读）
func (bc *BlockchainClient) CallContract(contractAddr common.Address, data []byte) ([]byte, error) {
	msg := ethereum.CallMsg{
		To:   &contractAddr,
		Data: data,
	}

	result, err := bc.client.CallContract(context.Background(), msg, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call contract: %w", err)
	}

	return result, nil
}

// GetTransactionReceipt 获取交易收据
func (bc *BlockchainClient) GetTransactionReceipt(txHash string) (*TransactionResult, error) {
	hash := common.HexToHash(txHash)
	receipt, err := bc.client.TransactionReceipt(context.Background(), hash)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction receipt: %w", err)
	}

	status := "failed"
	if receipt.Status == 1 {
		status = "success"
	}

	return &TransactionResult{
		TxHash:      txHash,
		BlockNumber: receipt.BlockNumber.Uint64(),
		GasUsed:     receipt.GasUsed,
		Status:      status,
	}, nil
}

// GetBlockNumber 获取当前区块号
func (bc *BlockchainClient) GetBlockNumber() (uint64, error) {
	blockNumber, err := bc.client.BlockNumber(context.Background())
	if err != nil {
		return 0, fmt.Errorf("failed to get block number: %w", err)
	}
	return blockNumber, nil
}

// GetBlock 获取区块信息
func (bc *BlockchainClient) GetBlock(blockNumber uint64) (*types.Block, error) {
	block, err := bc.client.BlockByNumber(context.Background(), big.NewInt(int64(blockNumber)))
	if err != nil {
		return nil, fmt.Errorf("failed to get block: %w", err)
	}
	return block, nil
}

// ListenToEvents 监听合约事件
func (bc *BlockchainClient) ListenToEvents(contractAddr common.Address, fromBlock uint64, eventChan chan<- EventLog) error {
	// 创建事件过滤器
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(fromBlock)),
		Addresses: []common.Address{contractAddr},
	}

	logs, err := bc.client.FilterLogs(context.Background(), query)
	if err != nil {
		return fmt.Errorf("failed to filter logs: %w", err)
	}

	// 处理事件日志
	for _, vLog := range logs {
		eventLog := EventLog{
			TxHash:       vLog.TxHash.Hex(),
			BlockNumber:  vLog.BlockNumber,
			EventType:    "Unknown",
			ContractAddr: vLog.Address.Hex(),
			Data:         make(map[string]interface{}),
			Timestamp:    time.Now().Unix(),
		}

		// 解析事件数据（这里简化处理）
		if len(vLog.Topics) > 0 {
			eventLog.EventType = vLog.Topics[0].Hex()
		}

		eventChan <- eventLog
	}

	return nil
}

// EstimateGas 估算gas消耗
func (bc *BlockchainClient) EstimateGas(to common.Address, value *big.Int, data []byte) (uint64, error) {
	msg := ethereum.CallMsg{
		To:    &to,
		Value: value,
		Data:  data,
	}

	gasLimit, err := bc.client.EstimateGas(context.Background(), msg)
	if err != nil {
		return 0, fmt.Errorf("failed to estimate gas: %w", err)
	}

	return gasLimit, nil
}

// GetGasPrice 获取当前gas价格
func (bc *BlockchainClient) GetGasPrice() (*big.Int, error) {
	gasPrice, err := bc.client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}
	return gasPrice, nil
}

// SetGasPrice 设置gas价格
func (bc *BlockchainClient) SetGasPrice(gasPrice *big.Int) {
	bc.gasPrice = gasPrice
}

// SetGasLimit 设置gas限制
func (bc *BlockchainClient) SetGasLimit(gasLimit uint64) {
	bc.gasLimit = gasLimit
}

// CreateAuth 创建交易授权
func (bc *BlockchainClient) CreateAuth() *bind.TransactOpts {
	auth, err := bind.NewKeyedTransactorWithChainID(bc.privateKey, bc.chainID)
	if err != nil {
		log.Printf("Failed to create auth: %v", err)
		return nil
	}

	auth.GasPrice = bc.gasPrice
	auth.GasLimit = bc.gasLimit

	return auth
}

// VerifySignature 验证签名
func (bc *BlockchainClient) VerifySignature(address common.Address, message []byte, signature []byte) bool {
	// 恢复公钥
	pubKey, err := crypto.SigToPub(crypto.Keccak256Hash(message).Bytes(), signature)
	if err != nil {
		return false
	}

	// 验证地址
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	return recoveredAddr == address
}

// GetContractAddresses 获取合约地址配置
func (bc *BlockchainClient) GetContractAddresses() *ContractAddresses {
	return &ContractAddresses{
		CreatorChainRegistry: os.Getenv("CREATOR_CHAIN_REGISTRY_ADDRESS"),
		CreationMarketplace:  os.Getenv("CREATION_MARKETPLACE_ADDRESS"),
		CreationRegistry:     os.Getenv("CREATION_REGISTRY_ADDRESS"),
		CreatorDAO:           os.Getenv("CREATOR_DAO_ADDRESS"),
		LicenseManager:       os.Getenv("LICENSE_MANAGER_ADDRESS"),
		MultiLayerRights:     os.Getenv("MULTI_LAYER_RIGHTS_ADDRESS"),
		ProofOfCreation:      os.Getenv("PROOF_OF_CREATION_ADDRESS"),
	}
}

// Close 关闭客户端连接
func (bc *BlockchainClient) Close() {
	if bc.client != nil {
		bc.client.Close()
	}
}

// HealthCheck 健康检查
func (bc *BlockchainClient) HealthCheck() error {
	// 检查连接
	_, err := bc.client.BlockNumber(context.Background())
	if err != nil {
		return fmt.Errorf("blockchain connection failed: %w", err)
	}

	// 检查账户余额
	balance, err := bc.GetBalance(bc.GetAccountAddress())
	if err != nil {
		return fmt.Errorf("failed to get account balance: %w", err)
	}

	if balance.Cmp(big.NewInt(0)) == 0 {
		log.Println("Warning: Account balance is zero")
	}

	return nil
}

