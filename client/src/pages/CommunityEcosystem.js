import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, Avatar, Chip, LinearProgress } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Groups, EmojiEvents, TrendingUp, AttachMoney, Star, Visibility } from '@mui/icons-material';

const CommunityEcosystem = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [selectedCreator, setSelectedCreator] = useState(null);

  const topCreators = [
    { 
      id: 1, 
      name: 'AI艺术家小明', 
      avatar: '🎨', 
      level: 'Diamond', 
      works: 245, 
      earnings: '12,500 积分',
      specialty: '数字艺术',
      followers: 15420,
      reputation: 98
    },
    { 
      id: 2, 
      name: '创意设计师小红', 
      avatar: '✨', 
      level: 'Platinum', 
      works: 189, 
      earnings: '8,700 积分',
      specialty: '概念设计',
      followers: 12100,
      reputation: 95
    },
    { 
      id: 3, 
      name: '视觉创作者小李', 
      avatar: '🌟', 
      level: 'Gold', 
      works: 156, 
      earnings: '6,300 积分',
      specialty: '视觉效果',
      followers: 9800,
      reputation: 92
    }
  ];

  const communityStats = [
    { label: '活跃创作者', value: '∞', trend: '持续增长', icon: <Groups color="primary" /> },
    { label: '总作品数量', value: '∞', trend: '无限创作', icon: <EmojiEvents color="warning" /> },
    { label: '社区总收益', value: '∞ 积分', trend: '持续增长', icon: <AttachMoney color="success" /> },
    { label: '日活跃用户', value: '∞', trend: '全球参与', icon: <TrendingUp color="info" /> }
  ];

  const achievements = [
    { title: '新星创作者', description: '发布首个AI作品', reward: '100 积分', color: '#3b82f6' },
    { title: '社区贡献者', description: '获得100个点赞', reward: '50 积分', color: '#10b981' },
    { title: '创意大师', description: '作品浏览量突破10万', reward: '500 积分', color: '#f59e0b' },
    { title: '版权守护者', description: '协助发现抄袭作品', reward: '200 积分', color: '#ef4444' }
  ];

  const handleCreatorClick = (creator) => {
    setSelectedCreator(creator);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)'
        : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #b3e5fc 100%)'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold'
            }}
          >
            🌟 社区生态
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            构建繁荣的AI创作者社区，共同推动数字艺术的发展
          </Typography>
        </Box>

        {/* 社区统计 */}
        <Grid container spacing={4} mb={8}>
          {communityStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  textAlign: 'center',
                  '&:hover': { 
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(16,185,129,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="textSecondary" mb={1}>
                    {stat.label}
                  </Typography>
                  <Chip 
                    label={stat.trend}
                    color="success"
                    size="small"
                    icon={<TrendingUp />}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 顶级创作者排行榜 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🏆 创作者排行榜
          </Typography>
          <Grid container spacing={3}>
            {topCreators.map((creator, index) => (
              <Grid item xs={12} md={4} key={creator.id}>
                <Card 
                  sx={{ 
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(15px)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { 
                      transform: 'translateY(-10px)',
                      boxShadow: '0 25px 50px rgba(59,130,246,0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleCreatorClick(creator)}
                >
                  {index === 0 && (
                    <Chip 
                      label="👑 冠军"
                      color="warning"
                      sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                    />
                  )}
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mx: 'auto', 
                        mb: 2,
                        fontSize: '2rem',
                        background: index === 0 ? 'linear-gradient(45deg, #f59e0b, #d97706)' :
                                   index === 1 ? 'linear-gradient(45deg, #6b7280, #4b5563)' :
                                   'linear-gradient(45deg, #cd7c0e, #92400e)'
                      }}
                    >
                      {creator.avatar}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      {creator.name}
                    </Typography>
                    <Chip 
                      label={creator.level}
                      color={index === 0 ? 'warning' : index === 1 ? 'default' : 'error'}
                      sx={{ mb: 2 }}
                    />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">作品数</Typography>
                      <Typography variant="body2" fontWeight="bold">{creator.works}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">收益</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {creator.earnings}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">声誉</Typography>
                      <Box display="flex" alignItems="center">
                        <Star color="warning" sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="bold">{creator.reputation}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 成就系统 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🎯 成就系统
          </Typography>
          <Grid container spacing={3}>
            {achievements.map((achievement, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(15px)',
                    height: '100%',
                    border: `2px solid ${achievement.color}20`,
                    '&:hover': { 
                      borderColor: achievement.color,
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `linear-gradient(45deg, ${achievement.color}, ${achievement.color}80)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      <EmojiEvents sx={{ color: 'white', fontSize: '2rem' }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {achievement.description}
                    </Typography>
                    <Chip 
                      label={achievement.reward}
                      sx={{ 
                        backgroundColor: `${achievement.color}20`,
                        color: achievement.color,
                        fontWeight: 'bold'
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 加入社区 */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" mb={4} fontWeight="bold">
            🚀 加入我们的社区
          </Typography>
          <Box 
            sx={{ 
              p: 4,
              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
              borderRadius: 3,
              border: '2px solid #10b981',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" mb={3}>
              🎨 开始您的AI创作之旅
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={3}>
              与全球创作者一起探索AI艺术的无限可能
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #10b981, #059669)',
                px: 4,
                py: 1.5,
                mr: 2
              }}
            >
              🌟 立即加入
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: '#10b981',
                color: '#10b981',
                px: 4,
                py: 1.5
              }}
            >
              📚 了解更多
            </Button>
          </Box>
        </Box>
      </Container>

      {/* 创作者详情弹窗 */}
      <Dialog 
        open={!!selectedCreator} 
        onClose={() => setSelectedCreator(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedCreator && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ mr: 2, fontSize: '1.5rem' }}>
                  {selectedCreator.avatar}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedCreator.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedCreator.specialty}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {selectedCreator.works}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">作品数量</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {selectedCreator.earnings}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">总收益</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box mb={3}>
                <Typography variant="body1" mb={1}>
                  <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
                  粉丝数量: {selectedCreator.followers.toLocaleString()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(selectedCreator.followers / 20000) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mb={3}>
                <Typography variant="body1" mb={1}>
                  <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
                  声誉评分: {selectedCreator.reputation}/100
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedCreator.reputation} 
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Button 
                fullWidth 
                variant="contained"
                sx={{ 
                  background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)'
                }}
              >
                🤝 关注创作者
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Footer />
    </Box>
  );
};

export default CommunityEcosystem;
