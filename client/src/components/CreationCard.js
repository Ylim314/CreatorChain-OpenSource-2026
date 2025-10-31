import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { makeGatewayURL } from '../utils/ipfs';
import { useWeb3 } from '../context/Web3ContextFixed';
import { toast } from 'react-hot-toast';
import apiService from '../services/apiService'; 

const CreationCard = ({ creation }) => {
  const navigate = useNavigate();
  const { account } = useWeb3();
  const [isLiked, setIsLiked] = useState(creation.isLikedByUser || false);

  // 当用户连接/断开钱包时，重新检查收藏状态
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!account || !creation.id) return;
      
      try {
        // 这里可以调用API检查当前用户是否收藏了这个作品
        // const response = await apiService.isFavorite(account, creation.id);
        // setIsLiked(response.isFavorite);
      } catch (error) {
        console.error('检查收藏状态失败:', error);
        // 静默失败，保持默认状态
      }
    };

    checkFavoriteStatus();
  }, [account, creation.id]);

  const handleCardClick = () => {
    navigate(`/creation/${creation.id}`);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation(); // 阻止事件冒泡

    if (!account) {
      toast.error('请先连接钱包再收藏！');
      return;
    }

    try {
      // 调用后端API切换收藏状态
      const response = await apiService.toggleFavorite(account, creation.id);
      setIsLiked(response.isFavorite);
      
      if (response.isFavorite) {
        toast.success('已成功收藏！');
      } else {
        toast.success('已取消收藏');
      }
    } catch (error) {
      // 收藏操作失败
      toast.error('操作失败，请稍后再试。');
    }
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        },
        position: 'relative'
      }}
      onClick={handleCardClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={creation.contentHash ? makeGatewayURL(creation.contentHash) : '/placeholder.jpg'}
        alt={creation.title || '创作作品'}
        loading="lazy"
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {creation.title || '未命名作品'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {creation.description ? 
            (creation.description.length > 100 ? 
              creation.description.substring(0, 100) + '...' : 
              creation.description
            ) : 
            '暂无描述'
          }
        </Typography>
        {creation.creator && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            创作者: {creation.creator.substring(0, 10)}...
          </Typography>
        )}
      </CardContent>
      <IconButton 
        aria-label="add to favorites" 
        onClick={handleLikeClick}
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          color: isLiked ? 'red' : 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        {isLiked ? <Favorite /> : <FavoriteBorder />}
      </IconButton>
    </Card>
  );
};

CreationCard.propTypes = {
  creation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    imageUrl: PropTypes.string,
    creator: PropTypes.string,
    isLikedByUser: PropTypes.bool,
    metadata: PropTypes.object
  }).isRequired
};

export default CreationCard;
