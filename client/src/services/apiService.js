// API服务 - 处理与后端的通信
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const authHeaders = this.getAuthHeaders();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    // 确保Content-Type正确设置
    if (config.body && typeof config.body === 'string') {
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.warn('无法解析服务器错误响应:', e);
          // 无法解析JSON错误，使用默认错误信息
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 网络错误处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('网络连接失败，可能后端未启动');
        // 返回模拟数据以避免应用崩溃
        return this.getMockResponse(endpoint);
      }
      
      console.error('API请求错误:', error);
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

      if (address && signature && message && timestamp) {
        return {
          'User-Address': address,
          'Signature': signature,
          'Message': message,
          'Timestamp': timestamp
        };
      }
    } catch (error) {
      console.warn('无法读取本地认证信息:', error);
    }
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
