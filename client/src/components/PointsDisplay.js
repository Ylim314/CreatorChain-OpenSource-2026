import React from 'react';
import { useWeb3 } from '../context/Web3ContextFixed';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';

const PointsDisplay = () => {
  const { points, connected } = useWeb3();

  if (!connected) {
    return null;
  }

  return (
    <Card sx={{ minWidth: 200, mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AccountBalanceWallet color="primary" />
          <Typography variant="h6" component="div">
            积分余额
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={`${points.toLocaleString()} 积分`}
            color="primary"
            variant="outlined"
            size="large"
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          积分可用于购买AI创作内容
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
