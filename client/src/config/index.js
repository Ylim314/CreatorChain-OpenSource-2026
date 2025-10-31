// 前端配置文件

// API配置
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// 区块链配置
export const BLOCKCHAIN_CONFIG = {
  CHAIN_ID: parseInt(process.env.REACT_APP_CHAIN_ID) || 11155111, // Sepolia
  CHAIN_NAME: process.env.REACT_APP_CHAIN_NAME || 'Sepolia Testnet',
  RPC_URL: process.env.REACT_APP_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  BLOCK_EXPLORER: 'https://sepolia.etherscan.io',
};

// IPFS配置
export const IPFS_CONFIG = {
  GATEWAY: process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  API_URL: process.env.REACT_APP_IPFS_API || 'https://api.pinata.cloud',
};

// 应用配置
export const APP_CONFIG = {
  NAME: 'CreatorChain',
  VERSION: '1.0.0',
  DEBUG: process.env.REACT_APP_DEBUG_MODE === 'true',
  FEATURES: {
    AI_CREATION: process.env.REACT_APP_ENABLE_AI_CREATION !== 'false',
    MARKETPLACE: process.env.REACT_APP_ENABLE_MARKETPLACE !== 'false',
  },
};

// 默认导出所有配置
export default {
  API_CONFIG,
  BLOCKCHAIN_CONFIG,
  IPFS_CONFIG,
  APP_CONFIG,
};