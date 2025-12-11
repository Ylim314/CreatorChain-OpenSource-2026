/**
 * Web3 调试工具
 * 用于诊断MetaMask连接问题
 */

export const checkMetaMaskAvailability = () => {
  const checks = {
    windowEthereum: typeof window.ethereum !== 'undefined',
    isMetaMask: window.ethereum?.isMetaMask === true,
    chainId: window.ethereum?.chainId || null,
    networkVersion: window.ethereum?.networkVersion || null,
    selectedAddress: window.ethereum?.selectedAddress || null,
    isConnected: window.ethereum?.isConnected?.() || false,
  };

  console.log('🔍 MetaMask 可用性检查:', checks);
  return checks;
};

export const testMetaMaskConnection = async () => {
  console.log('🧪 开始测试MetaMask连接...');
  
  try {
    // 1. 检查基本可用性
    const availability = checkMetaMaskAvailability();
    if (!availability.windowEthereum) {
      throw new Error('window.ethereum 不可用');
    }

    // 2. 测试 eth_accounts (不会弹窗，只检查已授权账户)
    console.log('📋 测试 eth_accounts...');
    let existingAccounts;
    try {
      existingAccounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      console.log('✅ eth_accounts 返回:', existingAccounts);
    } catch (error) {
      console.error('❌ eth_accounts 失败:', error);
      throw error;
    }

    // 3. 如果没有已授权账户，测试 eth_requestAccounts
    if (!existingAccounts || existingAccounts.length === 0) {
      console.log('📋 测试 eth_requestAccounts...');
      try {
        const requestedAccounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        console.log('✅ eth_requestAccounts 返回:', requestedAccounts);
      } catch (error) {
        console.error('❌ eth_requestAccounts 失败:', error);
        throw error;
      }
    }

    // 4. 测试获取chainId
    console.log('📋 测试 eth_chainId...');
    try {
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      console.log('✅ eth_chainId 返回:', chainId, '(十进制:', parseInt(chainId, 16), ')');
    } catch (error) {
      console.error('❌ eth_chainId 失败:', error);
    }

    console.log('✅ MetaMask连接测试完成');
    return true;
  } catch (error) {
    console.error('❌ MetaMask连接测试失败:', error);
    return false;
  }
};

export const logMetaMaskEvents = () => {
  if (typeof window.ethereum === 'undefined') {
    console.warn('window.ethereum 不可用，无法监听事件');
    return;
  }

  // 监听所有常见事件
  const events = [
    'connect',
    'disconnect',
    'accountsChanged',
    'chainChanged',
    'message',
  ];

  events.forEach(event => {
    window.ethereum.on(event, (...args) => {
      console.log(`🔔 MetaMask事件 [${event}]:`, ...args);
    });
  });

  console.log('✅ 已启用MetaMask事件监听');
};

export const getDetailedMetaMaskInfo = () => {
  const info = {
    // 基本信息
    exists: typeof window.ethereum !== 'undefined',
    isMetaMask: window.ethereum?.isMetaMask,
    
    // 连接状态
    chainId: window.ethereum?.chainId,
    networkVersion: window.ethereum?.networkVersion,
    selectedAddress: window.ethereum?.selectedAddress,
    isConnected: window.ethereum?.isConnected?.(),
    
    // 提供者信息
    providers: window.ethereum?.providers ? 
      window.ethereum.providers.map(p => ({
        isMetaMask: p.isMetaMask,
        chainId: p.chainId,
      })) : null,
    
    // 其他信息
    _metamask: {
      isUnlocked: window.ethereum?._metamask?.isUnlocked,
    },
  };

  console.table(info);
  return info;
};

// 自动在开发环境中启用调试
if (process.env.NODE_ENV === 'development') {
  window.web3Debug = {
    check: checkMetaMaskAvailability,
    test: testMetaMaskConnection,
    info: getDetailedMetaMaskInfo,
    enableEventLogging: logMetaMaskEvents,
  };
  
  console.log('💡 Web3调试工具已加载，使用 window.web3Debug 访问');
}
