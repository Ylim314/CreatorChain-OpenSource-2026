import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import favoriteService from '../services/favoriteService';
import apiService from '../services/apiService';
import safeEthers from '../utils/safeEthers';
import { toast } from 'react-hot-toast';
import AccountSelectorDialog from '../components/AccountSelectorDialog';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

const AUTH_MESSAGE_PREFIX = 'CreatorChain Authentication';

const buildAuthPayload = (address) => {
  const normalized = (address || '').toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${AUTH_MESSAGE_PREFIX}\nAddress:${normalized}\nTimestamp:${timestamp}`;
  return { message, timestamp };
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);

  // 更新收藏数量
  const updateFavoritesCount = useCallback(() => {
    try {
      if (!connected || !account) {
        setFavoritesCount(0);
        return;
      }

      const count = favoriteService.getFavoriteCount(account);
      
      // 确保count是数字且非负
      const finalCount = Math.max(0, Number(count) || 0);
      setFavoritesCount(finalCount);
      
    } catch (error) {
      console.error('获取收藏数量失败:', error);
      setFavoritesCount(0);
    }
  }, [connected, account]);

  // 用户认证流程：签名 + 后端登录
  const authenticateUser = useCallback(async (address, signerInstance) => {
    if (!signerInstance || typeof signerInstance.signMessage !== 'function') {
      throw new Error('Signer unavailable for authentication');
    }

    const { message, timestamp } = buildAuthPayload(address);
    let signature;

    try {
      signature = await signerInstance.signMessage(message);
    } catch (error) {
      console.error('签名认证被拒绝或失败:', error);
      toast.error('签名被拒绝，无法完成登录');
      throw error;
    }

    localStorage.setItem('userAddress', address);
    localStorage.setItem('authMessage', message);
    localStorage.setItem('authTimestamp', timestamp);
    localStorage.setItem('authSignature', signature);

    try {
      console.log('🔐 发送登录请求:', {
        address: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        messageLength: message.length,
        signatureLength: signature.length,
        timestamp: timestamp,
        messagePreview: message.substring(0, 100) + '...'
      });

      const response = await apiService.loginUser({
        address,
        signature,
        message,
        timestamp,
      });

      const token =
        response?.token ||
        response?.Token ||
        response?.data?.token ||
        `demo-token-${address}`;
      const responsePoints =
        response?.user?.points ??
        response?.user?.Points ??
        response?.points ??
        1000;

      localStorage.setItem('authToken', token);
      setPoints(Number(responsePoints) || 0);
      console.log('✅ 登录成功');
    } catch (error) {
      console.error('❌ 登录失败:', error);
      console.error('📋 登录错误详情:', {
        message: error.message,
        status: error.status,
        details: error.details,
        fullError: error
      });
      
      // 检查具体的错误原因
      const errorMessage = error.details?.message || error.message || '';
      
      if (errorMessage.includes('timestamp already used') || errorMessage.includes('Timestamp already used')) {
        console.warn('⚠️ 时间戳已被使用，可能是重复登录，使用本地令牌');
      } else if (errorMessage.includes('signature') || errorMessage.includes('Signature')) {
        console.error('❌ 签名验证失败，请重新签名');
        toast.error('签名验证失败，请重试');
        throw error; // 重新抛出错误，让调用者处理
      } else if (errorMessage.includes('timestamp too old') || errorMessage.includes('Invalid timestamp')) {
        console.error('❌ 时间戳无效或已过期');
        toast.error('认证已过期，请重试');
        throw error;
      } else {
        console.warn('⚠️ Backend login unavailable，使用本地令牌:', errorMessage);
      }
      
      // 即使后端登录失败，也保存认证信息，以便后续API请求使用
      localStorage.setItem('authToken', `demo-token-${address}`);
      setPoints((prev) =>
        typeof prev === 'number' && prev > 0 ? prev : 1000
      );
    }
  }, []);

  // 阶段2：为关键操作刷新认证信息（重新签名）
  // 用于在购买、积分转移等关键操作前生成新的时间戳和签名
  // 这样可以确保每个关键操作都有唯一的认证信息，通过 CriticalOperationMiddleware 的防重放检查
  const refreshAuthForCriticalOperation = useCallback(async () => {
    if (!connected || !account || !signer) {
      console.warn('⚠️ 无法刷新认证：钱包未连接或签名器不可用');
      return false;
    }

    if (typeof signer.signMessage !== 'function') {
      console.warn('⚠️ 签名器不支持 signMessage');
      return false;
    }

    try {
      console.log('🔄 为关键操作刷新认证信息...');
      const { message, timestamp } = buildAuthPayload(account);
      
      // 请求用户签名（会弹出 MetaMask 签名窗口）
      const signature = await signer.signMessage(message);
      
      // 更新 localStorage 中的认证信息
      localStorage.setItem('userAddress', account);
      localStorage.setItem('authMessage', message);
      localStorage.setItem('authTimestamp', timestamp);
      localStorage.setItem('authSignature', signature);
      
      console.log('✅ 认证信息已刷新，新的时间戳:', timestamp);
      return true;
    } catch (error) {
      console.error('❌ 刷新认证信息失败:', error);
      if (error.code === 4001) {
        // 用户拒绝签名
        toast.error('签名被拒绝，无法完成操作');
      } else {
        toast.error('刷新认证信息失败: ' + error.message);
      }
      return false;
    }
  }, [connected, account, signer]);

  // 清理所有缓存数据
  const clearAllCache = useCallback(() => {
    // 清理用户相关数据
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('authSignature');
    localStorage.removeItem('authTimestamp');
    localStorage.removeItem('authMessage');

    // 清理收藏数据（保留其他用户的数据）
    if (account) {
      try {
        const favorites = JSON.parse(localStorage.getItem('creatorchain_favorites') || '{}');
        delete favorites[account];
        localStorage.setItem('creatorchain_favorites', JSON.stringify(favorites));
      } catch (error) {
        console.warn('清理收藏数据失败:', error);
      }
    }

    // 清理AI模型配置
    if (account) {
      localStorage.removeItem(`ai_models_${account}`);
    }

    console.log('🧹 缓存数据已清理');
  }, [account]);

  // 断开连接
  const disconnectWallet = useCallback(() => {
    console.log('📱 断开钱包连接');

    // 清理所有状态
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts(null);
    setConnected(false);
    setIsLoading(false);
    setPoints(0);
    setChainId(null);
    setError(null);
    setIsConnecting(false);
    setFavoritesCount(0);

    // 清理缓存
    clearAllCache();
    // 禁用自动连接（使用新的标志）
    localStorage.removeItem('cc_auto_connect_enabled');

    toast.success('钱包已断开连接');
  }, [clearAllCache]);

  // 初始化Web3连接的完整逻辑
  const initializeWeb3Connection = useCallback(async (address, options = {}) => {
    const { skipAuth = false } = options;
    try {
      const BrowserProvider = safeEthers.getBrowserProvider();
      const ethersProvider = new BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();
      const numericChainId = Number(network.chainId);

      console.log('🔄 准备初始化Web3连接:', {
        address,
        chainId: numericChainId,
        networkName: network.name
      });

      // 检查是否有完整的认证信息
      const hasCachedAuth =
        Boolean(localStorage.getItem('userAddress')) &&
        Boolean(localStorage.getItem('authSignature')) &&
        Boolean(localStorage.getItem('authMessage')) &&
        Boolean(localStorage.getItem('authTimestamp')) &&
        Boolean(localStorage.getItem('authToken'));
      
      // 检查缓存的地址是否匹配
      const cachedAddress = localStorage.getItem('userAddress');
      const addressMatches = cachedAddress && cachedAddress.toLowerCase() === address.toLowerCase();
      
      // 检查时间戳是否过期（5分钟窗口）
      const cachedTimestamp = localStorage.getItem('authTimestamp');
      let timestampValid = false;
      if (cachedTimestamp) {
        const timestampNum = parseInt(cachedTimestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = now - timestampNum;
        timestampValid = timeDiff >= 0 && timeDiff <= 300; // 5分钟窗口
      }

      // 只有在满足所有条件时才使用缓存：完整认证信息 + 地址匹配 + 时间戳有效 + skipAuth为true
      if (skipAuth && hasCachedAuth && addressMatches && timestampValid) {
        console.log('🔐 使用缓存的签名与令牌，跳过重新签名');
      } else {
        console.log('🔐 需要重新认证:', {
          skipAuth,
          hasCachedAuth,
          addressMatches,
          timestampValid,
          reason: !hasCachedAuth ? '缺少认证信息' : 
                  !addressMatches ? '地址不匹配' : 
                  !timestampValid ? '时间戳过期' : '需要重新认证'
        });
        await authenticateUser(address, ethersSigner);
      }

      setAccount(address);
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setChainId(numericChainId);
      setConnected(true);

      // 🔒 安全修复：自动连接成功后立即从后端刷新积分余额
      // 避免使用硬编码的默认值1000，确保显示真实的积分余额
      try {
        const response = await apiService.getPointsBalance(address);
        let newPoints = null;
        if (response && response.points !== undefined) {
          newPoints = Number(response.points);
        } else if (response && response.balance !== undefined) {
          newPoints = Number(response.balance);
        } else if (response && response.new_balance !== undefined) {
          newPoints = Number(response.new_balance);
        }
        
        if (!isNaN(newPoints) && newPoints >= 0) {
          setPoints(newPoints);
          console.log('✅ 自动连接：积分已从后端刷新为:', newPoints);
        } else {
          // 如果刷新失败，使用上次缓存的积分或0，而不是硬编码的1000
          const cachedPoints = localStorage.getItem('cachedPoints');
          const fallbackPoints = cachedPoints ? Number(cachedPoints) : 0;
          setPoints(fallbackPoints);
          console.warn('⚠️ 自动连接：无法获取积分，使用缓存值:', fallbackPoints);
        }
      } catch (error) {
        console.error('❌ 自动连接：刷新积分失败:', error);
        // 刷新失败时使用缓存值或0，而不是硬编码的1000
        const cachedPoints = localStorage.getItem('cachedPoints');
        const fallbackPoints = cachedPoints ? Number(cachedPoints) : 0;
        setPoints(fallbackPoints);
      }

      setTimeout(() => updateFavoritesCount(), 100);

      console.log('✅ Web3连接初始化成功');
      return true;
    } catch (error) {
      console.error('初始化Web3连接失败:', error);
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setConnected(false);
      setChainId(null);
      setPoints(0);
      return false;
    }
  }, [authenticateUser, updateFavoritesCount]);

  // 处理账户变化 - 修复版本
  const handleAccountsChanged = useCallback(async (accounts) => {
    console.log('🔄 MetaMask账户变化:', accounts);

    if (accounts.length === 0) {
      console.log('📱 用户断开了所有账户');
      disconnectWallet();
    } else if (accounts[0] !== account) {
      const newAccount = accounts[0];
      console.log('🔄 账户切换:', account, '->', newAccount);

      // 🔒 安全修复：清除所有认证相关的缓存数据（防止使用旧账户的认证信息）
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');

      // 完全重新初始化Web3连接
      const success = await initializeWeb3Connection(newAccount);

      if (success) {
        toast.success(`账户已切换至 ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`);
      } else {
        toast.error('账户切换失败，请重新连接钱包');
      }
    }
  }, [account, disconnectWallet, initializeWeb3Connection]);

  // 处理链变化
  const handleChainChanged = useCallback((chainId) => {
    setChainId(chainId);
    window.location.reload();
  }, []);

  // 自动连接检查 - 修复版本（默认禁用，需要用户明确启用）
  useEffect(() => {
    const checkConnection = async () => {
      // 默认禁用自动连接，只有用户明确启用时才自动连接
      const autoConnectEnabled = localStorage.getItem('cc_auto_connect_enabled');
      if (autoConnectEnabled !== 'true') {
        console.log('🔒 自动连接已禁用（默认行为）');
        return;
      }

      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            console.log('🔄 检测到已连接账户，正在初始化:', accounts[0]);
            const hasCachedAuth =
              Boolean(localStorage.getItem('authSignature')) &&
              Boolean(localStorage.getItem('authToken'));
            await initializeWeb3Connection(accounts[0], { skipAuth: hasCachedAuth });
          }
        } catch (error) {
          console.error('自动连接失败:', error);
        }
      }
    };

    checkConnection();
  }, [initializeWeb3Connection]);

  // 监听事件
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  // 监听收藏变化
  useEffect(() => {
    // 初始化收藏数量
    updateFavoritesCount();

    // 监听收藏更新事件
    const handleFavoritesUpdate = () => {
      updateFavoritesCount();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'creatorchain_favorites') {
        updateFavoritesCount();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateFavoritesCount]);

  // 连接钱包 - 简化版本
  const connectWallet = async () => {
    if (isConnecting || isLoading) {
      toast('钱包连接正在进行中，请等待...');
      return;
    }

    try {
      setIsConnecting(true);
      setIsLoading(true);
      setError(null);

      // 检查MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装MetaMask钱包扩展程序');
      }

      // 配置本地开发网络（支持 Hardhat 1337 和 Ganache 5777）
      // 首先检查当前网络，然后尝试添加/切换到本地网络
      const currentChainId = window.ethereum.chainId || `0x${Number(window.ethereum.networkVersion || 0).toString(16)}`;
      const currentChainIdNum = parseInt(currentChainId, 16);
      
      // 定义支持的本地网络配置
      const localNetworks = {
        1337: {
          chainId: '0x539', // 1337 in hex
          chainName: 'Hardhat Local',
          rpcUrls: ['http://127.0.0.1:8545']
        },
        5777: {
          chainId: '0x1691', // 5777 in hex
          chainName: 'Ganache Local',
          rpcUrls: ['http://127.0.0.1:7545']
        }
      };

      // 如果当前不在本地网络，尝试添加/切换
      if (currentChainIdNum !== 1337 && currentChainIdNum !== 5777) {
        // 优先尝试 Ganache (5777)，如果失败则尝试 Hardhat (1337)
        const targetNetwork = localNetworks[5777]; // 默认使用 Ganache
        
        try {
          // 先尝试切换到 Ganache
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork.chainId }],
          });
        } catch (switchError) {
          // 如果网络不存在，添加网络
          if (switchError.code === 4902) {
            try {
              const networkConfig = {
                chainId: targetNetwork.chainId,
                chainName: targetNetwork.chainName,
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: targetNetwork.rpcUrls,
                blockExplorerUrls: null
              };
              
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
              });
            } catch (addError) {
              console.error('添加本地网络失败:', addError);
              // 如果 Ganache 失败，尝试 Hardhat
              if (targetNetwork.chainId === localNetworks[5777].chainId) {
                try {
                  const hardhatConfig = {
                    chainId: localNetworks[1337].chainId,
                    chainName: localNetworks[1337].chainName,
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: localNetworks[1337].rpcUrls,
                    blockExplorerUrls: null
                  };
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [hardhatConfig],
                  });
                } catch (hardhatError) {
                  console.error('添加 Hardhat 网络也失败:', hardhatError);
                }
              }
            }
          } else {
            console.error('切换网络失败:', switchError);
          }
        }
      }

      // 请求账户访问权限
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('未获取到账户信息');
      }

      // 如果有多个账户，显示选择对话框
      if (accounts.length > 1) {
        setAvailableAccounts(accounts);
        setShowAccountSelector(true);
        setIsConnecting(false);
        setIsLoading(false);
        return; // 等待用户选择账户
      }

      // 只有一个账户，直接使用
      const address = accounts[0];
      
      // 使用统一的初始化方法
      const initialized = await initializeWeb3Connection(address);

      if (!initialized) {
        throw new Error('钱包初始化失败，请重试');
      }

      // 注意：手动连接不会自动启用自动连接功能
      // 用户需要明确启用自动连接（通过设置或其他方式）
      // 这里不设置 cc_auto_connect_enabled，保持默认禁用状态

      console.log('🎉 钱包连接成功');
      
      toast.success('钱包连接成功！');
      
    } catch (error) {
      console.error('钱包连接错误:', error);

      let errorMessage = '钱包连接失败';
      if (error.code === 4001) {
        errorMessage = '用户取消了连接请求';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // 清理状态
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setConnected(false);
      setError(errorMessage);

      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  };

  // 积分管理
  const spendPoints = (amount) => {
    if (points >= amount) {
      setPoints(points - amount);
      return true;
    }
    return false;
  };

  const addPoints = (amount) => {
    setPoints(points + amount);
  };

  // 直接更新积分（用于从API响应中更新）
  const updatePoints = useCallback((newPoints) => {
    if (typeof newPoints === 'number' && newPoints >= 0) {
      setPoints(newPoints);
      // 缓存积分到localStorage，用于自动连接时的回退
      localStorage.setItem('cachedPoints', newPoints.toString());
      console.log('✅ 积分已更新:', newPoints);
    }
  }, []);

  // 刷新用户积分（从后端获取最新积分）
  const refreshPoints = useCallback(async () => {
    if (!account || !connected) {
      console.warn('⚠️ refreshPoints: account 或 connected 为空', { account, connected });
      return;
    }

    try {
      console.log('🔄 refreshPoints: 开始刷新积分，账户:', account);
      const response = await apiService.getPointsBalance(account);
      console.log('📦 refreshPoints: 后端响应:', response);
      
      // 尝试多种可能的字段名
      let newPoints = null;
      if (response && response.points !== undefined) {
        newPoints = Number(response.points);
        console.log('✅ refreshPoints: 使用 points 字段:', newPoints);
      } else if (response && response.balance !== undefined) {
        newPoints = Number(response.balance);
        console.log('✅ refreshPoints: 使用 balance 字段:', newPoints);
      } else if (response && response.new_balance !== undefined) {
        newPoints = Number(response.new_balance);
        console.log('✅ refreshPoints: 使用 new_balance 字段:', newPoints);
      } else {
        console.warn('⚠️ refreshPoints: 响应中未找到积分字段，完整响应:', response);
        return;
      }
      
      if (!isNaN(newPoints) && newPoints >= 0) {
        setPoints(newPoints);
        // 缓存积分到localStorage，用于自动连接时的回退
        localStorage.setItem('cachedPoints', newPoints.toString());
        console.log('✅ refreshPoints: 积分已更新为:', newPoints);
      } else {
        console.error('❌ refreshPoints: 积分值无效:', newPoints);
      }
    } catch (error) {
      console.error('❌ refreshPoints: 刷新积分失败:', error);
    }
  }, [account, connected]);

  const claimWelcomePoints = () => {
    if (connected && points === 0) {
      addPoints(1000);
      return true;
    }
    return false;
  };

  // 收藏功能
  const toggleFavorite = (creationId) => {
    if (!connected || !account) {
      throw new Error('请先连接钱包');
    }
    return favoriteService.toggleFavorite(account, creationId);
  };

  const isFavorite = (creationId) => {
    if (!connected || !account) return false;
    return favoriteService.isFavorite(account, creationId);
  };

  const getUserFavorites = () => {
    if (!connected || !account) return [];
    return favoriteService.getUserFavorites(account);
  };

  const getFavoriteCount = () => {
    if (!connected || !account) {
      return 0;
    }

    // 直接从favoriteService获取最新数据
    const realCount = favoriteService.getFavoriteCount(account);

    return realCount;
  };

  // 处理账户选择
  const handleAccountSelect = useCallback(async (selectedAddress) => {
    try {
      setIsConnecting(true);
      setIsLoading(true);
      setError(null);
      setShowAccountSelector(false);

      // 配置本地开发网络（支持 Hardhat 1337 和 Ganache 5777）
      const currentChainId = window.ethereum.chainId || `0x${Number(window.ethereum.networkVersion || 0).toString(16)}`;
      const currentChainIdNum = parseInt(currentChainId, 16);
      
      const localNetworks = {
        1337: {
          chainId: '0x539',
          chainName: 'Hardhat Local',
          rpcUrls: ['http://127.0.0.1:8545']
        },
        5777: {
          chainId: '0x1691',
          chainName: 'Ganache Local',
          rpcUrls: ['http://127.0.0.1:7545']
        }
      };

      // 如果当前不在本地网络，尝试添加/切换
      if (currentChainIdNum !== 1337 && currentChainIdNum !== 5777) {
        const targetNetwork = localNetworks[5777];
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              const networkConfig = {
                chainId: targetNetwork.chainId,
                chainName: targetNetwork.chainName,
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: targetNetwork.rpcUrls,
                blockExplorerUrls: null
              };
              
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
              });
            } catch (addError) {
              console.error('添加本地网络失败:', addError);
              if (targetNetwork.chainId === localNetworks[5777].chainId) {
                try {
                  const hardhatConfig = {
                    chainId: localNetworks[1337].chainId,
                    chainName: localNetworks[1337].chainName,
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: localNetworks[1337].rpcUrls,
                    blockExplorerUrls: null
                  };
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [hardhatConfig],
                  });
                } catch (hardhatError) {
                  console.error('添加 Hardhat 网络也失败:', hardhatError);
                }
              }
            }
          }
        }
      }

      // 使用选中的账户初始化连接
      const initialized = await initializeWeb3Connection(selectedAddress);

      if (!initialized) {
        throw new Error('钱包初始化失败，请重试');
      }

      console.log('🎉 钱包连接成功');
      toast.success('钱包连接成功！');
    } catch (error) {
      console.error('账户选择连接错误:', error);

      let errorMessage = '钱包连接失败';
      if (error.code === 4001) {
        errorMessage = '用户取消了连接请求';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAccount(null);
      setProvider(null);
      setSigner(null);
      setConnected(false);
      setError(errorMessage);

      toast.error(errorMessage);
      throw error;
    } finally {
      setIsConnecting(false);
      setIsLoading(false);
    }
  }, [initializeWeb3Connection]);

  // 关闭账户选择对话框
  const handleCloseAccountSelector = useCallback(() => {
    setShowAccountSelector(false);
    setAvailableAccounts([]);
    setIsConnecting(false);
    setIsLoading(false);
  }, []);

  // 强制刷新连接 - 解决账户不同步问题
  const forceRefreshConnection = useCallback(async () => {
    try {
      console.log('🔄 强制刷新钱包连接...');

      if (typeof window.ethereum === 'undefined') {
        throw new Error('未检测到MetaMask');
      }

      // 获取当前MetaMask中的活跃账户
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length === 0) {
        toast.warning('请在MetaMask中连接账户');
        return false;
      }

      const currentAccount = accounts[0];
      console.log('🔍 当前MetaMask账户:', currentAccount);
      console.log('🔍 应用中的账户:', account);

      if (currentAccount !== account) {
        console.log('⚠️ 检测到账户不同步，正在更新...');

        // 清理旧的缓存
        clearAllCache();

        // 重新初始化连接
        const success = await initializeWeb3Connection(currentAccount);

        if (success) {
          toast.success(`账户已同步至 ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`);
          return true;
        } else {
          toast.error('账户同步失败');
          return false;
        }
      } else {
        console.log('✅ 账户已同步');
        toast.success('账户已是最新状态');
        return true;
      }
    } catch (error) {
      console.error('刷新连接失败:', error);
      toast.error('刷新连接失败: ' + error.message);
      return false;
    }
  }, [account, clearAllCache, initializeWeb3Connection]);

  const value = {
    // 状态
    account,
    provider,
    signer,
    contracts,
    connected,
    isLoading,
    isConnecting,
    points,
    chainId,
    error,
    favoritesCount,

    // 网络信息
    networkInfo: { name: 'Unknown Network', symbol: 'ETH' },

    // 方法
    connectWallet,
    disconnectWallet,
    forceRefreshConnection, // 新增强制刷新功能
    refreshAuthForCriticalOperation, // 阶段2：为关键操作刷新认证信息
    refreshPoints, // 刷新积分
    updatePoints, // 直接更新积分
    spendPoints,
    addPoints,
    claimWelcomePoints,
    toggleFavorite,
    isFavorite,
    getUserFavorites,
    getFavoriteCount,

    // 工具函数
    isValidAddress: () => true,
    formatEther: (value) => value,
    parseEther: (value) => value,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
      <AccountSelectorDialog
        open={showAccountSelector}
        onClose={handleCloseAccountSelector}
        onSelect={handleAccountSelect}
        accounts={availableAccounts}
      />
    </Web3Context.Provider>
  );
};
