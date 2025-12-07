import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  HelpOutline,
  Home,
  ContentCopy,
  Favorite,
  Explore,
  Store,
  HowToVote,
  Create,
  School,
  ExpandMore,
  SmartToy,
  Verified,
  Work,
  Refresh,
  PowerSettingsNew,
  CardMembership
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { useThemeMode } from '../context/ThemeModeContext';
import { FormControlLabel, Switch } from '@mui/material';
import OnboardingBanner from './OnboardingBanner';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { account, connectWallet, disconnectWallet, connected, isLoading, isConnecting, points, claimWelcomePoints, favoritesCount, forceRefreshConnection } = useWeb3();
  const { mode, toggleMode } = useThemeMode();
  const [showOnboarding] = useState(false);
  const [marketAnchorEl, setMarketAnchorEl] = useState(null);
  const [createAnchorEl, setCreateAnchorEl] = useState(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState(null);


  const handleCopyAddress = (e) => {
    e.stopPropagation();
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success('钱包地址已复制！');
    }
  };

  const handleClaimPoints = () => {
    if (claimWelcomePoints()) {
      toast.success('恭喜！获得100积分新用户奖励！');
    } else {
      toast.error('您已经领取过新用户奖励了！');
    }
  };

  const handleConnectWallet = async () => {
    // 防止重复点击
    if (isConnecting || isLoading) {
      toast('钱包连接正在进行中，请等待...', {
        icon: '⏳',
        style: {
          border: '1px solid #3b82f6',
          padding: '16px',
          color: '#3b82f6',
        },
      });
      return;
    }

    try {
      await connectWallet();
    } catch (error) {
      console.error('钱包连接失败:', error);
      // 只显示非重复请求的错误
      if (!error.message?.includes('正在进行中')) {
        toast.error(error.message || '钱包连接失败，请重试');
      }
    }
  };


  const handleMarketMenuOpen = (event) => {
    setMarketAnchorEl(event.currentTarget);
  };

  const handleMarketMenuClose = () => {
    setMarketAnchorEl(null);
  };

  const handleCreateMenuOpen = (event) => {
    setCreateAnchorEl(event.currentTarget);
  };

  const handleCreateMenuClose = () => {
    setCreateAnchorEl(null);
  };

  const handleHelpMenuOpen = (event) => {
    setHelpAnchorEl(event.currentTarget);
  };

  const handleHelpMenuClose = () => {
    setHelpAnchorEl(null);
  };

  return (
    <>
      <OnboardingBanner onConnect={handleConnectWallet} isLoading={isLoading || isConnecting} isConnected={connected} forceShow={showOnboarding} />
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 64 }}>
          {/* 左侧：美化后的标�?*/}
          <Box sx={{ flex: '0 0 auto' }}>
            <Grow in={true} timeout={1000}>
              <Typography
                variant="h5"
                component={Link}
                to="/"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 2,
                  background: 'linear-gradient(45deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 8px rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  position: 'relative',
                  '&:hover': {
                    transform: 'scale(1.05) translateY(-2px)',
                    textShadow: '0 4px 16px rgba(255, 255, 255, 0.4)',
                    '&::after': {
                      width: '100%',
                      opacity: 1
                    }
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    width: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
                    transition: 'all 0.3s ease',
                    opacity: 0
                  }
                }}
              >
                CreatorChain
              </Typography>
            </Grow>
          </Box>

          {/* 中间：导航菜�?*/}
          <Fade in={true} timeout={1500}>
            <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <Button 
                color="inherit" 
                component={Link} 
                to="/" 
                startIcon={<Home />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                首页
              </Button>
              
              <Button 
                color="inherit" 
                endIcon={<ExpandMore />}
                onClick={handleCreateMenuOpen}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                创作
              </Button>
              <Menu
                anchorEl={createAnchorEl}
                open={Boolean(createAnchorEl)}
                onClose={handleCreateMenuClose}
                PaperProps={{
                  sx: {
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.95))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
              >
                <MenuItem component={Link} to="/ai-chat" onClick={handleCreateMenuClose}>
                  <ListItemIcon>
                    <SmartToy sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="AI对话创作" sx={{ color: 'white' }} />
                </MenuItem>
                <MenuItem component={Link} to="/ai-creation-studio" onClick={handleCreateMenuClose}>
                  <ListItemIcon>
                    <SmartToy sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="AI创作工坊(旧版)" sx={{ color: 'white' }} />
                </MenuItem>
                <MenuItem component={Link} to="/manual-creation" onClick={handleCreateMenuClose}>
                  <ListItemIcon>
                    <Work sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="手工创作" sx={{ color: 'white' }} />
                </MenuItem>
                <MenuItem component={Link} to="/create" onClick={handleCreateMenuClose}>
                  <ListItemIcon>
                    <Create sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="登记作品上链" sx={{ color: 'white' }} />
                </MenuItem>
              </Menu>

              <Button 
                color="inherit" 
                component={Link} 
                to="/marketplace" 
                startIcon={<Explore />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                探索
              </Button>
              <Menu
                anchorEl={marketAnchorEl}
                open={Boolean(marketAnchorEl)}
                onClose={handleMarketMenuClose}
                PaperProps={{
                  sx: {
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.95))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
              >
                <MenuItem component={Link} to="/my-creations" onClick={handleMarketMenuClose}>
                  <ListItemIcon>
                    <Work sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="我的作品" sx={{ color: 'white' }} />
                </MenuItem>
                <MenuItem component={Link} to="/my-favorites" onClick={handleMarketMenuClose}>
                  <ListItemIcon>
                    <Favorite sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`我的收藏${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`} 
                    sx={{ color: 'white' }} 
                  />
                </MenuItem>
                <MenuItem component={Link} to="/my-licenses" onClick={handleMarketMenuClose}>
                  <ListItemIcon>
                    <CardMembership sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="我的授权" sx={{ color: 'white' }} />
                </MenuItem>
              </Menu>

              <Button 
                color="inherit" 
                component={Link} 
                to="/governance" 
                startIcon={<HowToVote />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                治理
              </Button>

              {connected && (
                <Button 
                  color="inherit" 
                  endIcon={<ExpandMore />}
                  onClick={handleMarketMenuOpen}
                  sx={{
                    borderRadius: '20px',
                    px: 2.5,
                    py: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  我的
                </Button>
              )}

            </Box>
          </Fade>

          {/* 右侧：功能按�?*/}
          <Fade in={true} timeout={2000}>
            <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="帮助菜单">
                <IconButton
                  color="inherit"
                  onClick={handleHelpMenuOpen}
                  sx={{
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'scale(1.1) rotate(5deg)',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  <HelpOutline />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={helpAnchorEl}
                open={Boolean(helpAnchorEl)}
                onClose={handleHelpMenuClose}
                PaperProps={{
                  sx: {
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.95))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem component={Link} to="/getting-started" onClick={handleHelpMenuClose}>
                  <ListItemIcon>
                    <School sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText primary="新手指南" sx={{ color: 'white' }} />
                </MenuItem>
              </Menu>

              <FormControlLabel
                sx={{ 
                  color: 'white',
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }
                }}
                control={
                  <Switch 
                    checked={mode === 'dark'} 
                    onChange={toggleMode}
                    sx={{
                      '& .MuiSwitch-thumb': {
                        backgroundColor: mode === 'dark' ? '#4fc3f7' : '#ffc107'
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: mode === 'dark' ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255, 193, 7, 0.3)'
                      }
                    }}
                  />
                }
                label={mode === 'dark' ? '深色' : '浅色'}
              />

              {connected && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '20px', 
                    p: '8px 16px',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                    }
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #4fc3f7, #29b6f6)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {points.toLocaleString()} 积分
                    </Typography>
                  </Box>
                  {points === 0 && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleClaimPoints}
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                          background: 'linear-gradient(45deg, #45a049, #5cb85c)'
                        }
                      }}
                    >
                      领取奖励
                    </Button>
                  )}
                </Box>
              )}
              
              {account ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '20px', 
                  p: '8px 16px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                  }
                }}>
                  <Tooltip title="点击断开连接（刷新页面后不会自动重连）">
                    <Typography
                      variant="body2"
                      sx={{
                        cursor: 'pointer',
                        color: 'white',
                        fontWeight: 500,
                        fontFamily: 'monospace'
                      }}
                      onClick={disconnectWallet}
                    >
                      {`${account.slice(0, 6)}...${account.slice(-4)}`}
                    </Typography>
                  </Tooltip>
                  <Tooltip title="刷新连接 - 同步MetaMask账户">
                    <IconButton
                      onClick={forceRefreshConnection}
                      size="small"
                      sx={{
                        ml: 1,
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'scale(1.1) rotate(180deg)'
                        }
                      }}
                    >
                      <Refresh fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="复制地址">
                    <IconButton
                      onClick={handleCopyAddress}
                      size="small"
                      sx={{
                        ml: 0.5,
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <ContentCopy fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="断开连接">
                    <IconButton
                      onClick={disconnectWallet}
                      size="small"
                      sx={{
                        ml: 0.5,
                        color: '#ff6b6b',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 107, 0.15)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <PowerSettingsNew fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={handleConnectWallet}
                  sx={{
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)',
                      border: '2px solid rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  {isLoading || isConnecting ? '连接中...' : '开始体验'}
                </Button>
              )}
            </Box>
          </Fade>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar;





