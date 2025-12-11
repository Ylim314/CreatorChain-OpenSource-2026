// API服务 - 处理与后端的通信
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    // 验证 endpoint 和 baseURL
    if (!endpoint) {
      throw new Error('Endpoint is required');
    }
    if (!this.baseURL) {
      throw new Error('Base URL is not configured');
    }
    
    // 确保 endpoint 以 / 开头
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;
    
    // 验证 URL 格式
    try {
      new URL(url); // 这会抛出错误如果 URL 无效
    } catch (urlError) {
      console.error('❌ 无效的 URL:', {
        baseURL: this.baseURL,
        endpoint: endpoint,
        normalizedEndpoint: normalizedEndpoint,
        finalURL: url,
        error: urlError.message
      });
      throw new Error(`Invalid URL: ${url}. BaseURL: ${this.baseURL}, Endpoint: ${endpoint}`);
    }
    
    const authHeaders = this.getAuthHeaders();
    
    // 详细检查认证头（始终打印，帮助调试）
    const hasAuth = Object.keys(authHeaders).length > 0;
    const userAddress = authHeaders['User-Address'];
    const signature = authHeaders['Signature'];
    const message = authHeaders['Message'];
    const timestamp = authHeaders['Timestamp'];
    
    // 检查 localStorage 中的原始值
    const rawAddress = localStorage.getItem('userAddress');
    const rawSignature = localStorage.getItem('authSignature');
    const rawMessage = localStorage.getItem('authMessage');
    const rawTimestamp = localStorage.getItem('authTimestamp');
    
    console.log(`🌐 [API] ${options.method || 'GET'} ${endpoint}`, {
      hasAuth,
      authHeadersCount: Object.keys(authHeaders).length,
      hasUserAddress: !!userAddress,
      hasSignature: !!signature,
      hasMessage: !!message,
      hasTimestamp: !!timestamp,
      userAddress: userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : null,
      timestamp: timestamp,
      // localStorage 原始值检查
      localStorage: {
        hasAddress: !!rawAddress,
        hasSignature: !!rawSignature,
        hasMessage: !!rawMessage,
        hasTimestamp: !!rawTimestamp,
        address: rawAddress ? `${rawAddress.substring(0, 6)}...${rawAddress.substring(rawAddress.length - 4)}` : null,
        messageLength: rawMessage ? rawMessage.length : 0,
        signatureLength: rawSignature ? rawSignature.length : 0,
        timestamp: rawTimestamp
      }
    });
    
    // 如果认证头为空，打印警告
    if (!hasAuth) {
      console.warn('⚠️ 警告：认证头为空！', {
        endpoint,
        localStorage: {
          userAddress: !!rawAddress,
          authSignature: !!rawSignature,
          authMessage: !!rawMessage,
          authTimestamp: !!rawTimestamp
        }
      });
    }
    
    // 清理和验证 headers，确保所有值都是有效的字符串
    const cleanHeaders = {};
    
    // 检查是否为FormData上传（不应该设置Content-Type）
    const isFormDataUpload = options.body instanceof FormData;
    
    // 只在非FormData请求时添加 Content-Type
    if (!isFormDataUpload) {
      cleanHeaders['Content-Type'] = 'application/json';
    }
    
    // 添加认证头（确保值都是字符串且不为空，移除可能导致问题的字符）
    if (hasAuth) {
      if (authHeaders['User-Address'] && typeof authHeaders['User-Address'] === 'string') {
        cleanHeaders['User-Address'] = authHeaders['User-Address'].trim();
      }
      if (authHeaders['Signature'] && typeof authHeaders['Signature'] === 'string') {
        cleanHeaders['Signature'] = authHeaders['Signature'].trim();
      }
      if (authHeaders['Message'] && typeof authHeaders['Message'] === 'string') {
        // Message包含换行符会导致HTTP 400错误
        // 移除所有换行符和回车符，只保留单行文本
        const cleanMessage = authHeaders['Message'].replace(/[\r\n]+/g, ' ').trim();
        cleanHeaders['Message'] = cleanMessage;
      }
      if (authHeaders['Timestamp'] && typeof authHeaders['Timestamp'] === 'string') {
        cleanHeaders['Timestamp'] = authHeaders['Timestamp'].trim();
      }
    }
    
    // 添加其他 headers（过滤掉无效值）
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (value !== null && value !== undefined && typeof value === 'string') {
          cleanHeaders[key] = value.trim();
        }
      }
    }
    
    // 处理 body
    let requestBody = options.body;
    if (requestBody && typeof requestBody !== 'string') {
      try {
        requestBody = JSON.stringify(requestBody);
      } catch (e) {
        console.error('❌ 无法序列化请求体:', e);
        throw new Error(`无法序列化请求体: ${e.message}`);
      }
    }
    
    // 构建 config 对象
    const config = {
      method: options.method || 'GET',
      headers: cleanHeaders,
    };
    
    // 只在有 body 时添加 body
    if (requestBody) {
      config.body = requestBody;
    }
    
    // 添加其他有效的 fetch 选项（如 credentials, mode 等）
    if (options.credentials !== undefined) {
      config.credentials = options.credentials;
    }
    if (options.mode !== undefined) {
      config.mode = options.mode;
    }
    if (options.cache !== undefined) {
      config.cache = options.cache;
    }

    try {
      // 在发送请求前，打印完整的请求配置（始终打印，帮助调试）
      console.log('📤 发送请求:', {
        url,
        urlType: typeof url,
        urlLength: url ? url.length : 0,
        method: options.method || 'GET',
        baseURL: this.baseURL,
        endpoint: endpoint,
        normalizedEndpoint: normalizedEndpoint,
        headers: {
          'Content-Type': config.headers['Content-Type'],
          // 显示认证头（隐藏敏感信息）
          'User-Address': config.headers['User-Address'] ? `${config.headers['User-Address'].substring(0, 6)}...${config.headers['User-Address'].substring(config.headers['User-Address'].length - 4)}` : '❌ 缺失',
          'Signature': config.headers['Signature'] ? `${config.headers['Signature'].substring(0, 10)}...` : '❌ 缺失',
          'Message': config.headers['Message'] ? config.headers['Message'].substring(0, 50) + '...' : '❌ 缺失',
          'Timestamp': config.headers['Timestamp'] || '❌ 缺失',
        },
        allHeadersKeys: Object.keys(config.headers),
        body: config.body ? (typeof config.body === 'string' ? config.body.substring(0, 100) + '...' : config.body) : undefined
      });

      // 再次验证 URL 和 config
      if (!url || typeof url !== 'string') {
        throw new Error(`Invalid URL: ${url} (type: ${typeof url})`);
      }
      
      if (!config || typeof config !== 'object') {
        throw new Error(`Invalid config: ${config}`);
      }

      // 最终验证 config 对象
      console.log('🔍 最终 config 验证:', {
        url: url,
        method: config.method,
        hasHeaders: !!config.headers,
        headersCount: config.headers ? Object.keys(config.headers).length : 0,
        headersKeys: config.headers ? Object.keys(config.headers) : [],
        hasBody: !!config.body,
        bodyType: config.body ? typeof config.body : 'none',
        bodyLength: config.body ? (typeof config.body === 'string' ? config.body.length : 'not string') : 0,
        configKeys: Object.keys(config)
      });
      
      // 验证 headers 中的所有值
      if (config.headers) {
        for (const [key, value] of Object.entries(config.headers)) {
          if (value === null || value === undefined) {
            console.error(`❌ Header "${key}" 的值为 null/undefined`);
            throw new Error(`Invalid header value for "${key}": ${value}`);
          }
          if (typeof value !== 'string') {
            console.error(`❌ Header "${key}" 的值不是字符串:`, typeof value, value);
            throw new Error(`Invalid header type for "${key}": expected string, got ${typeof value}`);
          }
        }
      }
      
      console.log('🌐 准备发送 fetch 请求到:', url);
      console.log('🌐 Config 对象:', JSON.stringify(config, null, 2));
      
      // 尝试逐个验证 fetch 参数
      let response;
      try {
        // 先验证 URL 对象
        const urlObj = new URL(url);
        console.log('✅ URL 对象验证通过:', urlObj.href);
        
        // 创建一个最小化的 config 来测试
        const minimalConfig = {
          method: config.method,
          headers: config.headers,
        };
        if (config.body) {
          minimalConfig.body = config.body;
        }
        
        console.log('🔍 使用最小化 config 测试:', JSON.stringify(minimalConfig, null, 2));
        
        response = await fetch(url, minimalConfig);
      } catch (fetchError) {
        console.error('❌ Fetch 调用失败:', {
          errorName: fetchError.name,
          errorMessage: fetchError.message,
          errorStack: fetchError.stack,
          url: url,
          urlType: typeof url,
          config: config,
          configStringified: JSON.stringify(config),
        });
        
        // 尝试找出具体是哪个值有问题
        if (fetchError.message.includes('Invalid value')) {
          console.error('🔍 诊断 Invalid value 错误:');
          console.error('  - URL:', url, '(type:', typeof url, ')');
          console.error('  - Method:', config.method, '(type:', typeof config.method, ')');
          console.error('  - Headers:', config.headers);
          console.error('  - Body:', config.body, '(type:', typeof config.body, ')');
          
          // 检查 headers 中的每个值
          if (config.headers) {
            for (const [key, value] of Object.entries(config.headers)) {
              if (value === null || value === undefined) {
                console.error(`  ❌ Header "${key}" 是 null/undefined`);
              } else if (typeof value !== 'string') {
                console.error(`  ❌ Header "${key}" 不是字符串:`, typeof value, value);
              } else if (value.includes('\n') || value.includes('\r')) {
                console.error(`  ⚠️ Header "${key}" 包含换行符，可能导致问题`);
              }
            }
          }
        }
        
        throw fetchError;
      }
      
      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = null;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorDetails = errorData;
          
          // 详细打印错误信息
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ API错误响应:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData.error,
              message: errorData.message,
              fullError: errorData
            });
          }
        } catch (e) {
          console.warn('无法解析服务器错误响应:', e);
          // 无法解析JSON错误，使用默认错误信息
        }
        
        // 创建错误对象，包含更多信息
        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorDetails;
        error.response = response;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 网络错误处理 - 对于关键操作（如购买），不要返回模拟数据
      const isCriticalOperation = endpoint.includes('/buy') || 
                                   endpoint.includes('/transfer') || 
                                   endpoint.includes('/mint') ||
                                   endpoint.includes('/creations');
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ 网络连接失败:', {
          url,
          endpoint,
          error: error.message,
          isCriticalOperation,
          suggestion: isCriticalOperation 
            ? '这是关键操作，请检查后端是否运行在 http://localhost:8080' 
            : '返回模拟数据'
        });
        
        // 对于关键操作，抛出错误而不是返回模拟数据
        if (isCriticalOperation) {
          throw new Error(`网络连接失败：无法连接到后端服务器。请确保后端运行在 http://localhost:8080。错误详情：${error.message}`);
        }
        
        // 对于非关键操作，返回模拟数据以避免应用崩溃
        return this.getMockResponse(endpoint);
      }
      
      console.error('❌ API请求错误:', {
        url,
        endpoint,
        error: error.message,
        errorName: error.name,
        errorStack: error.stack
      });
      throw error;
    }
  }

  // 获取模拟响应数据
  getMockResponse(endpoint) {
    if (endpoint.includes('/users/login')) {
      return {
        success: true,
        user: { points: 1000, username: 'Demo User' },
        token: 'demo-token'
      };
    }
    
    if (endpoint.includes('/creations')) {
      return [];
    }
    
    if (endpoint.includes('/points/balance')) {
      return { balance: 1000 };
    }
    
    if (endpoint.includes('/ai/models')) {
      return [
        { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image' },
        { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
        { id: 'gpt-4', name: 'GPT-4', type: 'text' }
      ];
    }
    
    return { success: true };
  }

  // GET请求
  async get(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'GET',
      headers,
    });
  }

  // POST请求
  async post(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  // PUT请求
  async put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  // DELETE请求
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // 附加认证头
  getAuthHeaders() {
    try {
      const address = localStorage.getItem('userAddress');
      const signature = localStorage.getItem('authSignature');
      const message = localStorage.getItem('authMessage');
      const timestamp = localStorage.getItem('authTimestamp');

      // 详细检查每个值
      const hasAddress = !!address && address.trim() !== '';
      const hasSignature = !!signature && signature.trim() !== '';
      const hasMessage = !!message && message.trim() !== '';
      const hasTimestamp = !!timestamp && timestamp.trim() !== '';

      console.log('🔑 getAuthHeaders 检查:', {
        hasAddress,
        hasSignature,
        hasMessage,
        hasTimestamp,
        addressValue: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null,
        addressLength: address ? address.length : 0,
        signatureLength: signature ? signature.length : 0,
        messageLength: message ? message.length : 0,
        timestampValue: timestamp,
        allPresent: hasAddress && hasSignature && hasMessage && hasTimestamp
      });

      if (hasAddress && hasSignature && hasMessage && hasTimestamp) {
        const headers = {
          'User-Address': address.trim(),
          'Signature': signature.trim(),
          'Message': message.trim(),
          'Timestamp': timestamp.trim()
        };
        
        console.log('✅ 认证头已准备:', {
          hasUserAddress: !!headers['User-Address'],
          hasSignature: !!headers['Signature'],
          hasMessage: !!headers['Message'],
          hasTimestamp: !!headers['Timestamp'],
          address: headers['User-Address'] ? `${headers['User-Address'].substring(0, 6)}...${headers['User-Address'].substring(headers['User-Address'].length - 4)}` : null,
          messageLength: headers['Message'] ? headers['Message'].length : 0,
          signatureLength: headers['Signature'] ? headers['Signature'].length : 0,
          timestamp: headers['Timestamp'],
        });
        
        return headers;
      } else {
        // 详细说明缺少哪些认证信息
        console.warn('⚠️ 认证信息不完整:', {
          hasAddress,
          hasSignature,
          hasMessage,
          hasTimestamp,
          missing: [
            !hasAddress && 'address',
            !hasSignature && 'signature',
            !hasMessage && 'message',
            !hasTimestamp && 'timestamp'
          ].filter(Boolean)
        });
      }
    } catch (error) {
      console.error('❌ 无法读取本地认证信息:', error);
    }
    console.warn('⚠️ getAuthHeaders 返回空对象');
    return {};
  }

  // 用户相关API
  async getUser(address) {
    return this.get(`/v1/users/${address}`);
  }

  async createUser(userData) {
    return this.post('/v1/users/register', userData);
  }

  async updateUser(address, userData) {
    return this.put(`/v1/users/${address}`, userData);
  }

  async loginUser(userData) {
    return this.post('/v1/users/login', userData);
  }

  // 收藏功能API
  async toggleFavorite(userAddress, creationId) {
    return this.post(`/v1/creations/${creationId}/favorite`);
  }

  async getFavorites(userAddress) {
    return this.get(`/v1/profile/favorites`);
  }

  // 作品相关API
  async getCreations() {
    return this.get('/v1/public/creations');
  }

  async getCreationsByCreator(creatorAddress) {
    if (!creatorAddress) {
      throw new Error('creatorAddress is required');
    }
    const normalizedAddress = creatorAddress.trim();
    return this.get(`/v1/public/creations?creator=${encodeURIComponent(normalizedAddress)}`);
  }

  async getCreation(id) {
    return this.get(`/v1/public/creations/${id}`);
  }

  async createCreation(creationData) {
    return this.post('/v1/creations', creationData);
  }

  async updateCreation(id, creationData) {
    return this.put(`/v1/creations/${id}`, creationData);
  }

  async updateCreationStatus(id, statusData) {
    return this.put(`/v1/creations/${id}/status`, statusData);
  }

  async deleteCreation(id) {
    return this.delete(`/v1/creations/${id}`);
  }

  async mintNFT(id) {
    return this.post(`/v1/creations/${id}/mint`);
  }

  // 市场相关API
  async getMarketplaceListings() {
    return this.get('/v1/public/marketplace/listings');
  }

  async createListing(listingData) {
    return this.post('/v1/marketplace/list', listingData);
  }

  async buyItem(itemData) {
    return this.post('/v1/marketplace/buy', itemData);
  }

  async getMyLicenses() {
    return this.get('/v1/marketplace/licenses');
  }

  // 交易相关API
  async getTransactions(userAddress) {
    return this.get(`/v1/public/transactions?user=${userAddress}`);
  }

  async getTransaction(hash) {
    return this.get(`/v1/public/transactions/${hash}`);
  }

  async getTransactionStats() {
    return this.get('/v1/public/stats/transactions');
  }

  async getGasStats() {
    return this.get('/v1/public/stats/gas');
  }

  // 积分相关API
  async getPointsBalance(address) {
    return this.get(`/v1/points/balance/${address}`);
  }

  async transferPoints(transferData) {
    return this.post('/v1/points/transfer', transferData);
  }

  async addPoints(addData) {
    return this.post('/v1/points/add', addData);
  }

  async getPointsHistory(address) {
    return this.get(`/v1/points/history/${address}`);
  }

  // AI相关API
  async getAIModels() {
    return this.get('/v1/ai/models');
  }

  async generateAI(generationData) {
    return this.post('/v1/ai/generate', generationData);
  }

  async verifyZKProof(hash) {
    return this.get(`/v1/ai/verify/${hash}`);
  }

  async getIPFSContent(hash) {
    return this.get(`/v1/ai/ipfs/${hash}`);
  }
}

  // 创建单例实例
  const apiService = new ApiService();

  export default apiService;
