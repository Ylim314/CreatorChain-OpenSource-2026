import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Cancel
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { useThemeMode } from '../context/ThemeModeContext';
import PageLayout from '../components/ui/PageLayout';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';

const MyLicenses = () => {
  const navigate = useNavigate();
  const { connected, account } = useWeb3();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLicenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.get('/v1/marketplace/licenses');
      setLicenses(response.licenses || []);
    } catch (error) {
      console.error('加载授权列表失败:', error);
      setError('加载授权列表失败，请稍后重试');
      toast.error('加载授权列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected && account) {
      loadLicenses();
    } else {
      setIsLoading(false);
    }
  }, [connected, account, loadLicenses]);

  // 监听授权购买事件，自动刷新列表
  useEffect(() => {
    const handleLicensePurchased = () => {
      console.log('检测到新授权购买，刷新列表...');
      if (connected && account) {
        loadLicenses();
      }
    };

    window.addEventListener('licensePurchased', handleLicensePurchased);
    return () => {
      window.removeEventListener('licensePurchased', handleLicensePurchased);
    };
  }, [connected, account, loadLicenses]);

  const getStatusIcon = (status, expiresAt) => {
    if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) {
      return <Cancel color="error" />;
    }
    if (status === 'active') {
      return <CheckCircle color="success" />;
    }
    return <Schedule color="warning" />;
  };

  const getStatusText = (status, expiresAt) => {
    if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) {
      return '已过期';
    }
    if (status === 'active') {
      return '有效';
    }
    if (status === 'revoked') {
      return '已撤销';
    }
    return status;
  };

  const getLicenseTypeText = (type) => {
    const types = {
      'personal': '个人授权',
      'commercial': '商业授权',
      'exclusive': '独家授权'
    };
    return types[type] || type;
  };

  if (!connected) {
    return (
      <PageLayout backgroundType="aurora">
        <Box sx={{ py: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            请先连接钱包以查看您的授权
          </Alert>
        </Box>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout backgroundType="aurora">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout backgroundType="aurora">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadLicenses}>
            重试
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundType="aurora">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          我的授权
        </Typography>

        {licenses.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            您还没有购买任何授权
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {licenses.map((license) => (
              <Grid item xs={12} sm={6} md={4} key={license.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDark
                      ? 'rgba(30, 30, 30, 0.8)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark
                        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                        : '0 8px 32px rgba(0, 0, 0, 0.2)',
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/creation/${license.token_id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" component="h2">
                          Token ID: {license.token_id}
                        </Typography>
                        {getStatusIcon(license.status, license.expires_at)}
                      </Box>

                      <Chip
                        label={getLicenseTypeText(license.license_type)}
                        color="primary"
                        size="small"
                      />

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          授权方: {license.licensor_address?.substring(0, 6)}...
                          {license.licensor_address?.substring(license.licensor_address.length - 4)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          价格: {license.price} 积分
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          期限: {license.duration} 天
                        </Typography>
                        {license.expires_at && (
                          <Typography variant="body2" color="text.secondary">
                            到期时间: {new Date(license.expires_at).toLocaleDateString('zh-CN')}
                          </Typography>
                        )}
                      </Box>

                      <Chip
                        label={getStatusText(license.status, license.expires_at)}
                        color={
                          license.status === 'active' && (!license.expires_at || new Date(license.expires_at) >= new Date())
                            ? 'success'
                            : 'error'
                        }
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageLayout>
  );
};

export default MyLicenses;

