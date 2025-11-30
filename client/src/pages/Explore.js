import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Chip,
  Avatar,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Visibility,
  Explore as ExploreIcon,
  TrendingUp,
  Star,
  Close as CloseIcon,
  CalendarToday,
  Category,
  AttachMoney,
  RemoveRedEye,
  ThumbUp,
  Download
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3ContextFixed';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/ui/PageLayout';
import { GlassCard, AnimatedCard, FeatureCard } from '../components/ui/GlassCard';
import { mockCreations } from '../data/mock/creations';

// 页面内容由 App.js 统一包裹 Navbar/Footer 与 Container

const Explore = () => {
  const navigate = useNavigate();
  const { connected, toggleFavorite, isFavorite } = useWeb3();
  const [creations, setCreations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState(null);

  useEffect(() => {
    // 使用统一的mock数据，确保与收藏页面数据一致
    // 添加防御性编程，确保数据完整性
    const processedCreations = mockCreations.map(creation => ({
      ...creation,
      tags: creation.tags || [],
      creatorName: creation.creatorName || '未知创作者',
      image: creation.image || 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop'
    }));
    
    setCreations(processedCreations);
  }, []);

  // 处理收藏点击
  const handleFavoriteClick = async (e, creationId) => {
    e.stopPropagation(); // 阻止事件冒泡

    try {
      if (!connected) {
        toast.error('请先连接钱包');
        return;
      }

      const result = toggleFavorite(creationId);
      toast.success(result.message);

      // 更新本地状态以反映收藏状态变化
      setCreations(prevCreations =>
        prevCreations.map(creation =>
          creation.id === creationId
            ? { ...creation, isLiked: result.isFavorite }
            : creation
        )
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 处理查看详情点击
  const handleViewDetail = (e, creation) => {
    e.stopPropagation(); // 阻止事件冒泡
    setSelectedCreation(creation);
    setDetailDialogOpen(true);
  };

  // 关闭详情对话框
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedCreation(null);
  };

  // Filter function (commented out for now)
  // const handleFilterChange = (event, newValue) => setFilter(newValue);

  const filteredCreations = creations.filter(c => {
    if (filter === 'all') return true;
    return c.creationType === filter;
  });

  return (
    <PageLayout background="particles">
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
        {/* 页面头部 */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            探索创作世界
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '600px', 
              mx: 'auto',
              lineHeight: 1.6,
              mb: 4
            }}
          >
            发现来自全球创作者的精彩作品，从AI艺术到音乐创作，每一件都是独一无二的数字珍品
          </Typography>
        </Box>

        {/* 统计卡片 */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<ExploreIcon />}
              title="∞ 件作品"
              description="探索无限可能的数字创作"
              delay={0.1}
              glow
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<TrendingUp />}
              title="∞ 位创作者"
              description="来自世界各地的优秀艺术家"
              delay={0.2}
              glow
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<Star />}
              title="100% 满意度"
              description="用户对平台作品质量的好评"
              delay={0.3}
              glow
            />
          </Grid>
        </Grid>

        {/* 筛选标签 */}
        <GlassCard sx={{ mb: 4 }}>
          <Tabs 
            value={filter} 
            onChange={(e, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              px: 2,
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(45deg, #667eea, #764ba2)'
              }
            }}
          >
            <Tab label="全部" value="all" />
            <Tab label="图像" value="image" />
            <Tab label="文本" value="text" />
            <Tab label="音频" value="audio" />
            <Tab label="3D模型" value="3d" />
            <Tab label="交互艺术" value="interactive" />
          </Tabs>
        </GlassCard>

        {/* 作品网格 */}
        <Grid container spacing={3}>
          {filteredCreations.map((creation, index) => (
            <Grid item key={creation.id} xs={12} sm={6} md={4}>
              <AnimatedCard 
                hover 
                glow
                delay={index * 0.1}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/creation/${creation.id}`)}
              >
                {/* 固定纵横比的图片容器 */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '70%', // 10:7 比例
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0,0,0,0.1)'
                  }}
                >
                  <Box
                    component="img"
                    src={creation.image}
                    alt={creation.title}
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
                      {(creation.creatorName || '未知')[0]}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {creation.creatorName || '未知创作者'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {(creation.tags || []).slice(0, 2).map((tag, tagIndex) => (
                      <Chip 
                        key={tagIndex}
                        label={tag} 
                        size="small"
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          fontSize: '0.7rem'
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
                    
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ position: 'relative', zIndex: 10 }}
                    >
                      <IconButton 
                        size="small" 
                        sx={{ 
                          color: isFavorite(creation.id) ? '#ff6b6b' : 'text.secondary',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: isFavorite(creation.id) ? '#ff5252' : '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleFavoriteClick(e, creation.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {isFavorite(creation.id) ? (
                          <Favorite fontSize="small" />
                        ) : (
                          <FavoriteBorder fontSize="small" />
                        )}
                      </IconButton>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {creation.likes}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          ml: 1,
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'primary.light',
                            opacity: 0.1
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleViewDetail(e, creation);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="查看详情"
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
      </Box>

      {/* 作品详情对话框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            作品详情
          </Typography>
          <IconButton
            onClick={handleCloseDetail}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {selectedCreation && (
            <Box>
              {/* 作品图片 */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={selectedCreation.image}
                  alt={selectedCreation.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </Box>

              {/* 基本信息 */}
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                {selectedCreation.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                  {(selectedCreation.creatorName || '未知')[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedCreation.creatorName || '未知创作者'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    创作者
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="body1"
                sx={{ mb: 3, lineHeight: 1.6, color: 'text.primary' }}
              >
                {selectedCreation.description}
              </Typography>

              {/* 标签 */}
              {selectedCreation.tags && selectedCreation.tags.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    标签
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedCreation.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          mb: 1
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* 详细信息列表 */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                作品信息
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="价格"
                    secondary={selectedCreation.price}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Category color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="类型"
                    secondary={selectedCreation.creationType === 'image' ? '图像' :
                              selectedCreation.creationType === 'text' ? '文本' :
                              selectedCreation.creationType === 'audio' ? '音频' :
                              selectedCreation.creationType === '3d' ? '3D模型' :
                              selectedCreation.creationType === 'interactive' ? '交互艺术' :
                              '其他'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CalendarToday color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="创建时间"
                    secondary={selectedCreation.createdAt || '未知'}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 3 }} />

              {/* 统计信息 */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                数据统计
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <RemoveRedEye color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreation.views || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      浏览次数
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <ThumbUp color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreation.likes || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      喜欢数
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Download color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreation.downloads || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      下载次数
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseDetail} color="secondary">
            关闭
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(`/creation/${selectedCreation?.id}`)}
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)'
              }
            }}
          >
            查看完整页面
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default Explore;
