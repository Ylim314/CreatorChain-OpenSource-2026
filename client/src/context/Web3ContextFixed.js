import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import favoriteService from '../services/favoriteService';
import apiService from '../services/apiService';
import safeEthers from '../utils/safeEthers';
import { toast } from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

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

  // 简化的用户认证
  const authenticateUser = useCallback(async (address) => {
    try {
      // 简化认证流程，直接设置用户
      localStorage.setItem('userAddress', address);
      localStorage.setItem('authToken', 'demo-token-' + address);
      
      // 尝试调用后端API
      try {
        const response = await apiService.loginUser({
          address: address,
          signature: 'demo-signature',
          message: 'Demo login'
        });
        
        if (response.success) {
          setPoints(response.user?.points || 1000);
        }
      } catch (error) {
        console.warn('Backend not available, using default points');
        setPoints(1000); // 默认积分
      }
    } catch (error) {
      console.error('认证失败:', error);
      throw error;
    }
  }, []);

  // 清理所有缓存数据
  const clearAllCache = useCallback(() => {
    // 清理用户相关数据
    localStorage.removeItem('authToken');
    localStorage.removeItem('userAddress');

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
    localStorage.setItem('cc_auto_connect_disabled', 'true');

    toast.success('钱包已断开连接');
  }, [clearAllCache]);

  // 初始化Web3连接的完整逻辑
  const initializeWeb3Connection = useCallback(async (address) => {
    try {
      // 初始化ethers提供者和签名者
      const BrowserProvider = safeEthers.getBrowserProvider();
      const ethersProvider = new BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();

      // 获取网络信息
      const network = await ethersProvider.getNetwork();

      // 设置所有必要状态
      setAccount(address);
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setChainId(Number(network.chainId));
      setConnected(true);
      setPoints(1000); // 默认积分

      console.log('🔄 Web3连接已初始化:', {
        address,
        chainId: Number(network.chainId),
        networkName: network.name
      });

      // 异步认证用户
      await authenticateUser(address);

      // 更新收藏数量
      setTimeout(() => updateFavoritesCount(), 100);

      return true;
    } catch (error) {
      console.error('初始化Web3连接失败:', error);
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

      // 清除旧的缓存数据
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authToken');

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

  // 自动连接检查 - 修复版本
  useEffect(() => {
    const checkConnection = async () => {
      const autoConnectDisabled = localStorage.getItem('cc_auto_connect_disabled');
      if (autoConnectDisabled === 'true') {
        return;
      }

      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            console.log('🔄 检测到已连接账户，正在初始化:', accounts[0]);
            await initializeWeb3Connection(accounts[0]);
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

      // 配置本地开发网络
      const localChainId = '0x539'; // 1337 in hex (Ganache default)
      const networkConfig = {
        chainId: localChainId,
        chainName: 'CreatorChain Local',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['http://localhost:8545'],
        blockExplorerUrls: null
      };

      try {
        // 尝试切换到本地网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: localChainId }],
        });
      } catch (switchError) {
        // 如果网络不存在，添加网络
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
          } catch (addError) {
            console.error('添加网络失败:', addError);
            toast.error('无法添加本地开发网络，请手动配置MetaMask连接到 http://localhost:8545');
          }
        } else {
          console.error('切换网络失败:', switchError);
          toast.warning('请在MetaMask中手动切换到本地开发网络');
        }
      }

      // 请求账户
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('未获取到账户信息');
      }

      const address = accounts[0];

      // 使用统一的初始化方法
      await initializeWeb3Connection(address);

      // 清除禁用标记
      localStorage.removeItem('cc_auto_connect_disabled');

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
    </Web3Context.Provider>
  );
};