// 收藏服务
class FavoriteService {
  constructor() {
    this.favorites = this.loadFavorites();
  }

  // 从localStorage加载收藏数据
  loadFavorites() {
    try {
      const stored = localStorage.getItem('creatorchain_favorites');
      const data = stored ? JSON.parse(stored) : {};
      
      // 清理重复和无效数据，并确保所有ID都是字符串
      Object.keys(data).forEach(userAddress => {
        if (Array.isArray(data[userAddress])) {
          // 转换为字符串，去重，过滤无效值
          data[userAddress] = [...new Set(data[userAddress].map(id => String(id)))].filter(id => id !== 'null' && id !== 'undefined' && id !== '');
        }
      });
      
      return data;
    } catch (error) {
      console.error('加载收藏数据失败:', error);
      return {};
    }
  }

  // 保存收藏数据到localStorage
  saveFavorites() {
    try {
      // 清理重复数据和无效数据，确保所有ID都是字符串
      Object.keys(this.favorites).forEach(userAddress => {
        // 转换为字符串，去重并过滤无效值
        this.favorites[userAddress] = [...new Set(this.favorites[userAddress].map(id => String(id)))].filter(id => id !== 'null' && id !== 'undefined' && id !== '');
      });
      
      localStorage.setItem('creatorchain_favorites', JSON.stringify(this.favorites));
      // 触发自定义事件通知页面更新
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    } catch (error) {
      console.error('保存收藏数据失败:', error);
    }
  }

  // 检查用户是否收藏了某个作品
  isFavorite(userAddress, creationId) {
    if (!userAddress) return false;
    const userFavorites = this.favorites[userAddress] || [];
    // 确保ID类型匹配
    return userFavorites.some(id => String(id) === String(creationId));
  }

  // 切换收藏状态
  toggleFavorite(userAddress, creationId) {
    if (!userAddress) {
      throw new Error('请先连接钱包');
    }

    if (!this.favorites[userAddress]) {
      this.favorites[userAddress] = [];
    }

    const userFavorites = this.favorites[userAddress];
    // 确保ID类型匹配 - 查找时进行字符串比较
    const index = userFavorites.findIndex(id => String(id) === String(creationId));

    if (index > -1) {
      // 取消收藏
      userFavorites.splice(index, 1);
      this.saveFavorites();
      return { isFavorite: false, message: '已取消收藏' };
    } else {
      // 添加收藏 - 始终存储为字符串以保持一致性
      userFavorites.push(String(creationId));
      this.saveFavorites();
      return { isFavorite: true, message: '已添加到我的收藏' };
    }
  }

  // 获取用户的所有收藏
  getUserFavorites(userAddress) {
    if (!userAddress) return [];
    return this.favorites[userAddress] || [];
  }

  // 获取收藏数量
  getFavoriteCount(userAddress) {
    if (!userAddress) {
      return 0;
    }
    
    // 强制从localStorage重新读取最新数据
    this.favorites = this.loadFavorites();
    
    const userFavorites = this.favorites[userAddress];
    if (!Array.isArray(userFavorites) || userFavorites.length === 0) {
      return 0;
    }
    
    // 过滤掉null、undefined和空字符串
    const validFavorites = userFavorites.filter(id => id != null && id !== '' && id !== undefined);
    const count = validFavorites.length;
    
    
    return count;
  }
}

// 创建单例实例
const favoriteService = new FavoriteService();

// 一次性清理重复收藏数据
favoriteService.cleanupDuplicates = function() {
  try {
    const stored = localStorage.getItem('creatorchain_favorites');
    if (stored) {
      const data = JSON.parse(stored);
      let cleaned = false;
      
      Object.keys(data).forEach(userAddress => {
        if (Array.isArray(data[userAddress])) {
          const originalLength = data[userAddress].length;
          data[userAddress] = [...new Set(data[userAddress].map(id => String(id)))].filter(id => id !== 'null' && id !== 'undefined' && id !== '');
          if (data[userAddress].length !== originalLength) {
            cleaned = true;
          }
        }
      });
      
      if (cleaned) {
        localStorage.setItem('creatorchain_favorites', JSON.stringify(data));
        this.favorites = data;
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      }
    }
  } catch (error) {
    console.error('清理收藏数据失败:', error);
  }
};

// 清空指定用户的收藏数据
favoriteService.clearUserFavorites = function(userAddress) {
  if (!userAddress) return;
  
  try {
    this.favorites[userAddress] = [];
    this.saveFavorites();
  } catch (error) {
    console.error('清空收藏数据失败:', error);
  }
};

// 完全重置收藏数据（用于调试）
favoriteService.resetAllFavorites = function() {
  try {
    localStorage.removeItem('creatorchain_favorites');
    this.favorites = {};
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  } catch (error) {
    console.error('重置收藏数据失败:', error);
  }
};

// 启动时自动清理 - 改为同步执行
favoriteService.cleanupDuplicates();

export default favoriteService;
