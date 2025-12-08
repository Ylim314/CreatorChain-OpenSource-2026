import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { useWeb3 } from '../context/Web3ContextFixed';
import CreationCard from '../components/CreationCard';
import PageLayout from '../components/ui/PageLayout';
import apiService from '../services/apiService';

// 企业级XSS防护函数
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // 移除HTML标签
    .replace(/javascript:/gi, '') // 移除javascript协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .replace(/script/gi, '') // 移除script标签
    .replace(/iframe/gi, '') // 移除iframe标签
    .replace(/object/gi, '') // 移除object标签
    .replace(/embed/gi, '') // 移除embed标签
    .replace(/link/gi, '') // 移除link标签
    .replace(/meta/gi, '') // 移除meta标签
    .trim()
    .substring(0, 100); // 限制长度
};

const Profile = () => {
  const { address } = useParams();
  const { account } = useWeb3();
  
  const [profileData, setProfileData] = useState(null);
  const [creations, setCreations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const targetAddress = address || account;

  useEffect(() => {
    const loadProfileData = async () => {
      if (!targetAddress) return;
      
      setIsLoading(true);
      setError('');
      try {
        // 从API获取真实数据
        const sanitizedAddress = sanitizeInput(targetAddress);
        
        // 设置用户基本信息
        setProfileData({ 
          address: sanitizedAddress, 
          bio: 'A passionate digital artist and creator.', 
          username: `Creator-${sanitizedAddress.slice(0, 6)}` 
        });
        
        // 从API获取该用户的作品列表
        try {
          const response = await apiService.getCreationsByCreator(sanitizedAddress);
          if (response && response.creations && Array.isArray(response.creations)) {
            const formattedCreations = response.creations.map((creation) => {
              // 处理图片URL
              let imageUrl = creation.image_url || creation.ImageURL || creation.image || '';
              if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = `http://localhost:8080${imageUrl}`;
              }
              
              return {
                id: creation.id || creation.ID,
                title: creation.title || creation.Title,
                description: creation.description || creation.Description,
                image: imageUrl,
                contentHash: creation.content_hash || creation.ContentHash,
                creator: creation.creator_address || creation.CreatorAddress,
                price: creation.price_in_points || creation.PriceInPoints || 0,
                createdAt: creation.created_at || creation.CreatedAt,
              };
            });
            setCreations(formattedCreations);
          } else {
            setCreations([]);
          }
        } catch (apiError) {
          console.error('获取作品列表失败:', apiError);
          setCreations([]);
        }

      } catch (err) {
        setError('Failed to load profile data.');
        console.error('加载个人资料失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [targetAddress]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (tabValue !== 1 || !account) return;
      
      setIsLoading(true);
      try {
        const favs = await apiService.getFavorites(account);
        setFavorites(favs.favorites || []);
      } catch (err) {
        setError('Failed to load favorites.');
        // 错误处理
        // 如果API失败，使用模拟数据
        setFavorites([
          { id: 3, title: "收藏的作品1", contentHash: "Qm...", creator: "0x123..." },
          { id: 4, title: "收藏的作品2", contentHash: "Qm...", creator: "0x456..." },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [tabValue, account]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#4ECDC4' }} size={60} />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      );
    }

    switch (tabValue) {
      case 0:
        return (
          <Grid container spacing={4}>
            {creations.length > 0 ? (
              creations.map((creation) => (
                <Grid item key={creation.id} xs={12} sm={6} md={4}>
                  <CreationCard creation={creation} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
                  暂无创作作品
                </Typography>
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={4}>
            {favorites.length > 0 ? (
              favorites.map((creation) => (
                <Grid item key={creation.id} xs={12} sm={6} md={4}>
                  <CreationCard creation={creation} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
                  暂无收藏作品
                </Typography>
              </Grid>
            )}
          </Grid>
        );
      default:
        return null;
    }
  };

  if (!account && !address) {
    return (
      <PageLayout backgroundType="gradient">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
            请连接钱包查看个人资料
          </Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundType="gradient">
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 2,
              background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)'
            }} 
          >
            {profileData?.username?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
              {profileData?.username || 'Unnamed Creator'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {targetAddress}
            </Typography>
            {profileData?.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {profileData.bio}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="profile tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4ECDC4',
            },
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#4ECDC4',
              },
            },
          }}
        >
          <Tab label="我的创作" />
          {account === targetAddress && <Tab label="我的收藏" />}
        </Tabs>

        <Box sx={{ mt: 4 }}>
          {renderContent()}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default Profile;
