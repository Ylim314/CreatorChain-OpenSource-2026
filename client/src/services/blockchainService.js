import { BrowserProvider, Contract, getAddress, keccak256, toUtf8Bytes, formatEther } from 'ethers';
import { toast } from 'react-hot-toast';

// 智能合约 ABI（简化版）
const CREATION_REGISTRY_ABI = [
  "function registerCreation(string memory _title, string memory _description, string memory _ipfsHash, uint256 _creationType, bytes32 _contentHash) public returns (uint256)",
  "function confirmCreation(uint256 _creationId, string memory _finalIpfsHash, bytes32 _finalContentHash) public",
  "function getCreation(uint256 _creationId) public view returns (tuple(uint256 id, address creator, string title, string description, string ipfsHash, uint256 creationType, bytes32 contentHash, bool confirmed, uint256 timestamp))",
  "function getCreationsByCreator(address _creator) public view returns (uint256[])",
  "event CreationRegistered(uint256 indexed creationId, address indexed creator, string title, string ipfsHash)",
  "event CreationConfirmed(uint256 indexed creationId, address indexed creator, string finalIpfsHash)"
];

// 合约地址（开发环境）- 使用正确的校验和格式
const CONTRACT_ADDRESSES = {
  1: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // 以太坊主网
  5: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Goerli 测试网
  11155111: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Sepolia 测试网
  137: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Polygon 主网
  80001: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Polygon Mumbai 测试网
  1337: '0x4eE3b375298a3A2FD010201D40542BE548D5C010', // Hardhat 本地网络 - SimpleCreationRegistry 合约地址（本地部署）
  5777: '0x4eE3b375298a3A2FD010201D40542BE548D5C010', // Ganache 本地网络 - SimpleCreationRegistry 合约地址（本地部署）
};

// 获取有效的合约地址（自动校验和格式化）
const getValidContractAddress = (chainId) => {
  const address = CONTRACT_ADDRESSES[chainId];
if (!address) return null;
  
  try {
    // 使用ethers.js自动校验和格式化地址
    return getAddress(address.toLowerCase());
  } catch (error) {
    console.error('地址格式错误:', address, error);
    // 如果地址验证失败，返回null以启用模拟模式
    return null;
  }
};

