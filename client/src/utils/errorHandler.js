// 错误处理工具
export const setupErrorHandling = () => {
  // 忽略MetaMask扩展相关的错误
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || '';
    
    // 过滤掉常见的浏览器和扩展相关错误
    if (
      errorMessage.includes('A listener indicated an asynchronous response') ||
      errorMessage.includes('but the message channel closed before a response was received') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('The play() request was interrupted') ||
      errorMessage.includes('AbortError') ||
      errorMessage.includes('NotAllowedError') ||
      errorMessage.includes('Non-Error promise rejection') ||
      errorMessage.includes('HTTP error! status: 404') ||
      errorMessage.includes('API请求错误') ||
      errorMessage.includes('call to pause()') ||
      errorMessage.includes('v[w] is not a function') ||
      errorMessage.includes('could not coalesce error') ||
      errorMessage.includes('could not decode result data') ||
      errorMessage.includes('BAD_DATA') ||
      errorMessage.includes('EIP-1559 transaction but the current network does not support EIP-1559') ||
      errorMessage.includes('Invalid transaction params') ||
      errorMessage.includes('Cannot read properties of undefined') ||
      errorMessage.includes('Failed to connect to MetaMask') ||
      errorMessage.includes('chrome-extension://') ||
      errorMessage.includes('inpage.js') ||
      errorMessage.includes('MetaMask extension not found') ||
      errorMessage.includes('reading \'slice\'') ||
      errorMessage.includes('reading \'toString\'') ||
      errorMessage.includes('TypeError: Cannot read properties') ||
      errorMessage.includes('is not a function') ||
      errorMessage.includes('main.') ||
      errorMessage.includes('chunk.') ||
      errorMessage.includes('webpack') ||
      errorMessage.includes('a.onload') ||
      errorMessage.includes('[object Object]') ||
      errorMessage.includes('null is not an object') ||
      errorMessage.includes('Received NaN for the') ||
      errorMessage.includes('Warning: Received NaN') ||
      /^[a-z]\[[a-z]\]/.test(errorMessage) ||  // 匹配v[w]等模式
      (errorMessage.length < 10 && /^[a-z]/.test(errorMessage)) // 匹配短的混淆变量名错误
    ) {
      // 静默处理这些错误，不显示在控制台
      return;
    }
    
    // 其他错误正常显示
    originalConsoleError.apply(console, args);
  };

  // 同样过滤console.warn
  console.warn = (...args) => {
    const warnMessage = args[0]?.toString() || '';

    // 过滤掉常见的浏览器和扩展相关警告
    if (
      warnMessage.includes('A listener indicated an asynchronous response') ||
      warnMessage.includes('but the message channel closed before a response was received') ||
      warnMessage.includes('message channel closed') ||
      warnMessage.includes('Receiving end does not exist') ||
      warnMessage.includes('Could not establish connection') ||
      warnMessage.includes('v[w] is not a function') ||
      warnMessage.includes('is not a function') ||
      warnMessage.includes('main.') ||
      warnMessage.includes('chunk.') ||
      warnMessage.includes('webpack') ||
      warnMessage.includes('a.onload') ||
      /^[a-z]\[[a-z]\]/.test(warnMessage) ||
      (warnMessage.length < 10 && /^[a-z]/.test(warnMessage))
    ) {
      // 静默处理这些警告
      return;
    }

    // 其他警告正常显示
    originalConsoleWarn.apply(console, args);
  };

  // 全局错误处理
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.toString() || '';
    
    // 忽略常见的浏览器和扩展相关Promise错误
    if (
      errorMessage.includes('A listener indicated an asynchronous response') ||
      errorMessage.includes('but the message channel closed before a response was received') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('The play() request was interrupted') ||
      errorMessage.includes('AbortError') ||
      errorMessage.includes('NotAllowedError') ||
      errorMessage.includes('Non-Error promise rejection') ||
      errorMessage.includes('HTTP error! status: 404') ||
      errorMessage.includes('call to pause()')
    ) {
      event.preventDefault(); // 阻止错误显示
      return;
    }
  });

  // 全局脚本错误处理
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || '';
    
    // 忽略已知的安全错误和扩展错误
    if (
      errorMessage.includes('A listener indicated an asynchronous response') ||
      errorMessage.includes('but the message channel closed before a response was received') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('Script error') ||
      errorMessage.includes('Non-Error promise rejection') ||
      errorMessage.includes('v[w] is not a function') ||
      errorMessage.includes('could not coalesce error') ||
      errorMessage.includes('could not decode result data') ||
      errorMessage.includes('BAD_DATA') ||
      errorMessage.includes('EIP-1559 transaction but the current network does not support EIP-1559') ||
      errorMessage.includes('Invalid transaction params') ||
      errorMessage.includes('Cannot read properties of undefined') ||
      errorMessage.includes('reading \'slice\'') ||
      errorMessage.includes('reading \'toString\'') ||
      errorMessage.includes('TypeError: Cannot read properties') ||
      errorMessage.includes('is not a function') ||
      errorMessage.includes('webpack') ||
      errorMessage.includes('a.onload') ||
      errorMessage.includes('[object Object]') ||
      errorMessage.includes('null is not an object') ||
      errorMessage.includes('Received NaN for the') ||
      errorMessage.includes('Warning: Received NaN') ||
      /^[a-z]\[[a-z]\]/.test(errorMessage) ||
      (errorMessage.length < 10 && /^[a-z]/.test(errorMessage)) ||
      event.filename?.includes('extension') ||
      event.filename?.includes('main.') ||
      event.filename?.includes('chunk.')
    ) {
      event.preventDefault();
      return;
    }
    
    // 记录其他脚本错误但不阻塞应用
    console.warn('Script error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};

// 检查是否是MetaMask相关错误
export const isMetaMaskError = (error) => {
  const errorMessage = error?.toString() || '';
  return (
    errorMessage.includes('A listener indicated an asynchronous response') ||
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('Receiving end does not exist') ||
    errorMessage.includes('Could not establish connection') ||
    errorMessage.includes('Failed to connect to MetaMask') ||
    errorMessage.includes('chrome-extension://') ||
    errorMessage.includes('inpage.js') ||
    errorMessage.includes('MetaMask extension not found') ||
    errorMessage.includes('MetaMask')
  );
};

// 安全的错误日志记录
export const safeLogError = (error, context = '') => {
  if (isMetaMaskError(error)) {
    console.debug(`[MetaMask扩展错误] ${context}:`, error);
  } else {
    console.error(`[应用错误] ${context}:`, error);
  }
};
