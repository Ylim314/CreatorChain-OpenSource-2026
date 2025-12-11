/**
 * MetaMask错误过滤器
 * 用于屏蔽MetaMask扩展内部错误，避免干扰用户体验
 */

// MetaMask常见错误模式
const METAMASK_ERROR_PATTERNS = [
  // 连接相关错误
  'Failed to connect to MetaMask',
  'MetaMask extension not found',
  'chrome-extension://',
  'inpage.js',
  
  // 消息通道错误
  'A listener indicated an asynchronous response',
  'message channel closed',
  'Receiving end does not exist',
  'Could not establish connection',
  
  // 内部错误
  'v[w] is not a function',
  'is not a function',
  
  // 文件路径错误
  'main.',
  'chunk.',
  'a.onload',
];

/**
 * 检查是否是MetaMask扩展错误
 */
export const isMetaMaskExtensionError = (error) => {
  const msg = String(error?.message || error || '');
  return METAMASK_ERROR_PATTERNS.some(pattern => msg.includes(pattern));
};

/**
 * 安装全局错误过滤器
 */
export const installMetaMaskErrorFilter = () => {
  // 1. 过滤未捕获的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (isMetaMaskExtensionError(event.reason)) {
      console.debug('[MetaMask扩展错误] 已过滤:', event.reason);
      event.preventDefault();
    }
  });

  // 2. 过滤全局错误事件
  window.addEventListener('error', (event) => {
    if (isMetaMaskExtensionError(event.message) || 
        isMetaMaskExtensionError(event.filename)) {
      console.debug('[MetaMask扩展错误] 已过滤:', event.message);
      event.preventDefault();
    }
  });

  // 3. 包装console.error
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (!args.some(arg => isMetaMaskExtensionError(arg))) {
      originalConsoleError.apply(console, args);
    } else {
      console.debug('[MetaMask扩展错误] 已过滤:', ...args);
    }
  };

  console.log('✅ MetaMask错误过滤器已安装');
};

const metamaskErrorFilter = {
  isMetaMaskExtensionError,
  installMetaMaskErrorFilter,
};

export default metamaskErrorFilter;