// 安全的地址格式化函数
const safeFormatAddress = (address) => {
  if (!address) return address;
  try {
    return getAddress(address.toLowerCase());
  } catch (error) {
    console.warn('地址格式化失败:', address, error);
    return address; // 返回原地址
  }
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.chainId = null;
  }

  // 初始化区块链连接
  async initialize() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装 MetaMask 钱包');
      }

      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      const contractAddress = getValidContractAddress(this.chainId);
      if (!contractAddress) {
        console.warn('当前网络不支持或地址格式错误，使用模拟模式');
        return this; // 返回模拟模式
      }

      this.contract = new Contract(
        contractAddress,
        CREATION_REGISTRY_ABI,
        this.signer
      );

      // 验证合约是否可访问
      try {
        // 尝试调用一个 view 函数来验证合约
        const testCall = await this.contract.getCreation(0).catch(() => null);
        console.log('合约验证:', testCall !== null ? '成功' : '合约可能不存在或函数调用失败');
      } catch (verifyError) {
        console.warn('合约验证警告（可能正常，如果合约中还没有创作记录）:', verifyError.message);
      }

      console.log('区块链服务初始化成功:', {
        chainId: this.chainId,
        contractAddress,
        contractAddressFormatted: getAddress(contractAddress),
        signerAddress: await this.signer.getAddress(),
        networkName: network.name
      });

      return this;
    } catch (error) {
      console.error('区块链服务初始化失败:', error);
      toast.error('区块链连接失败: ' + error.message);
      throw error;
    }
  }

  // 生成内容哈希
  generateContentHash(content) {
    return keccak256(toUtf8Bytes(JSON.stringify(content)));
  }

  // 降级到模拟模式的辅助方法
  async _fallbackToSimulated(metadata) {
    console.log('降级到模拟注册创作:', metadata);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('创作已保存（本地模式，区块链节点不可用）');
    return {
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      creationId: Math.floor(Math.random() * 10000),
      gasUsed: '21000',
      isSimulated: true,
      fallbackMode: true
    };
  }

  // 降级到模拟模式的辅助方法（确认创作）
  async _fallbackToSimulatedConfirm(creationId, finalMetadata) {
    console.log('降级到模拟确认创作:', { creationId, finalMetadata });
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('创作确认完成（本地模式，区块链节点不可用）');
    return {
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      gasUsed: '21000',
      isSimulated: true,
      fallbackMode: true
    };
  }

  // 检查是否是 RPC 连接错误（需要降级到模拟模式）
  // 注意：对于本地网络，RPC 错误应该提示用户启动节点，而不是直接降级
  _isRPCError(error, isLocalNetwork = false) {
    if (!error) return false;
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code;
    
    // 对于本地网络，只有明确的连接拒绝错误才认为是 RPC 错误
    // 其他错误可能是合约调用失败，应该让用户知道
    if (isLocalNetwork) {
      const localRPCErrors = [
        'ECONNREFUSED',
        'Failed to fetch',
        'ENOTFOUND',
        'ETIMEDOUT'
      ];
      return localRPCErrors.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      ) || errorCode === -32002; // RPC endpoint returned too many errors
    }
    
    // 对于非本地网络，检查常见的 RPC 错误
    const rpcErrorPatterns = [
      'Failed to fetch',
      'RPC endpoint returned too many errors',
      'could not coalesce error',
      'network error',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];
    
    const isRPCError = rpcErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
    
    // 检查错误代码（排除合约调用失败的情况）
    const isRPCErrorCode = errorCode === -32002 || errorCode === -32603;
    
    // CALL_EXCEPTION 和 missing revert data 通常是合约调用失败，不是 RPC 连接问题
    // 不应该降级，应该让用户知道合约调用失败
    
    return isRPCError || isRPCErrorCode;
  }
  
  // 检查是否是本地节点未运行的错误
  _isLocalNodeUnavailable(error) {
    if (!error) return false;
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code;
    
    const localNodeErrors = [
      'ECONNREFUSED',
      'Failed to fetch',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    return localNodeErrors.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    ) || errorCode === -32002;
  }

  // 第一步：注册创作过程
  async registerCreation(metadata) {
    try {
      if (!this.contract) {
        // 模拟模式
        console.log('模拟注册创作:', metadata);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          creationId: Math.floor(Math.random() * 10000),
          gasUsed: '21000',
          isSimulated: true
        };
      }

      const contentHash = this.generateContentHash({
        title: metadata.title,
        description: metadata.description,
        fileHash: metadata.fileHash,
        creator: metadata.creator,
        timestamp: metadata.timestamp
      });

      toast('正在提交到区块链...');

      // 检查网络是否支持EIP-1559（在尝试任何 RPC 调用之前）
      let network;
      let isLocalNetwork = false;
      try {
        network = await this.provider.getNetwork();
        isLocalNetwork = network.chainId === 1337n || network.chainId === 5777n; // Ganache/Hardhat 本地网络
      } catch (networkError) {
        if (this._isLocalNodeUnavailable(networkError)) {
          // 本地节点未运行，提示用户
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache，或切换到其他网络（如 Sepolia 测试网）');
          throw new Error('本地区块链节点不可用，请启动本地节点或切换网络');
        }
        if (this._isRPCError(networkError, isLocalNetwork)) {
          console.warn('无法获取网络信息，RPC 连接失败:', networkError);
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          return this._fallbackToSimulated(metadata);
        }
        throw networkError;
      }

      // 首先估算gas
      let gasEstimate;
      try {
        gasEstimate = await this.contract.registerCreation.estimateGas(
          metadata.title,
          metadata.description,
          metadata.fileHash,
          metadata.creationType || 0,
          contentHash
        );
        console.log('Gas估算:', gasEstimate.toString());
      } catch (gasError) {
        if (this._isLocalNodeUnavailable(gasError) && isLocalNetwork) {
          // 本地节点未运行
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(gasError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('Gas估算失败，RPC 连接问题，降级到模拟模式:', gasError);
          return this._fallbackToSimulated(metadata);
        }
        // 合约调用失败（如 missing revert data），使用默认值继续尝试
        console.warn('Gas估算失败，使用默认值:', gasError);
        gasEstimate = 500000n; // 使用默认的gas限制
      }

      const isEIP1559Supported = !isLocalNetwork;

      // 获取当前网络的 Gas 价格建议
      let feeData;
      try {
        // 对于本地网络，尝试使用 getFeeData，但如果失败就使用默认值
        if (isLocalNetwork) {
          try {
            feeData = await this.provider.getFeeData();
          } catch (localFeeError) {
            if (this._isLocalNodeUnavailable(localFeeError)) {
              toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
              throw new Error('本地区块链节点不可用');
            }
            // 本地网络可能不支持某些方法，使用默认值
            console.log('本地网络 Gas 价格获取失败，使用默认值:', localFeeError.message);
            feeData = { gasPrice: 20000000000n }; // 20 gwei
          }
        } else {
          feeData = await this.provider.getFeeData();
        }
      } catch (feeError) {
        if (this._isLocalNodeUnavailable(feeError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(feeError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('获取 Gas 价格失败，RPC 连接问题，降级到模拟模式:', feeError);
          return this._fallbackToSimulated(metadata);
        }
        console.warn('获取 Gas 价格失败，使用默认值:', feeError);
        feeData = { gasPrice: 20000000000n }; // 20 gwei
      }

      // 根据网络类型配置交易参数
      let txOptions = {
        gasLimit: gasEstimate + 50000n // 增加额外的gas缓冲
      };

      if (isEIP1559Supported && feeData?.maxFeePerGas) {
        // 支持EIP-1559的网络（如以太坊主网、测试网）
        txOptions.maxFeePerGas = feeData.maxFeePerGas;
        txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 1000000000n; // 1 gwei
      } else {
        // 本地网络或其他不支持EIP-1559的网络 - 只使用 gasPrice
        txOptions.gasPrice = feeData?.gasPrice || 20000000000n; // 20 gwei
      }

      console.log('交易配置:', {
        chainId: network.chainId.toString(),
        isLocalNetwork,
        isEIP1559Supported,
        contractAddress: this.contract.target,
        signerAddress: await this.signer.getAddress(),
        txOptions: {
          ...txOptions,
          gasLimit: txOptions.gasLimit.toString(),
          gasPrice: txOptions.gasPrice?.toString(),
          maxFeePerGas: txOptions.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txOptions.maxPriorityFeePerGas?.toString()
        },
        feeData: feeData ? {
          gasPrice: feeData.gasPrice?.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
        } : null
      });

      // 验证交易参数
      console.log('交易参数验证:', {
        title: metadata.title,
        description: metadata.description?.substring(0, 50) + '...',
        ipfsHash: metadata.fileHash,
        creationType: metadata.creationType || 0,
        contentHash: contentHash
      });

      // 执行交易
      console.log('正在发送交易到 MetaMask...');
      let tx;
      try {
        tx = await this.contract.registerCreation(
          metadata.title,
          metadata.description,
          metadata.fileHash,
          metadata.creationType || 0,
          contentHash,
          txOptions
        );
      } catch (txError) {
        // 用户拒绝交易不应该降级
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          throw txError;
        }
        if (this._isLocalNodeUnavailable(txError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(txError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('发送交易失败，RPC 连接问题，降级到模拟模式:', txError);
          return this._fallbackToSimulated(metadata);
        }
        throw txError;
      }
      
      console.log('交易已发送，交易哈希:', tx.hash);

      toast('交易已提交，等待确认...');

      let receipt;
      try {
        receipt = await tx.wait();
      } catch (waitError) {
        if (this._isLocalNodeUnavailable(waitError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(waitError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('等待交易确认失败，RPC 连接问题，降级到模拟模式:', waitError);
          return this._fallbackToSimulated(metadata);
        }
        throw waitError;
      }
      
      const creationId = receipt.logs[0]?.args?.[0] || Math.floor(Math.random() * 10000);

      toast.success('创作已成功注册到区块链！');

      return {
        transactionHash: receipt.hash,
        creationId: Number(creationId),
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        isSimulated: false
      };

    } catch (error) {
      console.error('注册创作失败 - 详细错误信息:', {
        error: error,
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data,
        transaction: error.transaction,
        receipt: error.receipt
      });

      // 详细的错误处理
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('用户取消了交易');
        throw new Error('用户取消了交易');
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        toast.error('余额不足支付Gas费用，请确保钱包有足够的ETH');
        throw new Error('余额不足支付Gas费用');
      } else if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        toast.error('您拒绝了交易请求');
        throw new Error('用户拒绝了交易请求');
      } else if (this._isLocalNodeUnavailable(error)) {
        // 本地节点未运行，提示用户
        toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache，或切换到其他网络（如 Sepolia 测试网）');
        throw new Error('本地区块链节点不可用');
      } else if (this._isRPCError(error, false)) {
        // 非本地网络的 RPC 连接错误，降级到模拟模式
        console.warn('检测到 RPC 连接错误，降级到模拟模式:', error);
        return this._fallbackToSimulated(metadata);
      } else if (error.code === -32602 || error.message?.includes('EIP-1559')) {
        console.warn('EIP-1559不兼容错误，可能是网络配置问题，尝试模拟模式');
        return this._fallbackToSimulated(metadata);
      } else if (error.code === -32603 || error.message?.includes('Internal JSON-RPC error')) {
        console.warn('JSON-RPC错误，可能是网络问题，尝试模拟模式');
        return this._fallbackToSimulated(metadata);
      } else {
        toast.error('注册创作失败: ' + (error.reason || error.message || '未知错误'));
      }

      throw error;
    }
  }

  // 第二步：确认最终创作
  async confirmCreation(creationId, finalMetadata) {
    try {
      if (!this.contract) {
        // 模拟模式
        console.log('模拟确认创作:', { creationId, finalMetadata });
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          gasUsed: '21000',
          isSimulated: true
        };
      }

      const finalContentHash = this.generateContentHash(finalMetadata);

      toast('正在确认创作到区块链...');

      // 检查网络是否支持EIP-1559（在尝试任何 RPC 调用之前）
      let network;
      let isLocalNetwork = false;
      try {
        network = await this.provider.getNetwork();
        isLocalNetwork = network.chainId === 1337n || network.chainId === 5777n; // Ganache/Hardhat 本地网络
      } catch (networkError) {
        if (this._isLocalNodeUnavailable(networkError)) {
          // 本地节点未运行，提示用户
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache，或切换到其他网络（如 Sepolia 测试网）');
          throw new Error('本地区块链节点不可用，请启动本地节点或切换网络');
        }
        if (this._isRPCError(networkError, isLocalNetwork)) {
          console.warn('无法获取网络信息，RPC 连接失败:', networkError);
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
        }
        throw networkError;
      }

      // 首先估算gas
      let gasEstimate;
      try {
        gasEstimate = await this.contract.confirmCreation.estimateGas(
          creationId,
          finalMetadata.finalIpfsHash,
          finalContentHash
        );
        console.log('确认创作Gas估算:', gasEstimate.toString());
      } catch (gasError) {
        if (this._isLocalNodeUnavailable(gasError) && isLocalNetwork) {
          // 本地节点未运行
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(gasError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('确认创作Gas估算失败，RPC 连接问题，降级到模拟模式:', gasError);
          return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
        }
        // 合约调用失败（如 missing revert data），使用默认值继续尝试
        console.warn('确认创作Gas估算失败，使用默认值:', gasError);
        gasEstimate = 300000n; // 使用较大的默认gas限制
      }

      const isEIP1559Supported = !isLocalNetwork;

      // 获取当前网络的 Gas 价格建议
      let feeData;
      try {
        // 对于本地网络，尝试使用 getFeeData，但如果失败就使用默认值
        if (isLocalNetwork) {
          try {
            feeData = await this.provider.getFeeData();
          } catch (localFeeError) {
            if (this._isLocalNodeUnavailable(localFeeError)) {
              toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
              throw new Error('本地区块链节点不可用');
            }
            // 本地网络可能不支持某些方法，使用默认值
            console.log('本地网络 Gas 价格获取失败，使用默认值:', localFeeError.message);
            feeData = { gasPrice: 20000000000n }; // 20 gwei
          }
        } else {
          feeData = await this.provider.getFeeData();
        }
      } catch (feeError) {
        if (this._isLocalNodeUnavailable(feeError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(feeError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('获取 Gas 价格失败，RPC 连接问题，降级到模拟模式:', feeError);
          return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
        }
        console.warn('获取 Gas 价格失败，使用默认值:', feeError);
        feeData = { gasPrice: 20000000000n }; // 20 gwei
      }

      // 根据网络类型配置交易参数
      let txOptions = {
        gasLimit: gasEstimate + 100000n // 增加较大的gas缓冲
      };

      if (isEIP1559Supported && feeData?.maxFeePerGas) {
        // 支持EIP-1559的网络（如以太坊主网、测试网）
        txOptions.maxFeePerGas = feeData.maxFeePerGas;
        txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 1000000000n; // 1 gwei
      } else {
        // 本地网络或其他不支持EIP-1559的网络 - 只使用 gasPrice
        txOptions.gasPrice = feeData?.gasPrice || 20000000000n; // 20 gwei
      }

      console.log('确认创作交易配置:', {
        chainId: network.chainId.toString(),
        isLocalNetwork,
        isEIP1559Supported,
        contractAddress: this.contract.target,
        signerAddress: await this.signer.getAddress(),
        txOptions: {
          ...txOptions,
          gasLimit: txOptions.gasLimit.toString(),
          gasPrice: txOptions.gasPrice?.toString(),
          maxFeePerGas: txOptions.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: txOptions.maxPriorityFeePerGas?.toString()
        },
        feeData: feeData ? {
          gasPrice: feeData.gasPrice?.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
        } : null,
        creationId,
        finalIpfsHash: finalMetadata.finalIpfsHash
      });

      // 验证交易参数
      console.log('确认创作交易参数验证:', {
        creationId,
        finalIpfsHash: finalMetadata.finalIpfsHash,
        finalContentHash: finalContentHash
      });

      // 执行交易
      console.log('正在发送确认交易到 MetaMask...');
      let tx;
      try {
        tx = await this.contract.confirmCreation(
          creationId,
          finalMetadata.finalIpfsHash,
          finalContentHash,
          txOptions
        );
      } catch (txError) {
        // 用户拒绝交易不应该降级
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          throw txError;
        }
        if (this._isLocalNodeUnavailable(txError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(txError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('发送确认交易失败，RPC 连接问题，降级到模拟模式:', txError);
          return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
        }
        throw txError;
      }
      
      console.log('确认交易已发送，交易哈希:', tx.hash);

      toast('确认交易已提交，等待确认...');
      
      let receipt;
      try {
        receipt = await tx.wait();
      } catch (waitError) {
        if (this._isLocalNodeUnavailable(waitError) && isLocalNetwork) {
          toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache');
          throw new Error('本地区块链节点不可用');
        }
        if (this._isRPCError(waitError, isLocalNetwork)) {
          if (isLocalNetwork) {
            toast.error('无法连接到本地区块链节点，请确保 Hardhat 或 Ganache 正在运行');
            throw new Error('本地区块链节点不可用');
          }
          console.warn('等待确认交易失败，RPC 连接问题，降级到模拟模式:', waitError);
          return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
        }
        throw waitError;
      }

      toast.success('创作确认完成！版权保护已生效');

      return {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        isSimulated: false
      };

    } catch (error) {
      console.error('确认创作失败 - 详细错误信息:', {
        error: error,
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data,
        transaction: error.transaction,
        receipt: error.receipt
      });

      // 详细的错误处理
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('用户取消了交易');
        throw new Error('用户取消了交易');
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        toast.error('余额不足支付Gas费用，请确保钱包有足够的ETH');
        throw new Error('余额不足支付Gas费用');
      } else if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        toast.error('您拒绝了交易请求');
        throw new Error('用户拒绝了交易请求');
      } else if (this._isLocalNodeUnavailable(error)) {
        // 本地节点未运行，提示用户
        toast.error('本地区块链节点未运行，请启动 Hardhat 或 Ganache，或切换到其他网络（如 Sepolia 测试网）');
        throw new Error('本地区块链节点不可用');
      } else if (this._isRPCError(error, false)) {
        // 非本地网络的 RPC 连接错误，降级到模拟模式
        console.warn('检测到 RPC 连接错误，降级到模拟模式:', error);
        return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
      } else if (error.code === -32602 || error.message?.includes('EIP-1559')) {
        console.warn('EIP-1559不兼容错误，可能是网络配置问题，尝试模拟模式');
        return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
      } else if (error.code === -32603 || error.message?.includes('Internal JSON-RPC error')) {
        console.warn('JSON-RPC错误，可能是网络问题，尝试模拟模式');
        return this._fallbackToSimulatedConfirm(creationId, finalMetadata);
      } else {
        toast.error('确认创作失败: ' + (error.reason || error.message || '未知错误'));
      }

      throw error;
    }
  }

  // 获取创作详情
  async getCreation(creationId) {
    try {
      if (!this.contract) {
        // 模拟模式
        return {
          id: creationId,
          creator: safeFormatAddress('0x742d35Cc6634C0532925a3b8D4C9Db96C4B4d8b6'),
          title: '模拟创作',
          description: '这是一个模拟的创作记录',
          ipfsHash: 'QmSimulatedHash',
          creationType: 0,
          contentHash: '0x1234567890abcdef',
          confirmed: false,
          timestamp: Math.floor(Date.now() / 1000),
          isSimulated: true
        };
      }

      const creation = await this.contract.getCreation(creationId);
      return {
        id: Number(creation.id),
        creator: creation.creator,
        title: creation.title,
        description: creation.description,
        ipfsHash: creation.ipfsHash,
        creationType: Number(creation.creationType),
        contentHash: creation.contentHash,
        confirmed: creation.confirmed,
        timestamp: Number(creation.timestamp),
        isSimulated: false
      };

    } catch (error) {
      console.error('获取创作详情失败:', error);
      throw error;
    }
  }

  // 获取用户的所有创作
  async getUserCreations(userAddress) {
    try {
      if (!this.contract) {
        // 模拟模式
        return [1, 2, 3].map(id => ({
          id,
          creator: userAddress,
          title: `模拟创作 ${id}`,
          description: `这是第 ${id} 个模拟创作`,
          ipfsHash: `QmSimulatedHash${id}`,
          creationType: 0,
          confirmed: id % 2 === 0,
          timestamp: Math.floor(Date.now() / 1000) - (id * 86400),
          isSimulated: true
        }));
      }

      try {
        const creationIds = await this.contract.getCreationsByCreator(userAddress);

        // 检查返回的数据是否有效
        if (!creationIds || creationIds.length === 0) {
          console.log('用户暂无区块链创作记录:', userAddress);
          return []; // 返回空数组而不是错误
        }

        const creations = [];
        for (const id of creationIds) {
          try {
            const creation = await this.getCreation(Number(id));
            creations.push(creation);
          } catch (error) {
            console.warn(`获取创作 ${id} 失败:`, error);
            // 继续处理其他创作，不中断整个流程
          }
        }

        return creations;

      } catch (error) {
        // 如果是数据解码错误，说明用户还没有创作记录
        if (error.code === 'BAD_DATA' || error.message?.includes('could not decode result data')) {
          console.log('用户暂无区块链创作记录（返回空数据）:', userAddress);
          return []; // 返回空数组
        }

        // 其他错误继续抛出
        throw error;
      }

    } catch (error) {
      console.error('获取用户创作失败:', error);
      throw error;
    }
  }

  // 估算Gas费用
  async estimateGasCost(method, ...args) {
    try {
      if (!this.contract) {
        return { gasEstimate: '21000', gasCostInEth: '0.001', isSimulated: true };
      }

      const gasEstimate = await this.contract[method].estimateGas(...args);
      const gasPrice = await this.provider.getFeeData();
      
      const gasCostInWei = gasEstimate * gasPrice.gasPrice;
      const gasCostInEth = formatEther(gasCostInWei);

      return {
        gasEstimate: gasEstimate.toString(),
        gasCostInEth,
        gasPrice: gasPrice.gasPrice.toString(),
        isSimulated: false
      };

    } catch (error) {
      console.error('估算Gas费用失败:', error);
      return { gasEstimate: '21000', gasCostInEth: '0.001', isSimulated: true };
    }
  }

  // 获取网络信息
  getNetworkInfo() {
    const networks = {
      1: { name: '以太坊主网', symbol: 'ETH', explorer: 'https://etherscan.io' },
      5: { name: 'Goerli 测试网', symbol: 'ETH', explorer: 'https://goerli.etherscan.io' },
      11155111: { name: 'Sepolia 测试网', symbol: 'ETH', explorer: 'https://sepolia.etherscan.io' },
      137: { name: 'Polygon 主网', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
      80001: { name: 'Polygon Mumbai', symbol: 'MATIC', explorer: 'https://mumbai.polygonscan.com' },
      1337: { name: 'Hardhat 本地网络', symbol: 'ETH', explorer: 'http://localhost:8545' },
      5777: { name: 'Ganache 本地网络', symbol: 'ETH', explorer: 'http://localhost:7545' }
    };

    return networks[this.chainId] || { 
      name: '未知网络', 
      symbol: 'ETH', 
      explorer: '#' 
    };
  }
}

// 创建单例实例
const blockchainService = new BlockchainService();

export default blockchainService;