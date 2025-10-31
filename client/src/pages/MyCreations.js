import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
  FilterList,
  Search,
  Sort,
  MoreVert,
  Public,
  Lock,
  Verified,
  Close as CloseIcon,
  CalendarToday,
  Link,
  CloudDownload,
  Favorite,
  Share,
  AttachMoney,
  Category
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { makeGatewayURL } from '../utils/ipfs';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import blockchainService from '../services/blockchainService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// 安全的图片URL获取函数
const getImageUrl = (creation) => {
  try {
    // 优先使用 image 字段
    if (creation?.image && typeof creation.image === 'string') {
      // 检查是否为本地上传路径
      if (creation.image.startsWith('/uploads/')) {
        return `http://localhost:8080${creation.image}`;
      } else if (creation.image.startsWith('http://localhost:8080')) {
        // 已经是完整URL，直接返回
        return creation.image;
      } else {
        // 对于 IPFS 哈希，使用 makeGatewayURL
        return makeGatewayURL(creation.image);
      }
    }

    // 然后检查 fileHash
    if (creation?.fileHash && typeof creation.fileHash === 'string') {
      if (creation.fileHash.startsWith('/uploads/')) {
        return `http://localhost:8080${creation.fileHash}`;
      } else {
        // 对于 IPFS 哈希，使用 makeGatewayURL
        return makeGatewayURL(creation.fileHash);
      }
    }

    // 默认图片
    return 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
  } catch (error) {
    console.error('Error getting image URL for creation:', creation, error);
    return 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
  }
};

