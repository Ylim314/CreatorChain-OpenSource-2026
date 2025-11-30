import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  CheckCircle
} from '@mui/icons-material';

const AccountSelectorDialog = ({ open, onClose, onSelect, accounts = [] }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 如果有账户列表，默认选择第一个
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  const handleSelect = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    try {
      await onSelect(selectedAccount);
      onClose();
    } catch (error) {
      console.error('选择账户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWallet sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            选择钱包账户
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1, fontSize: '0.875rem' }}>
          请选择要连接的钱包账户
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {accounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              未找到可用账户
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {accounts.map((account, index) => (
              <ListItem key={account} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={selectedAccount === account}
                  onClick={() => setSelectedAccount(account)}
                  sx={{
                    borderRadius: '12px',
                    border: selectedAccount === account 
                      ? '2px solid #3b82f6' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    bgcolor: selectedAccount === account 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    '&:hover': {
                      bgcolor: selectedAccount === account 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'rgba(255, 255, 255, 0.1)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {selectedAccount === account ? (
                      <CheckCircle sx={{ color: '#3b82f6' }} />
                    ) : (
                      <AccountBalanceWallet sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: 'white', fontWeight: 500, fontFamily: 'monospace' }}>
                        {formatAddress(account)}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                        账户 {index + 1}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          取消
        </Button>
        <Button
          onClick={handleSelect}
          disabled={!selectedAccount || loading}
          variant="contained"
          sx={{
            bgcolor: '#3b82f6',
            '&:hover': {
              bgcolor: '#2563eb'
            },
            textTransform: 'none',
            px: 3
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? '连接中...' : '连接'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountSelectorDialog;

