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
  Tooltip,
  Alert,
  Menu,
  MenuItem
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
  Category,
  MusicNote,
  GraphicEq
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { makeGatewayURL } from '../utils/ipfs';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import blockchainService from '../services/blockchainService';
import apiService from '../services/apiService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// 安全的图片URL获取函数
const getImageUrl = (creation) => {
  try {
    // 检查所有可能的图片字段：image, image_url, fileHash
    const possibleFields = ['image', 'image_url', 'fileHash', 'ipfsHash'];
    
    for (const field of possibleFields) {
      const value = creation?.[field];
      if (value && typeof value === 'string' && value.length > 0) {
      // 检查是否为本地上传路径
        if (value.startsWith('/uploads/')) {
          return `http://localhost:8080${value}`;
        }
        // 已经是完整的后端URL
        if (value.startsWith('http://localhost:8080')) {
          return value;
        }
        // 完整的HTTP URL（外部图片）
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        // 检查是否为有效的IPFS哈希
        if (value.startsWith('Qm') || value.startsWith('bafy')) {
          return makeGatewayURL(value);
        }
      }
    }

    // 默认图片
    return 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
  } catch (error) {
    console.error('Error getting image URL for creation:', creation, error);
    return 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
  }
};

// 获取音频/视频文件URL的函数
const getMediaUrl = (creation) => {
  try {
    // 优先检查专门的URL字段（音频上传返回的url字段）
    const urlFields = ['url', 'fileUrl', 'content_url', 'audioUrl', 'videoUrl'];
    for (const field of urlFields) {
      const value = creation?.[field];
      if (value && typeof value === 'string' && value.length > 0) {
        // 检查是否为本地上传路径
        if (value.startsWith('/uploads/')) {
          return `http://localhost:8080${value}`;
        }
        // 已经是完整的后端URL
        if (value.startsWith('http://localhost:8080')) {
          return value;
        }
        // 完整的HTTP URL
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
      }
    }
    
    // 检查image和image_url字段（可能存储的是音频文件路径）
    const imageFields = ['image', 'image_url'];
    for (const field of imageFields) {
      const value = creation?.[field];
      if (value && typeof value === 'string' && value.length > 0) {
        // 如果是本地上传路径（特别是音频路径）
        if (value.startsWith('/uploads/audio/') || value.startsWith('/uploads/')) {
          return `http://localhost:8080${value}`;
        }
        // 已经是完整的后端URL
        if (value.startsWith('http://localhost:8080')) {
          return value;
        }
        // 完整的HTTP URL
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
      }
    }
    
    // 然后检查哈希字段（IPFS哈希）
    const hashFields = ['contentHash', 'fileHash', 'ipfsHash', 'content_hash'];
    for (const field of hashFields) {
      const value = creation?.[field];
      if (value && typeof value === 'string' && value.length > 0) {
        // 检查是否为有效的IPFS哈希
        if (value.startsWith('Qm') || value.startsWith('bafy')) {
          return makeGatewayURL(value);
        }
        // 如果是本地上传路径格式的哈希，也尝试作为URL
        if (value.startsWith('/uploads/')) {
          return `http://localhost:8080${value}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting media URL for creation:', creation, error);
    return null;
  }
};

// 检查是否为音频类型
const isAudioType = (creation) => {
  if (!creation) return false;
  
  // 检查 category 字段（主要字段，如"音频"）
  const category = String(creation.category || '').toLowerCase();
  if (category === 'audio' || category === '音频') {
    return true;
  }
  
  // 检查 creationType 字段
  const creationType = String(creation.creationType || '').toLowerCase();
  if (creationType === 'audio' || creationType === '音频') {
    return true;
  }
  
  // 检查 creationTypeLabel 字段
  const creationTypeLabel = String(creation.creationTypeLabel || '').toLowerCase();
  if (creationTypeLabel === 'audio' || creationTypeLabel === '音频') {
    return true;
  }
  
  // 检查文件扩展名（作为后备方案）
  const fileHash = creation.fileHash || creation.image || creation.image_url || '';
  if (fileHash && (fileHash.includes('.m4a') || fileHash.includes('.mp3') || fileHash.includes('.wav') || fileHash.includes('.ogg'))) {
    return true;
  }
  
  return false;
};

// 根据作品类型渲染内容
const renderCreationContent = (creation) => {
  const creationType = String(creation?.creationType || creation?.category || '').toLowerCase();
  const mediaUrl = getMediaUrl(creation);
  
  if (isAudioType(creation)) {
    if (mediaUrl) {
      return (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <audio 
            controls 
            src={mediaUrl} 
            style={{ width: '100%', maxWidth: '600px' }}
          >
            您的浏览器不支持音频播放。
          </audio>
        </Box>
      );
    } else {
      return (
        <Alert severity="warning" sx={{ mb: 3 }}>
          音频文件URL不可用，无法播放。
        </Alert>
      );
    }
  }
  
  if (creationType === 'video' || creationType === '视频') {
    if (mediaUrl) {
      return (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <video 
            controls 
            src={mediaUrl} 
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
          >
            您的浏览器不支持视频播放。
          </video>
        </Box>
      );
    } else {
      return (
        <Alert severity="warning" sx={{ mb: 3 }}>
          视频文件URL不可用，无法播放。
        </Alert>
      );
    }
  }
  
  // 默认显示图片（image 或其他类型）
  return (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      <img
        src={getImageUrl(creation)}
        alt={creation?.title || '创作作品'}
        style={{
          maxWidth: '100%',
          maxHeight: '300px',
          objectFit: 'cover',
          borderRadius: '8px',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}
      />
    </Box>
  );
};

const MyCreations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useThemeMode();
  const { connected, account, refreshAuthForCriticalOperation } = useWeb3();
  const isDark = mode === 'dark';
  
  const [creations, setCreations] = useState([]);
  const [filteredCreations, setFilteredCreations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentTab, setCurrentTab] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    licenseDuration: '12', // 授权时长（月），默认12个月
    category: '',
    visibility: 'public'
  });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCreationDetail, setSelectedCreationDetail] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuCreation, setMenuCreation] = useState(null);
  const persistLocalCreations = (nextCreations) => {
    const localOnly = nextCreations.filter(creation => creation.localCreation);
    localStorage.setItem('userCreations', JSON.stringify(localOnly));
  };

  const syncCreationVisibility = async (creationId, visibilityValue) => {
    const numericId = Number(creationId);
    if (!numericId || Number.isNaN(numericId) || numericId <= 0) {
      return;
    }
    try {
      await apiService.updateCreation(numericId, { visibility: visibilityValue });
    } catch (error) {
      console.error('同步作品可见性失败:', error);
      toast.error('同步作品可见性失败，请稍后重试');
    }
  };

  // 加载创作数据（区块链 + 本地存储 + 模拟数据）
  useEffect(() => {
    const loadCreations = async () => {
      let combinedCreations = [];

      // 1. 加载本地存储的创作
      const localCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
      console.log('本地创作数据:', localCreations);

      // 2. 如果连接了钱包，尝试从后端 + 区块链加载
      if (connected && account) {
        try {
          // 后端我的作品
          const backendResp = await apiService.getCreationsByCreator(account);
          const backendCreations = Array.isArray(backendResp?.creations) ? backendResp.creations : [];
          const formattedBackend = backendCreations.map((creation) => ({
            id: creation.id || creation.ID,
            token_id: creation.token_id || creation.TokenID,
            title: creation.title || creation.Title || '未命名作品',
            description: creation.description || creation.Description || '',
            image: creation.image_url || creation.ImageURL || creation.image || '',
            fileHash: creation.content_hash || creation.ContentHash,
            creationType: creation.creation_type || creation.CreationType || 'manual',
            status: creation.visibility === 'public' ? 'published' : 'draft',
            visibility: creation.visibility || 'public',
            createdAt: creation.created_at || creation.CreatedAt || new Date().toISOString().split('T')[0],
            views: 0,
            likes: 0,
            downloads: 0,
            blockchainVerified: !!creation.token_id || !!creation.TokenID,
            hash: creation.content_hash || creation.ContentHash,
            price: creation.price_in_points || creation.PriceInPoints || 0,
            price_in_points: creation.price_in_points || creation.PriceInPoints || 0,
            license_duration: creation.license_duration || creation.LicenseDuration || 12,
            is_listed: creation.is_listed || creation.IsListed,
          }));

          // 区块链数据（保持原有逻辑）
          await blockchainService.initialize();
          const blockchainCreations = await blockchainService.getUserCreations(account);
          console.log('区块链创作数据:', blockchainCreations);
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

          combinedCreations = [...formattedBackend, ...formattedBlockchainCreations, ...localCreations];
        } catch (error) {
          console.warn('从后端或区块链加载数据失败:', error);
          combinedCreations = localCreations;
        }
      } else {
        combinedCreations = localCreations;
      }

      // 3. 添加模拟数据用于演示（仅在没有任何真实数据时使用）
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
        createdAt: '2025-11-15',
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
        createdAt: '2025-11-12',
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
        createdAt: '2025-11-10',
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
        createdAt: '2025-11-08',
        views: 890,
        likes: 67,
        downloads: 12,
        blockchainVerified: true,
        hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3'
      }
      ];

      // 4. 合并所有创作数据：
      // - 优先使用真实数据（本地 + 区块链）
      // - 只有在完全没有真实数据时，才使用模拟数据做空页面演示
      const finalCreationsRaw = combinedCreations.length > 0
        ? combinedCreations
        : mockCreations;
      const seen = new Set();
      const finalCreations = [];
      for (const c of finalCreationsRaw) {
        const k = `${c.id}-${c.hash || c.fileHash || c.createdAt || c.title || ''}`;
        if (!seen.has(k)) {
          seen.add(k);
          finalCreations.push(c);
        }
      }

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

    // 状态过滤（草稿 / 已发布等）
    if (filterStatus !== 'all') {
      filtered = filtered.filter(creation => creation.status === filterStatus);
    }

    // 已认证过滤
    if (verifiedOnly) {
      filtered = filtered.filter(creation => creation.blockchainVerified);
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
  }, [creations, searchTerm, filterStatus, sortBy, verifiedOnly]);

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
      price: (creation.price || creation.price_in_points || 0).toString(),
      licenseDuration: (creation.license_duration || creation.licenseDuration || 12).toString(),
      category: creation.category || creation.creationTypeLabel || '其他',
      visibility: creation.visibility || 'public'
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error('请输入作品标题');
      return;
    }

    const priceInPoints = parseInt(editForm.price) || 0;
    const licenseDuration = parseInt(editForm.licenseDuration) || 12;

    // 更新本地状态
    setCreations(creations.map(creation => 
      creation.id === selectedCreation.id 
        ? { 
            ...creation, 
            ...editForm, 
            price: priceInPoints,
            price_in_points: priceInPoints,
            license_duration: licenseDuration,
            licenseDuration: licenseDuration
          }
        : creation
    ));

    // 如果作品有后端ID，尝试更新后端
    if (selectedCreation.id && typeof selectedCreation.id === 'number') {
      try {
        const updateData = {
          title: editForm.title,
          description: editForm.description,
          visibility: editForm.visibility || 'private',
          price_in_points: priceInPoints,
          license_duration: licenseDuration
        };
        await apiService.updateCreation(selectedCreation.id, updateData);
        toast.success('作品信息更新成功！');
      } catch (error) {
        console.error('更新后端失败:', error);
        toast.success('本地信息已更新！');
      }
    } else {
      toast.success('作品信息更新成功！');
    }
    
    setEditDialogOpen(false);
  };

  const handleDelete = (creation) => {
    setSelectedCreation(creation);
    setDeleteDialogOpen(true);
  };

  const handleViewDetail = (creation) => {
    setSelectedCreationDetail(creation);
    setDetailDialogOpen(true);
  };

  // MoreVert菜单处理
  const handleMenuOpen = (event, creation) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuCreation(creation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuCreation(null);
  };

  const handleMenuAction = (action) => {
    if (!menuCreation) return;
    
    handleMenuClose();
    
    switch (action) {
      case 'view':
        handleViewDetail(menuCreation);
        break;
      case 'edit':
        handleEdit(menuCreation);
        break;
      case 'publish':
        if (menuCreation.status === 'published') {
          handleUnpublish(menuCreation);
        } else {
          handlePublish(menuCreation);
        }
        break;
      case 'delete':
        handleDelete(menuCreation);
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: menuCreation.title,
            text: menuCreation.description,
            url: window.location.href
          }).catch(() => {
            // 如果分享失败，复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href);
            toast.success('链接已复制到剪贴板');
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          toast.success('链接已复制到剪贴板');
        }
        break;
      default:
        break;
    }
  };

  const confirmDelete = async () => {
    // 如果作品已上链，尝试调用后端API删除（但区块链记录无法删除）
    if (selectedCreation?.id && typeof selectedCreation.id === 'number') {
      try {
        await apiService.deleteCreation(selectedCreation.id);
        toast.success('作品已从平台删除！注意：区块链上的记录无法删除。');
      } catch (error) {
        console.error('删除后端记录失败:', error);
        toast.success('作品已从本地列表移除！注意：区块链上的记录无法删除。');
      }
    }
    
    // 从本地状态中移除
    setCreations(creations.filter(creation => creation.id !== selectedCreation.id));
    setDeleteDialogOpen(false);
  };

  const handlePublish = async (creation) => {
    const updated = creations.map(c => 
      c.id === creation.id 
        ? { ...c, status: 'published', visibility: 'public' }
        : c
    );
    setCreations(updated);
    persistLocalCreations(updated);
    toast.success('作品发布成功！');
    await syncCreationVisibility(creation.id, 'public');
  };

  const handleUnpublish = async (creation) => {
    const updated = creations.map(c => 
      c.id === creation.id 
        ? { ...c, status: 'draft', visibility: 'private' }
        : c
    );
    setCreations(updated);
    persistLocalCreations(updated);
    toast.success('作品已下架！');
    await syncCreationVisibility(creation.id, 'private');
  };

  const handleMintNFT = async (creation) => {
    if (!creation?.id) {
      toast.error('缺少作品ID，无法铸造');
      return;
    }
    try {
      if (typeof refreshAuthForCriticalOperation === 'function') {
        const ok = await refreshAuthForCriticalOperation();
        if (!ok) {
          return;
        }
      }
      const resp = await apiService.mintNFT(creation.id);
      const tokenId = resp?.token_id || resp?.tokenId || creation.token_id || creation.TokenID || creation.id;
      const updated = creations.map((c) =>
        c.id === creation.id ? { ...c, token_id: tokenId, TokenID: tokenId, blockchainVerified: true } : c
      );
      setCreations(updated);
      toast.success(`铸造成功，TokenID: ${tokenId}`);
    } catch (error) {
      console.error('铸造NFT失败:', error);
      toast.error(error?.message || '铸造失败，请稍后重试');
    }
  };

  const handleListItem = async (creation) => {
    if (!creation?.id) {
      toast.error('缺少作品ID，无法上架');
      return;
    }
    if (!creation.token_id && !creation.TokenID) {
      toast.error('请先铸造NFT再上架');
      return;
    }
    const priceInput = window.prompt('请输入上架价格（积分）', String(creation.price || creation.price_in_points || 0));
    if (!priceInput) return;
    const price = parseInt(priceInput, 10);
    if (Number.isNaN(price) || price <= 0) {
      toast.error('价格必须为正整数');
      return;
    }
    try {
      if (typeof refreshAuthForCriticalOperation === 'function') {
        const ok = await refreshAuthForCriticalOperation();
        if (!ok) {
          return;
        }
      }
      await apiService.createListing({ creation_id: creation.id, price: String(price) });
      const updated = creations.map((c) =>
        c.id === creation.id
          ? {
              ...c,
              price,
              price_in_points: price,
              is_listed: true,
              status: 'published',
            }
          : c
      );
      setCreations(updated);
      toast.success('上架成功');
    } catch (error) {
      console.error('上架失败:', error);
      toast.error(error?.message || '上架失败，请稍后重试');
    }
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);

    // 不同标签对应不同过滤规则
    switch (newValue) {
      case 0: // 全部
        setFilterStatus('all');
        setVerifiedOnly(false);
        break;
      case 1: // 已发布
        setFilterStatus('published');
        setVerifiedOnly(false);
        break;
      case 2: // 草稿
        setFilterStatus('draft');
        setVerifiedOnly(false);
        break;
      case 3: // 已认证
        setFilterStatus('all');
        setVerifiedOnly(true);
        break;
      default:
        setFilterStatus('all');
        setVerifiedOnly(false);
    }
  };

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
            onChange={handleTabChange}
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
            onClick={() => {
              if (filterStatus === 'all' && !verifiedOnly) {
                // 切到「已发布」视图
                setFilterStatus('published');
                setVerifiedOnly(false);
                setCurrentTab(1);
              } else {
                // 回到「全部」视图
                setFilterStatus('all');
                setVerifiedOnly(false);
                setCurrentTab(0);
              }
            }}
          >
            {filterStatus === 'all' && !verifiedOnly ? '全部状态' : '已发布'}
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
          {filteredCreations.map((creation, index) => (
            <Grid item xs={12} sm={6} md={4} key={`${creation.id}-${creation.hash || creation.fileHash || creation.createdAt || creation.title || index}` } sx={{ display: 'flex' }}>
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
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    pt: '70%', // 统一使用70%的高度比例，保持所有卡片一致
                    backgroundColor: isAudioType(creation) 
                      ? (isDark 
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)'
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)')
                      : '#f5f5f5',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isAudioType(creation) ? (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
                        gap: 2
                      }}
                    >
                      {/* 音频图标装饰 */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: 1
                      }}>
                        <MusicNote 
                          sx={{ 
                            fontSize: 48, 
                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                              '50%': { opacity: 0.6, transform: 'scale(1.1)' }
                            }
                          }} 
                        />
                      </Box>
                      
                      {/* 音频播放器 */}
                      {(() => {
                        const audioUrl = getMediaUrl(creation);
                        console.log('音频作品:', creation.title, '音频URL:', audioUrl, '作品数据:', creation);
                        if (audioUrl) {
                          return (
                            <Box sx={{ width: '100%', maxWidth: '90%' }}>
                              <audio 
                                controls 
                                src={audioUrl} 
                                style={{ 
                                  width: '100%',
                                  borderRadius: '8px',
                                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                                  backdropFilter: 'blur(10px)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onError={(e) => {
                                  console.error('音频加载失败:', audioUrl, e);
                                  toast.error('音频文件加载失败，请检查文件是否存在');
                                }}
                              >
                                您的浏览器不支持音频播放。
                              </audio>
                            </Box>
                          );
                        } else {
                          return (
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                              <Alert severity="warning" sx={{ mb: 1 }}>
                                音频文件URL不可用
                              </Alert>
                              <Typography variant="caption" color="textSecondary">
                                文件路径: {creation.fileHash || creation.image || creation.image_url || '未知'}
                              </Typography>
                            </Box>
                          );
                        }
                      })()}
                      
                      {/* 波形装饰图标 */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 0.5,
                        mt: 1,
                        opacity: 0.4
                      }}>
                        <GraphicEq sx={{ fontSize: 20 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          音频作品
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <CardMedia
                      component="img"
                      image={getImageUrl(creation)}
                      alt={creation.title || '创作作品'}
                      loading="lazy"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease, opacity 0.3s ease',
                        '&:hover': {
                          opacity: 0.9,
                          transform: 'scale(1.03)'
                        }
                      }}
                      onClick={() => handleImageClick(creation)}
                      onError={(e) => {
                        console.warn('Image load failed for creation:', creation.id, 'Original src:', e.target.src);
                        e.target.src = 'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=400&h=300&fit=crop';
                      }}
                    />
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, mr: 1 }}>
                      {creation.title}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, creation)}
                      aria-label="更多操作"
                    >
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
                    <Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {creation.price || creation.price_in_points || '免费'} {creation.price || creation.price_in_points ? '积分' : ''}
                      </Typography>
                      {(creation.license_duration || creation.licenseDuration) && (
                        <Typography variant="caption" color="textSecondary">
                          授权时长: {creation.license_duration || creation.licenseDuration} 个月
                        </Typography>
                      )}
                    </Box>
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
                      color="primary"
                      onClick={() => handleMintNFT(creation)}
                    >
                      铸造NFT
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => handleListItem(creation)}
                      disabled={!(creation.token_id || creation.TokenID)}
                    >
                      上架
                    </Button>
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
            label="售价 (积分)"
            type="number"
            value={editForm.price}
            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
            margin="normal"
            helperText="设置作品售价，0表示免费"
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            label="授权时长 (月)"
            type="number"
            value={editForm.licenseDuration}
            onChange={(e) => setEditForm({...editForm, licenseDuration: e.target.value})}
            margin="normal"
            helperText="购买授权后的使用时长，建议1-120个月"
            inputProps={{ min: 1, max: 120 }}
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
          <Typography variant="body1" sx={{ mb: 2 }}>
            确定要删除作品 "{selectedCreation?.title}" 吗？
          </Typography>
          {selectedCreation?.blockchainVerified && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>重要提示：</strong>此作品已上链确权，删除操作只会从您的作品列表中移除，<strong>无法删除区块链上的永久记录</strong>。区块链上的版权信息将永久保存，无法修改或删除。
              </Typography>
            </Alert>
          )}
          {!selectedCreation?.blockchainVerified && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                此操作将从您的作品列表中移除该作品。如果作品已上链确权，区块链上的记录将永久保留。
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">确认删除</Button>
        </DialogActions>
      </Dialog>

      {/* 更多操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>查看详情</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>编辑</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('publish')}>
          <ListItemIcon>
            {menuCreation?.status === 'published' ? <Lock fontSize="small" /> : <Public fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{menuCreation?.status === 'published' ? '下架' : '发布'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('share')}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>分享</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>删除</ListItemText>
        </MenuItem>
      </Menu>

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
              {/* 作品内容（根据类型显示图片、音频或视频） */}
              {renderCreationContent(selectedCreationDetail)}

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
                {/* 链上登记信息（如果有的话） */}
                {typeof selectedCreationDetail.id !== 'undefined' && (
                  <ListItem>
                    <ListItemIcon>
                      <Verified color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="链上创作ID"
                      secondary={String(selectedCreationDetail.id)}
                    />
                  </ListItem>
                )}

                {selectedCreationDetail.registrationTx && (
                  <ListItem>
                    <ListItemIcon>
                      <Link color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="注册交易哈希"
                      secondary={
                        <Tooltip title="点击复制交易哈希">
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
                              navigator.clipboard.writeText(selectedCreationDetail.registrationTx);
                              toast.success('注册交易哈希已复制到剪贴板');
                            }}
                          >
                            {selectedCreationDetail.registrationTx}
                          </Box>
                        </Tooltip>
                      }
                    />
                  </ListItem>
                )}

                {selectedCreationDetail.confirmationTx && (
                  <ListItem>
                    <ListItemIcon>
                      <Link color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="确认交易哈希"
                      secondary={
                        <Tooltip title="点击复制交易哈希">
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
                              navigator.clipboard.writeText(selectedCreationDetail.confirmationTx);
                              toast.success('确认交易哈希已复制到剪贴板');
                            }}
                          >
                            {selectedCreationDetail.confirmationTx}
                          </Box>
                        </Tooltip>
                      }
                    />
                  </ListItem>
                )}

                {/* 根据值的形态智能区分“哈希”和“文件路径” */}
                {selectedCreationDetail.fileHash && (
                  <ListItem>
                    <ListItemIcon>
                      <Link color="primary" />
                    </ListItemIcon>
                    {(() => {
                      const value = selectedCreationDetail.fileHash;
                      const isPath = typeof value === 'string' && value.startsWith('/uploads/');
                      const label = isPath ? '文件路径' : '文件哈希';
                      const tooltip = isPath ? '点击复制完整文件路径' : '点击复制文件哈希';
                      const toastMsg = isPath ? '文件路径已复制到剪贴板' : '文件哈希已复制到剪贴板';
                      return (
                        <ListItemText
                          primary={label}
                          secondary={
                            <Tooltip title={tooltip}>
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
                                  navigator.clipboard.writeText(value);
                                  toast.success(toastMsg);
                                }}
                              >
                                {value}
                              </Box>
                            </Tooltip>
                          }
                        />
                      );
                    })()}
                  </ListItem>
                )}

                {/* 只有当内容哈希看起来像真正的哈希时才展示 */}
                {selectedCreationDetail.hash &&
                  typeof selectedCreationDetail.hash === 'string' &&
                  !selectedCreationDetail.hash.startsWith('/uploads/') && (
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
