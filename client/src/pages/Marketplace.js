import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  CardMedia,
  CardContent
} from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import { mockCreations } from '../data/mock/creations';
import PageLayout from '../components/ui/PageLayout';
import { GlassCard, AnimatedCard } from '../components/ui/GlassCard';

const Marketplace = () => {
  const { mode } = useThemeMode();
  const [activeTab, setActiveTab] = useState('all');

  // 去重并过滤数据
  const filtered = activeTab === 'all' 
    ? mockCreations.filter((item, index, self) => 
        index === self.findIndex(creation => creation.id === item.id)
      )
    : mockCreations.filter((item, index, self) => 
        item.type === activeTab && index === self.findIndex(creation => creation.id === item.id)
      );

  // Market statistics
  const marketStats = [
    { 
      title: '总交易额', 
      value: '∞ 积分', 
      icon: '💰',
      description: '无限交易可能'
    },
    { 
      title: '活跃用户', 
      value: '∞', 
      icon: '👥',
      description: '全球用户参与'
    },
    { 
      title: '成交率', 
      value: '100%', 
      icon: '📈',
      description: '智能匹配系统'
    }
  ];

  return (
    <PageLayout backgroundType="aurora">
      <Box sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            创作市场
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              maxWidth: 600,
              mx: 'auto',
              mb: 4
            }}
          >
            发现独特的数字创作，支持创作者的原创作品
          </Typography>
        </Box>

        {/* Market Statistics */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {marketStats.map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <AnimatedCard delay={index * 0.1}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: mode === 'dark' ? 'white' : 'text.primary',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                    }}
                  >
                    {stat.description}
                  </Typography>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>

        {/* Category Tabs */}
        <GlassCard sx={{ mb: 4, p: 0 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, value) => setActiveTab(value)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem',
                py: 2,
                '&.Mui-selected': {
                  color: mode === 'dark' ? '#4ECDC4' : '#FF6B6B',
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                height: 3,
                borderRadius: 1.5
              }
            }}
          >
            <Tab label="全部作品" value="all" />
            <Tab label="图像创作" value="图像" />
            <Tab label="音频作品" value="音频" />
            <Tab label="3D模型" value="3D模型" />
          </Tabs>
        </GlassCard>

        {/* Creation Grid */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {filtered.map((item, index) => (
            <Grid 
              item 
              key={`${item.id}-${index}`} 
              xs={12} 
              sm={6} 
              md={4} 
              sx={{ 
                display: 'flex',
                alignItems: 'stretch',
                minHeight: '400px'
              }}
            >
              <AnimatedCard
                delay={index * 0.1}
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.image}
                  alt={item.title}
                  loading="lazy"
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: 3,
                  position: 'relative',
                  justifyContent: 'space-between'
                }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: mode === 'dark' ? 'white' : 'text.primary',
                      fontWeight: 700,
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
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      mb: 2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      size="small"
                      label={item.type}
                      variant="outlined"
                      sx={{
                        color: '#4ECDC4',
                        borderColor: 'rgba(78, 205, 196, 0.3)',
                        background: 'rgba(78, 205, 196, 0.1)',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        ml: 1
                      }}
                    >
                      创作者: {item.creator}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                      }}
                    >
                      {item.price}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                        borderRadius: 2,
                        px: 2,
                        py: 0.8,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #FF5252, #26C6DA)',
                          transform: 'scale(1.05)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      立即购买
                    </Button>
                  </Box>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default Marketplace;