const MyCreations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useThemeMode();
  const { connected, account } = useWeb3();
  const isDark = mode === 'dark';
  
  const [creations, setCreations] = useState([]);
  const [filteredCreations, setFilteredCreations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentTab, setCurrentTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    visibility: 'public'
  });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCreationDetail, setSelectedCreationDetail] = useState(null);

  // 加载创作数据（区块链 + 本地存储 + 模拟数据）
  useEffect(() => {
    const loadCreations = async () => {
      let combinedCreations = [];

      // 1. 加载本地存储的创作
      const localCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
      console.log('本地创作数据:', localCreations);

      // 2. 如果连接了钱包，尝试从区块链加载
      if (connected && account) {
        try {
          await blockchainService.initialize();
          const blockchainCreations = await blockchainService.getUserCreations(account);
          console.log('区块链创作数据:', blockchainCreations);

          // 将区块链创作转换为本地格式
          const formattedBlockchainCreations = blockchainCreations.map(creation => ({
            id: creation.id,
            title: creation.title || '区块链创作',
            description: creation.description || '从区块链加载的创作',
            image: creation.ipfsHash ? getImageUrl({ fileHash: creation.ipfsHash }) : null,
            fileHash: creation.ipfsHash,
            creationType: 'blockchain',
            status: 'published',
            visibility: 'public',
            createdAt: new Date(creation.timestamp * 1000).toISOString().split('T')[0],
            views: 0,
            likes: 0,
            downloads: 0,
            blockchainVerified: true,
            hash: creation.contentHash
          }));

          combinedCreations = [...formattedBlockchainCreations, ...localCreations];
        } catch (error) {
          console.warn('从区块链加载数据失败:', error);
          combinedCreations = localCreations;
        }
      } else {
        combinedCreations = localCreations;
      }

      // 3. 添加模拟数据用于演示
      const mockCreations = [
      {
        id: 1,
        title: 'AI生成的艺术作品 - 星空',
        description: '使用AI技术创作的抽象星空艺术作品，展现了宇宙的神秘与美丽。',
        image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop',
        price: 50,
        category: '艺术',
        creationType: 'ai', // AI创作
        status: 'published',
        visibility: 'public',
        createdAt: '2024-01-15',
        views: 1250,
        likes: 89,
        downloads: 23,
        blockchainVerified: true,
        hash: '0x742d35Cc6634C0532925a3b8D4C9Db96C4B4d8b6'
      },
      {
        id: 2,
        title: '数字音乐作品 - 未来之声',
        description: '融合电子音乐与古典元素的创新音乐作品，适合冥想和放松。',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        price: 120,
        category: '音乐',
        creationType: 'manual', // 手工创作
        status: 'draft',
        visibility: 'private',
        createdAt: '2024-01-12',
        views: 0,
        likes: 0,
        downloads: 0,
        blockchainVerified: false,
        hash: null
      },
      {
        id: 3,
        title: '3D模型 - 未来城市',
        description: '精心设计的未来主义城市3D模型，可用于游戏开发和建筑设计。',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
        price: 200,
        category: '3D模型',
        creationType: 'manual', // 手工创作
        status: 'published',
        visibility: 'public',
        createdAt: '2024-01-10',
        views: 2100,
        likes: 156,
        downloads: 45,
        blockchainVerified: true,
        hash: '0x8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
      },
      {
        id: 4,
        title: 'AI写作 - 科幻小说',
        description: 'AI协助创作的科幻短篇小说，探讨人工智能与人类的关系。',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
        price: 80,
        category: '文学',
        creationType: 'ai', // AI创作
        status: 'published',
        visibility: 'public',
        createdAt: '2024-01-08',
        views: 890,
        likes: 67,
        downloads: 12,
        blockchainVerified: true,
        hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3'
      }
      ];

      // 4. 合并所有创作数据，区块链和本地创作优先显示
      const finalCreations = [...combinedCreations, ...mockCreations];

      setCreations(finalCreations);
      setFilteredCreations(finalCreations);

      // 检查是否有新创作并显示提示
      if (location.state?.newCreation) {
        toast.success(`🎉 新作品《${location.state.newCreation.title}》已成功上链！`);
        // 清除导航状态
        navigate(location.pathname, { replace: true });
      }
    };

    loadCreations();
  }, [connected, account, location.state, location.pathname, navigate]);

  // 搜索和过滤
  useEffect(() => {
    let filtered = creations;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(creation => 
        creation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creation.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(creation => creation.status === filterStatus);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'price':
          return b.price - a.price;
        default:
          return 0;
      }
    });

    setFilteredCreations(filtered);
  }, [creations, searchTerm, filterStatus, sortBy]);

  const handleImageClick = (creation) => {
    const imageUrl = getImageUrl(creation);
    setPreviewImage(imageUrl);
    setImagePreviewOpen(true);
  };

  const handleEdit = (creation) => {
    setSelectedCreation(creation);
    setEditForm({
      title: creation.title || '',
      description: creation.description || '',
      price: (creation.price || 0).toString(),
      category: creation.category || creation.creationTypeLabel || '其他',
      visibility: creation.visibility || 'public'
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      toast.error('请输入作品标题');
      return;
    }

    setCreations(creations.map(creation => 
      creation.id === selectedCreation.id 
        ? { ...creation, ...editForm, price: parseInt(editForm.price) }
        : creation
    ));
    
    setEditDialogOpen(false);
    toast.success('作品信息更新成功！');
  };

  const handleDelete = (creation) => {
    setSelectedCreation(creation);
    setDeleteDialogOpen(true);
  };

  const handleViewDetail = (creation) => {
    setSelectedCreationDetail(creation);
    setDetailDialogOpen(true);
  };

  const confirmDelete = () => {
    setCreations(creations.filter(creation => creation.id !== selectedCreation.id));
    setDeleteDialogOpen(false);
    toast.success('作品删除成功！');
  };

  const handlePublish = (creation) => {
    setCreations(creations.map(c => 
      c.id === creation.id 
        ? { ...c, status: 'published', visibility: 'public' }
        : c
    ));
    toast.success('作品发布成功！');
  };

  const handleUnpublish = (creation) => {
    setCreations(creations.map(c => 
      c.id === creation.id 
        ? { ...c, status: 'draft', visibility: 'private' }
        : c
    ));
    toast.success('作品已下架！');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'pending': return '审核中';
      default: return '未知';
    }
  };

  const getVisibilityIcon = (visibility) => {
    return visibility === 'public' ? <Public /> : <Lock />;
  };

  const tabs = [
    { label: '全部作品', count: creations.length },
    { label: '已发布', count: creations.filter(c => c.status === 'published').length },
    { label: '草稿', count: creations.filter(c => c.status === 'draft').length },
    { label: '已认证', count: creations.filter(c => c.blockchainVerified).length }
  ];

  if (!connected) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: isDark 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d5f 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box textAlign="center">
            <Typography variant="h4" mb={4} color="textPrimary">
              请先连接钱包
            </Typography>
            <Typography variant="body1" color="textSecondary">
              连接钱包后即可查看和管理您的作品
            </Typography>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d5f 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
    }}>
      <Navbar />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 页面标题 */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight="bold" mb={2}>
            我的作品
          </Typography>
          <Typography variant="body1" color="textSecondary">
            管理您的AI创作作品，查看数据统计和收益情况
          </Typography>
        </Box>

        {/* 统计概览 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {creations.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  总作品数
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {creations.filter(c => c.status === 'published').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  已发布
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {creations.reduce((sum, c) => sum + c.views, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  总浏览量
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {creations.reduce((sum, c) => sum + c.downloads, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  总下载量
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 标签页 */}
        <Box mb={3}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': { color: 'text.secondary' }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={index}
                label={
                  <Badge badgeContent={tab.count} color="primary">
                    {tab.label}
                  </Badge>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* 搜索和过滤 */}
        <Box mb={3} sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="搜索作品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 200 }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterStatus(filterStatus === 'all' ? 'published' : 'all')}
          >
            {filterStatus === 'all' ? '全部状态' : '已发布'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Sort />}
            onClick={() => setSortBy(sortBy === 'newest' ? 'views' : 'newest')}
          >
            {sortBy === 'newest' ? '最新' : '最多浏览'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ ml: 'auto' }}
            onClick={() => navigate('/create')}
          >
            创建新作品
          </Button>
        </Box>

        {/* 作品列表 */}
        <Grid container spacing={3}>
          {filteredCreations.map((creation) => (
            <Grid item xs={12} sm={6} md={4} key={creation.id} sx={{ display: 'flex' }}>
              <Card sx={{ 
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(creation)}
                  alt={creation.title || '创作作品'}
                  loading="lazy"
                  sx={{
                    objectFit: 'cover',
                    width: '100%',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.02)'
                    }
                  }}
                  onClick={() => handleImageClick(creation)}
                  onError={(e) => {
                    console.warn('Image load failed for creation:', creation.id, 'Original src:', e.target.src);
                    e.target.src = 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
                  }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, mr: 1 }}>
                      {creation.title}
                    </Typography>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                    {creation.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {/* 作品类型标识 */}
                    {creation.creationType === 'ai' && (
                      <Chip 
                        label="🤖 AI生成" 
                        color="secondary" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    {creation.creationType === 'manual' && (
                      <Chip 
                        label="🎨 手工创作" 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                    <Chip 
                      label={getStatusText(creation.status)} 
                      color={getStatusColor(creation.status)} 
                      size="small" 
                    />
                    <Chip 
                      label={creation.category || creation.creationTypeLabel || '其他'} 
                      variant="outlined" 
                      size="small" 
                    />
                    {creation.blockchainVerified && (
                      <Chip 
                        icon={<Verified />}
                        label="已认证" 
                        color="success" 
                        size="small" 
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {creation.price || '免费'} {creation.price ? '积分' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getVisibilityIcon(creation.visibility)}
                      <Typography variant="caption" color="textSecondary">
                        {creation.visibility === 'public' ? '公开' : '私有'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      👁️ {creation.views || 0} 浏览
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ❤️ {creation.likes || 0} 喜欢
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      📥 {creation.downloads || 0} 下载
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetail(creation)}
                    >
                      查看
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<Edit />}
                      onClick={() => handleEdit(creation)}
                    >
                      编辑
                    </Button>
                    {creation.status === 'published' ? (
                      <Button 
                        size="small" 
                        color="warning"
                        onClick={() => handleUnpublish(creation)}
                      >
                        下架
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        color="success"
                        onClick={() => handlePublish(creation)}
                      >
                        发布
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(creation)}
                    >
                      删除
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredCreations.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="textSecondary" mb={2}>
              暂无作品
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              开始创建您的第一个AI作品吧！
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => toast('创建新作品功能开发中...', { icon: 'ℹ️' })}
            >
              创建新作品
            </Button>
          </Box>
        )}
      </Container>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑作品信息</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="作品标题"
            value={editForm.title}
            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="作品描述"
            value={editForm.description}
            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="价格 (积分)"
            type="number"
            value={editForm.price}
            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="分类"
            value={editForm.category}
            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveEdit} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除作品 "{selectedCreation?.title}" 吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">删除</Button>
        </DialogActions>
      </Dialog>

      {/* 图片预览对话框 */}
      <Dialog 
        open={imagePreviewOpen} 
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 2
          }}
          onClick={() => setImagePreviewOpen(false)}
        >
          <img
            src={previewImage}
            alt="预览图片"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={() => setImagePreviewOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Dialog>

      {/* 作品详细信息对话框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
            作品详细信息
          </Box>
          <IconButton
            onClick={() => setDetailDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedCreationDetail && (
            <Box>
              {/* 作品图片 */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={getImageUrl(selectedCreationDetail)}
                  alt={selectedCreationDetail.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </Box>

              {/* 基本信息 */}
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Verified color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="标题"
                    secondary={selectedCreationDetail.title || '未设置'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Category color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="描述"
                    secondary={selectedCreationDetail.description || '暂无描述'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CalendarToday color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="创建时间"
                    secondary={selectedCreationDetail.createdAt || '未知'}
                  />
                </ListItem>

                {selectedCreationDetail.price && (
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="价格"
                      secondary={`¥${selectedCreationDetail.price}`}
                    />
                  </ListItem>
                )}

                <ListItem>
                  <ListItemIcon>
                    <Public color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="可见性"
                    secondary={selectedCreationDetail.visibility === 'public' ? '公开' : '私有'}
                  />
                </ListItem>

                {selectedCreationDetail.category && (
                  <ListItem>
                    <ListItemIcon>
                      <Category color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="分类"
                      secondary={selectedCreationDetail.category}
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* 统计信息 */}
              <Typography variant="h6" gutterBottom fontWeight="bold">
                统计信息
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Visibility color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreationDetail.views || 0}</Typography>
                    <Typography variant="caption" color="textSecondary">浏览次数</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Favorite color="error" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreationDetail.likes || 0}</Typography>
                    <Typography variant="caption" color="textSecondary">喜欢数</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <CloudDownload color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">{selectedCreationDetail.downloads || 0}</Typography>
                    <Typography variant="caption" color="textSecondary">下载次数</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 技术信息 */}
              <Typography variant="h6" gutterBottom fontWeight="bold">
                技术信息
              </Typography>
              <List dense>
                {selectedCreationDetail.fileHash && (
                  <ListItem>
                    <ListItemIcon>
                      <Link color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="文件哈希"
                      secondary={
                        <Tooltip title="点击复制">
                          <Box
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              color: 'primary.main',
                              fontSize: '0.875rem',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(selectedCreationDetail.fileHash);
                              toast.success('文件哈希已复制到剪贴板');
                            }}
                          >
                            {selectedCreationDetail.fileHash}
                          </Box>
                        </Tooltip>
                      }
                    />
                  </ListItem>
                )}

                {selectedCreationDetail.hash && (
                  <ListItem>
                    <ListItemIcon>
                      <Verified color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="内容哈希"
                      secondary={
                        <Tooltip title="点击复制">
                          <Box
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              color: 'primary.main',
                              fontSize: '0.875rem',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(selectedCreationDetail.hash);
                              toast.success('内容哈希已复制到剪贴板');
                            }}
                          >
                            {selectedCreationDetail.hash}
                          </Box>
                        </Tooltip>
                      }
                    />
                  </ListItem>
                )}

                <ListItem>
                  <ListItemIcon>
                    <Category color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="创作类型"
                    secondary={
                      selectedCreationDetail.creationType === 'ai' ? 'AI创作' :
                      selectedCreationDetail.creationType === 'manual' ? '手工创作' :
                      selectedCreationDetail.creationType === 'blockchain' ? '区块链创作' :
                      '未知类型'
                    }
                  />
                </ListItem>

                {selectedCreationDetail.blockchainVerified && (
                  <ListItem>
                    <ListItemIcon>
                      <Verified color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="区块链验证"
                      secondary="已通过区块链验证"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            关闭
          </Button>
          {selectedCreationDetail?.fileHash && (
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={() => {
                const shareText = `查看我的创作: ${selectedCreationDetail.title}`;
                if (navigator.share) {
                  navigator.share({
                    title: selectedCreationDetail.title,
                    text: shareText,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
                  toast.success('分享链接已复制到剪贴板');
                }
              }}
            >
              分享
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default MyCreations;
