import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  CardMedia,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Alert
} from '@mui/material';
import { Favorite, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3ContextFixed';
import { mockCreations } from '../data/mock/creations';
import PageLayout from '../components/ui/PageLayout';
import { GlassCard, AnimatedCard } from '../components/ui/GlassCard';

const MyFavorites = () => {
  const navigate = useNavigate();
  const { connected, getUserFavorites, toggleFavorite } = useWeb3();
  const [favoriteCreations, setFavoriteCreations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavoriteCreations = useCallback(() => {
    try {
      const favoriteIds = getUserFavorites();
      console.log('收藏的ID列表:', favoriteIds);
      console.log('所有可用的创作:', mockCreations.map(c => ({ id: c.id, title: c.title })));

      // 确保ID类型匹配 - 将所有ID转换为字符串进行比较
      const normalizedFavoriteIds = favoriteIds.map(id => String(id));
      const favorites = mockCreations.filter(creation =>
        normalizedFavoriteIds.includes(String(creation.id))
      );
      console.log('匹配的收藏:', favorites.map(c => ({ id: c.id, title: c.title })));

      setFavoriteCreations(favorites);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserFavorites]);

  useEffect(() => {
    if (connected) {
      loadFavoriteCreations();
    } else {
      setIsLoading(false);
    }
  }, [connected, loadFavoriteCreations]);

  // 监听localStorage变化以实时更新收藏
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'creatorchain_favorites' && connected) {
        loadFavoriteCreations();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 也监听自定义事件（同一页面内的变化）
    const handleFavoritesUpdate = () => {
      if (connected) {
        loadFavoriteCreations();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, [connected, loadFavoriteCreations]);

  const handleRemoveFavorite = (creationId) => {
    try {
      toggleFavorite(creationId);
      setFavoriteCreations(prev => 
        prev.filter(creation => creation.id !== creationId)
      );
    } catch (error) {
      // 取消收藏失败
    }
  };

  if (!connected) {
    return (
      <PageLayout backgroundType="aurora">
        <Box sx={{ py: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            请先连接钱包以查看您的收藏
          </Alert>
        </Box>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout backgroundType="aurora">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 4 }}>
            加载中...
          </Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundType="aurora">
      <Box sx={{ py: 4 }}>
        {/* 页面标题 */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            ❤️ 我的收藏
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            您已收藏 {favoriteCreations.length} 个作品
          </Typography>
        </Box>

        {favoriteCreations.length === 0 ? (
          <GlassCard sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              📭 暂无收藏
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              您还没有收藏任何作品，快去探索页面发现精彩内容吧！
            </Typography>
            <IconButton 
              onClick={() => navigate('/explore')}
              sx={{ 
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              去探索
            </IconButton>
          </GlassCard>
        ) : (
          <Grid container spacing={3}>
            {favoriteCreations.map((creation, index) => (
              <Grid item key={creation.id} xs={12} sm={6} md={4}>
                <AnimatedCard 
                  hover 
                  glow
                  delay={index * 0.1}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/creation/${creation.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={creation.image}
                    alt={creation.title}
                    loading="lazy"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 600,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {creation.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        mb: 2,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {creation.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {creation.creatorName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {creation.creatorName}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      {creation.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          sx={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            color: '#ff6b6b',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Stack>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 700
                        }}
                      >
                        {creation.price}
                      </Typography>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: '#ff6b6b',
                            transition: 'color 0.3s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(creation.id);
                          }}
                        >
                          <Favorite fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {creation.likes}
                        </Typography>
                        <IconButton 
                          size="small" 
                          sx={{ color: 'text.secondary', ml: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {creation.views}
                        </Typography>
                      </Stack>
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageLayout>
  );
};

export default MyFavorites;
