// 统一日志管理工具
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // 开发环境日志
  log(message, ...args) {
    if (this.isDevelopment) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  // 错误日志 - 生产环境使用安全的错误处理
  error(message, error = null) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // 生产环境：发送到错误监控服务
      this.sendToErrorService(message, error);
    }
  }

  // 警告日志
  warn(message, ...args) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  // 信息日志
  info(message, ...args) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  // 发送错误到监控服务
  sendToErrorService(message, error) {
    // 在生产环境中，这里应该发送到错误监控服务
    // 例如：Sentry, LogRocket, Bugsnag等
    try {
      // 示例：发送到后端错误收集端点
      if (typeof fetch !== 'undefined') {
        fetch('/api/v1/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            error: error ? error.toString() : null,
            stack: error ? error.stack : null,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        }).catch(() => {
          // 静默处理发送失败
        });
      }
    } catch (e) {
      // 静默处理错误
    }
  }
}

// 创建单例实例
const logger = new Logger();

export default logger;
