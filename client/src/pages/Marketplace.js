import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  IconButton,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Visibility
} from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import { toast } from 'react-hot-toast';
import { mockCreations } from '../data/mock/creations';
import apiService from '../services/apiService';

const Marketplace = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { connected, toggleFavorite, isFavorite, account, points, refreshPoints, updatePoints, refreshAuthForCriticalOperation } = useWeb3();
  const isDark = mode === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [purchasing, setPurchasing] = useState({});
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载创作数据
  useEffect(() => {
    const loadCreations = async () => {
      try {
        setLoading(true);
        // ????????????????????
        const marketplaceResp = await apiService.getMarketplaceListings();
        if (marketplaceResp && Array.isArray(marketplaceResp.listings) && marketplaceResp.listings.length > 0) {
          const formatted = marketplaceResp.listings.map((item) => {
            const creation = item.creation || item.listing || item;
            const listing = item.listing || {};
            
            // 处理图片URL，如果是相对路径则加上后端域名
            let imageUrl = creation.image_url || creation.ImageURL || creation.image || '';
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `http://localhost:8080${imageUrl}`;
            }
            
            return {
              id: creation.id || creation.ID || String(creation.token_id || creation.TokenID || ''),
              creation_id: creation.id || creation.ID,
              token_id: creation.token_id || creation.TokenID,
              title: creation.title || creation.Title || '?????',
              description: creation.description || creation.Description || '',
              image: imageUrl,
              creator: creation.creator_address || creation.CreatorAddress || '',
              creatorName: creation.creator?.name || creation.Creator?.Name || '?????',
              price: listing.price ?? creation.price_in_points ?? creation.PriceInPoints ?? 0,
              price_in_points: listing.price ?? creation.price_in_points ?? creation.PriceInPoints ?? 0,
              creationType: creation.creation_type || creation.CreationType || 'image',
              likes: creation.likes || 0,
              views: creation.views || 0,
              tags: creation.tags || [],
              createdAt: creation.created_at || creation.CreatedAt || new Date().toISOString(),
            };
          });
          setCreations(formatted);
          return;
        }

        const response = await apiService.getCreations();
        if (response && response.creations && Array.isArray(response.creations)) {
          const formattedCreations = response.creations.map((creation) => {
            // 处理图片URL，如果是相对路径则加上后端域名
            let imageUrl = creation.image_url || creation.ImageURL || creation.image || '';
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `http://localhost:8080${imageUrl}`;
            }
            
            return {
              id: creation.id || creation.ID || String(creation.token_id || creation.TokenID || ''),
              creation_id: creation.id || creation.ID,
              token_id: creation.token_id || creation.TokenID,
              title: creation.title || creation.Title || '?????',
              description: creation.description || creation.Description || '',
              image: imageUrl,
              creator: creation.creator_address || creation.CreatorAddress || '',
              creatorName: creation.creator?.name || creation.Creator?.Name || '?????',
              price: creation.price_in_points || creation.PriceInPoints || 0,
              price_in_points: creation.price_in_points || creation.PriceInPoints || 0,
              creationType: creation.creation_type || creation.CreationType || 'image',
              likes: creation.likes || 0,
              views: creation.views || 0,
              tags: creation.tags || [],
              createdAt: creation.created_at || creation.CreatedAt || new Date().toISOString(),
            };
          });
          setCreations(formattedCreations);
        } else {
          console.warn('????????????mock??');
          setCreations(mockCreations);
        }
      } catch (error) {
        console.error('????????:', error);
        setCreations(mockCreations);
      } finally {
        setLoading(false);
      }
    };

    loadCreations();
  }, []);

  // 处理收藏点击
  const handleFavoriteClick = (e, creationId) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (!connected) {
        toast.error('请先连接钱包');
        return;
      }

      const result = toggleFavorite(creationId);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 处理查看详情
  const handleViewDetail = (e, creation) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/creation/${creation.id}`);
  };

  // 🔒 安全修复：改进价格提取逻辑，支持多种格式并优先使用后端字段
  // 优先使用后端的 price_in_points 字段，如果不存在则从字符串中提取
  const extractPrice = (priceData) => {
    // 如果已经是数字，直接返回
    if (typeof priceData === 'number') {
      return Math.max(0, Math.floor(priceData));
    }
    
    // 如果是对象，优先使用 price_in_points 字段
    if (priceData && typeof priceData === 'object') {
      if (typeof priceData.price_in_points === 'number') {
        return Math.max(0, Math.floor(priceData.price_in_points));
      }
      if (typeof priceData.priceInPoints === 'number') {
        return Math.max(0, Math.floor(priceData.priceInPoints));
      }
      if (typeof priceData.price === 'number') {
        return Math.max(0, Math.floor(priceData.price));
      }
    }
    
    // 如果是字符串，尝试提取数字
    if (typeof priceData === 'string') {
      // 先尝试直接解析为数字
      const directParse = parseInt(priceData, 10);
      if (!isNaN(directParse) && directParse >= 0) {
        return directParse;
      }
      
      // 如果直接解析失败，使用正则提取第一个完整的数字
      // 改进：匹配完整的数字序列，而不是任意数字
      const match = priceData.match(/\b(\d+)\b/);
      if (match) {
        const extracted = parseInt(match[1], 10);
        return isNaN(extracted) ? 0 : Math.max(0, extracted);
      }
    }
    
    // 默认返回0
    console.warn('⚠️ extractPrice: 无法从数据中提取价格:', priceData);
    return 0;
  };

  // 检查用户是否已认证
  const checkAuth = () => {
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    if (!address || !signature || !message || !timestamp) {
      return false;
    }
    
    // 检查时间戳是否过期（5分钟窗口）
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = now - timestampNum;
    
    // 如果时间戳超过5分钟，认为已过期
    if (timeDiff > 300) {
      console.warn('认证时间戳已过期，需要重新认证');
      return false;
    }
    
    return true;
  };

  // 处理购买点击
  const handlePurchase = async (e, item) => {
    e.stopPropagation();
    e.preventDefault();

    // 检查钱包连接
    if (!connected || !account) {
      toast.error('请先连接钱包');
      return;
    }

    // 检查用户是否已认证
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    // 检查地址是否匹配当前连接的账户
    if (address && account && address.toLowerCase() !== account.toLowerCase()) {
      console.warn('⚠️ 存储的地址与当前连接地址不匹配:', {
        storedAddress: address,
        currentAccount: account
      });
      // 清除不匹配的认证信息
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('账户已切换，请重新完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 调试：打印认证信息（不包含敏感信息）
    const timestampNum = timestamp ? parseInt(timestamp, 10) : null;
    const now = Math.floor(Date.now() / 1000);
    const timestampAge = timestampNum ? now - timestampNum : null;
    
    const authInfo = {
      hasAddress: !!address,
      hasSignature: !!signature,
      hasMessage: !!message,
      hasTimestamp: !!timestamp,
      address: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null,
      currentAccount: account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : null,
      addressMatches: address && account && address.toLowerCase() === account.toLowerCase(),
      timestamp: timestampNum ? new Date(timestampNum * 1000).toLocaleString() : null,
      timestampAge: timestampAge,
      timestampAgeSeconds: timestampAge,
      isTimestampValid: timestampAge !== null && timestampAge >= 0 && timestampAge <= 300, // 5分钟窗口
      messagePreview: message ? message.substring(0, 50) + '...' : null,
      signaturePreview: signature ? `${signature.substring(0, 10)}...${signature.substring(signature.length - 10)}` : null,
    };
    console.log('🔐 认证信息检查:', authInfo);
    
    // 检查认证信息是否完整
    if (!address || !signature || !message || !timestamp) {
      console.error('❌ 认证信息不完整:', {
        hasAddress: !!address,
        hasSignature: !!signature,
        hasMessage: !!message,
        hasTimestamp: !!timestamp,
      });
      toast.error('认证信息不完整，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 检查时间戳是否过期
    if (timestampAge === null || timestampAge < 0 || timestampAge > 300) {
      console.warn('⚠️ 认证时间戳无效或已过期:', {
        timestampAge,
        timestamp: timestampNum,
        now,
        isValid: timestampAge !== null && timestampAge >= 0 && timestampAge <= 300
      });
      // 清除过期的认证信息
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('认证已过期，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    // 🔒 安全修复：优先使用后端返回的 price_in_points 字段
    // 如果不存在，则从 price 字段中提取（兼容旧格式）
    let price = 0;
    if (item.price_in_points !== undefined && typeof item.price_in_points === 'number') {
      price = Math.max(0, Math.floor(item.price_in_points));
    } else if (item.priceInPoints !== undefined && typeof item.priceInPoints === 'number') {
      price = Math.max(0, Math.floor(item.priceInPoints));
    } else {
      price = extractPrice(item.price);
    }
    
    if (price <= 0) {
      toast.error('无效的价格');
      return;
    }

    // 检查积分余额
    if (points < price) {
      toast.error(`积分不足！需要 ${price} 积分，当前余额 ${points} 积分`);
      return;
    }

    // 检查是否正在购买
    if (purchasing[item.id]) {
      return;
    }

    // 再次验证认证头（在发送请求前）
    const authHeaders = apiService.getAuthHeaders();
    
    // 详细检查 localStorage 中的所有认证相关数据
    const allAuthData = {
      userAddress: localStorage.getItem('userAddress'),
      authSignature: localStorage.getItem('authSignature'),
      authMessage: localStorage.getItem('authMessage'),
      authTimestamp: localStorage.getItem('authTimestamp'),
      authToken: localStorage.getItem('authToken'),
    };
    
    console.log('🔍 购买前认证头验证:', {
      hasAuthHeaders: Object.keys(authHeaders).length > 0,
      headersCount: Object.keys(authHeaders).length,
      hasUserAddress: !!authHeaders['User-Address'],
      hasSignature: !!authHeaders['Signature'],
      hasMessage: !!authHeaders['Message'],
      hasTimestamp: !!authHeaders['Timestamp'],
      localStorage: {
        hasUserAddress: !!allAuthData.userAddress,
        hasAuthSignature: !!allAuthData.authSignature,
        hasAuthMessage: !!allAuthData.authMessage,
        hasAuthTimestamp: !!allAuthData.authTimestamp,
        hasAuthToken: !!allAuthData.authToken,
        userAddress: allAuthData.userAddress ? `${allAuthData.userAddress.substring(0, 6)}...${allAuthData.userAddress.substring(allAuthData.userAddress.length - 4)}` : null,
        authMessageLength: allAuthData.authMessage ? allAuthData.authMessage.length : 0,
        authSignatureLength: allAuthData.authSignature ? allAuthData.authSignature.length : 0,
        authTimestamp: allAuthData.authTimestamp,
      }
    });
    
    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ 认证头为空，无法发送请求');
      console.error('❌ localStorage 中的认证数据:', allAuthData);
      toast.error('认证信息丢失，请刷新页面后重新连接钱包并完成签名认证', {
        duration: 5000,
      });
      setPurchasing(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
      return;
    }

    // 设置购买状态
    setPurchasing(prev => ({ ...prev, [item.id]: true }));

    try {
      // 阶段2：在关键操作前尝试刷新认证信息（可选）
      // 这样可以确保每个关键操作都有唯一的认证信息，通过 CriticalOperationMiddleware 的防重放检查
      // 如果刷新失败，继续使用旧的认证信息（可能会被 CriticalOperationMiddleware 拒绝）
      if (refreshAuthForCriticalOperation) {
        console.log('🔄 尝试为关键操作刷新认证信息...');
        const refreshSuccess = await refreshAuthForCriticalOperation();
        if (refreshSuccess) {
          console.log('✅ 认证信息已刷新，使用新的时间戳');
        } else {
          console.warn('⚠️ 认证信息刷新失败，使用旧的认证信息（可能会被拒绝）');
        }
      }

      // 调用购买API
      // 对于mock数据，只使用token_id；对于后端数据，优先使用creation_id
      const buyItemData = {
        token_id: parseInt(item.id, 10),
        price: price
      };
      
      // 只有当item有有效的creation_id字段时才添加（来自后端的数据）
      // 对于mock数据，不发送creation_id，让后端通过token_id查找
      if (item.creation_id !== undefined && item.creation_id !== null && item.creation_id !== '') {
        const creationId = parseInt(item.creation_id, 10);
        if (!isNaN(creationId) && creationId > 0) {
          buyItemData.creation_id = creationId;
        }
      }
      
      const response = await apiService.buyItem(buyItemData);

      toast.success(`购买成功！已花费 ${price} 积分购买《${item.title}》`);
      
      // 🔒 安全修复：总是从后端刷新积分，不依赖响应中的 new_balance（防止响应被篡改）
      if (refreshPoints) {
        console.log('🔄 从后端刷新积分...');
        await refreshPoints();
      } else if (response && response.new_balance !== undefined && updatePoints) {
        // 后备方案：如果 refreshPoints 不可用，使用响应中的值
        console.log('💰 使用响应中的积分（后备方案）:', response.new_balance);
        updatePoints(Number(response.new_balance));
      } else {
        console.warn('⚠️ 无法更新积分：refreshPoints 和 updatePoints 都不可用');
      }

      // 触发全局事件，通知“我的授权”等页面刷新
      window.dispatchEvent(new CustomEvent('licensePurchased', {
        detail: {
          tokenId: parseInt(item.id, 10),
          licenseId: response?.license_id
        }
      }));

      // 可以在这里更新列表或导航到详情页
      // navigate(`/creation/${item.id}`);
    } catch (error) {
      console.error('❌ 购买失败:', error);
      
      // 阶段2：如果是因为时间戳重复被拒绝，提示用户重新签名
      const replayCheckMessage = error.message || '';
      const replayCheckDetails = error.details || {};
      const isReplayError = replayCheckMessage.includes('Timestamp already used') || 
                           replayCheckMessage.includes('Replay detected') ||
                           replayCheckDetails.message?.includes('Timestamp already used') ||
                           replayCheckDetails.message?.includes('Replay detected');
      
      if (isReplayError) {
        console.warn('⚠️ 检测到重放错误，建议用户重新签名');
        toast.error('检测到重复操作，请重新签名后重试', {
          duration: 5000,
        });
      } else {
        console.error('📋 错误详情:', {
          message: error.message,
          status: error.status,
          details: error.details,
        });
        
        // 显示错误消息
        const displayMessage = error.details?.message || error.message || '购买失败，请重试';
        toast.error(displayMessage);
      }
      
      // 打印完整的错误对象以便调试
      if (error.details) {
        console.error('🔍 后端错误详情:', JSON.stringify(error.details, null, 2));
      }
      
      // 改进错误处理
      let errorMessage = '购买失败，请稍后重试';
      
      // 检查错误详情
      const errorDetails = error.details || {};
      const backendMessage = errorDetails.message || errorDetails.error || '';
      
      if (error.status === 401 || error.message.includes('Unauthorized')) {
        // 清除过期的认证信息
        localStorage.removeItem('authSignature');
        localStorage.removeItem('authMessage');
        localStorage.removeItem('authTimestamp');
        
        if (backendMessage.includes('Missing required authentication headers')) {
          errorMessage = '缺少认证信息，请刷新页面后重新连接钱包并完成签名认证';
        } else if (backendMessage.includes('Invalid signature')) {
          errorMessage = '签名验证失败，请刷新页面后重新连接钱包';
        } else if (backendMessage.includes('Invalid timestamp')) {
          errorMessage = '认证时间戳无效，请刷新页面后重新连接钱包';
        } else if (backendMessage.includes('Replay detected')) {
          errorMessage = '检测到重放攻击，请刷新页面后重新连接钱包';
        } else {
          errorMessage = '认证失败，请刷新页面后重新连接钱包并完成签名认证';
        }
      } else if (error.message && error.message.includes('Invalid timestamp')) {
        errorMessage = '认证时间戳无效，请刷新页面后重新连接钱包';
      } else if (error.message && error.message.includes('Replay detected')) {
        errorMessage = '检测到重放攻击，请刷新页面后重新连接钱包';
      } else if (error.message && error.message.includes('Invalid signature')) {
        errorMessage = '签名验证失败，请刷新页面后重新连接钱包';
      } else if (backendMessage) {
        errorMessage = backendMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      // 清除购买状态
      setPurchasing(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    }
  };

  // 去重并过滤数据
  const filtered = activeTab === 'all' 
    ? creations.filter((item, index, self) => 
        index === self.findIndex(creation => creation.id === item.id)
      )
    : creations.filter((item, index, self) => 
        (item.creationType === activeTab || item.type === activeTab) && index === self.findIndex(creation => creation.id === item.id)
      );

  // Market statistics
  const marketStats = [
    { 
      title: '总交易额', 
      value: '∞ 积分', 
      description: '无限交易可能'
    },
    { 
      title: '活跃用户', 
      value: '∞', 
      description: '全球用户参与'
    },
    { 
      title: '成交率', 
      value: '100%', 
      description: '智能匹配系统'
    }
  ];

  return (
    <Box>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{
              fontWeight: 700,
              mb: 2,
              color: isDark ? 'white' : 'text.primary'
            }}
          >
            创作市场
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            发现独特的数字创作，支持创作者的原创作品
          </Typography>
        </Box>

        {/* Market Statistics */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {marketStats.map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      color: isDark ? 'white' : 'text.primary'
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: isDark ? 'rgba(255,255,255,0.8)' : 'text.primary',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary'
                    }}
                  >
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Category Tabs */}
        <Card sx={{ 
          mb: 4, 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, value) => setActiveTab(value)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                py: 2,
                '&.Mui-selected': {
                  color: isDark ? 'white' : 'text.primary',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'primary.main',
                height: 2
              }
            }}
          >
            <Tab label="全部作品" value="all" />
            <Tab label="图像创作" value="图像" />
            <Tab label="音频作品" value="音频" />
            <Tab label="3D模型" value="3D模型" />
          </Tabs>
        </Card>

        {/* Creation Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
              暂无创作作品
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary', mt: 1 }}>
              成为第一个发布作品的创作者吧！
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((item, index) => (
            <Grid 
              item 
              key={`${item.id}-${index}`} 
              xs={12} 
              sm={6} 
              md={4}
              sx={{ 
                display: 'flex'
              }}
            >
              <Card
                onClick={() => navigate(`/creation/${item.id}`)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark 
                      ? '0 8px 24px rgba(0,0,0,0.3)' 
                      : '0 8px 24px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {/* 固定纵横比的图片容器 */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '70%', // 10:7 比例
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'
                  }}
                >
                  <Box
                    component="img"
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
                    }}
                  />
                </Box>
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: 3
                }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: isDark ? 'white' : 'text.primary',
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      mb: 2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      flexGrow: 1
                    }}
                  >
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      size="small"
                      label={item.type}
                      variant="outlined"
                      sx={{
                        color: isDark ? 'rgba(255,255,255,0.8)' : 'text.primary',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        fontSize: '0.75rem'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      创作者: {item.creator}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: isDark ? 'white' : 'text.primary',
                        fontWeight: 600
                      }}
                    >
                      {item.price}
                    </Typography>
                    <Stack 
                      direction="row" 
                      spacing={0.5} 
                      alignItems="center"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ position: 'relative', zIndex: 10 }}
                    >
                      <IconButton 
                        size="small" 
                        sx={{ 
                          color: isFavorite(item.id) ? '#ff6b6b' : (isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary'),
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: isFavorite(item.id) ? '#ff5252' : '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                        onClick={(e) => handleFavoriteClick(e, item.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {isFavorite(item.id) ? (
                          <Favorite fontSize="small" />
                        ) : (
                          <FavoriteBorder fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'rgba(25, 118, 210, 0.1)'
                          }
                        }}
                        onClick={(e) => handleViewDetail(e, item)}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="查看详情"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => handlePurchase(e, item)}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={purchasing[item.id]}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 500,
                          px: 2,
                          ml: 0.5,
                          opacity: purchasing[item.id] ? 0.6 : 1
                        }}
                      >
                        {purchasing[item.id] ? '购买中...' : '立即购买'}
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}
    </Box>
  );
};

export default Marketplace;
