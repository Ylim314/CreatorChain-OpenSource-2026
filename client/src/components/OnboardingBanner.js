import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link as RouterLink } from 'react-router-dom';

// 顶部钱包登录引导横幅（未连接钱包时显示，可关闭，关闭状态持久化到 localStorage）
const OnboardingBanner = ({ onConnect, isLoading, isConnected, forceShow = false }) => {
  const [hidden, setHidden] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('cc_onboarding_dismissed');
      setHidden(dismissed === '1' && !forceShow);
    } catch {}
    setHasProvider(typeof window !== 'undefined' && !!window.ethereum);
  }, [forceShow]);

  if (isConnected || (hidden && !forceShow)) return null;

  const handleClose = () => {
    setHidden(true);
    try { localStorage.setItem('cc_onboarding_dismissed', '1'); } catch {}
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        bgcolor: 'rgba(17, 24, 39, 0.9)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        color: '#E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <InfoOutlinedIcon sx={{ color: '#93c5fd' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          使用钱包即登录：无需注册，钱包地址就是你的账号。点击「连接钱包」开始，或查看「新手指南」。
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        {hasProvider ? (
          <Button
            size="small"
            variant="contained"
            onClick={onConnect}
            disabled={isLoading}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
            }}
          >
            {isLoading ? '连接中…' : '连接钱包'}
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            component="a"
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              bgcolor: '#f59e0b',
              '&:hover': { bgcolor: '#d97706' },
              textTransform: 'none',
            }}
          >
            安装 MetaMask
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          component={RouterLink}
          to="/getting-started"
          sx={{
            borderColor: 'rgba(147,197,253,0.6)',
            color: '#93c5fd',
            '&:hover': { borderColor: '#93c5fd', bgcolor: 'rgba(147,197,253,0.12)' },
            textTransform: 'none',
          }}
        >
          新手指南
        </Button>
        <Button
          size="small"
          onClick={handleClose}
          sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}
        >
          关闭
        </Button>
      </Stack>
    </Box>
  );
};

export default OnboardingBanner;
