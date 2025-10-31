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
        // const profile = await apiService.getUserProfile(targetAddress);
        // const userCreations = await apiService.getUserCreations(targetAddress);
        // setProfileData(profile);
        // setCreations(userCreations);
        
        // Mock data for now - 企业级安全实现
        const sanitizedAddress = sanitizeInput(targetAddress);
        setProfileData({ 
          address: sanitizedAddress, 
          bio: 'A passionate digital artist and creator.', 
          username: `Creator-${sanitizedAddress.slice(0, 6)}` 
        });
        setCreations([
          { id: 1, title: "AI生成艺术作品", contentHash: "Qm...", creator: targetAddress },
          { id: 2, title: "数字音乐创作", contentHash: "Qm...", creator: targetAddress },
        ]);

      } catch (err) {
        setError('Failed to load profile data.');
        // 错误处理
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
