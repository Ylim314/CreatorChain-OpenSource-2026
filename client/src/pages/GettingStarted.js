import React from 'react';
import { Box, Button, Card, CardContent, Chip, Grid, Link, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useWeb3 } from '../context/Web3ContextFixed';

const StepItem = ({ icon, title, children }) => (
  <Card
    elevation={0}
    sx={{
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      boxShadow: 1,
      borderRadius: 2,
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        {icon}
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>{title}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {children}
      </Typography>
    </CardContent>
  </Card>
);

const GettingStarted = () => {
  const { connectWallet, isLoading, connected } = useWeb3();

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Chip
          label="新手入门"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
          variant="filled"
        />
        <Typography variant="h4" sx={{ mt: 1.5, fontWeight: 800, color: 'text.primary' }}>
          使用钱包即登录：3 步快速开始
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
          在 CreatorChain，你无需注册账号。你的区块链钱包地址就是你的身份标识。
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <StepItem icon={<AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />} title="1. 安装或准备钱包">
            推荐使用 MetaMask 浏览器扩展或移动端 App。没有安装？
            <Link href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', ml: 0.5, fontWeight: 600 }}>
              点击前往下载 <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'text-top' }} />
            </Link>
          </StepItem>
        </Grid>
        <Grid item xs={12} md={6}>
          <StepItem icon={<SecurityIcon sx={{ color: 'primary.main' }} />} title="2. 保障你的助记词安全">
            助记词/私钥等同于你的银行密码。请勿截图或分享给任何人；使用密码管理器妥善保存。
          </StepItem>
        </Grid>
        <Grid item xs={12} md={6}>
          <StepItem icon={<BoltIcon sx={{ color: 'primary.main' }} />} title="3. 一键连接，完成登录">
            安装完成后，点击右上角“连接钱包”并在钱包里确认即可登录。连接后可创建、上架、治理投票等。
          </StepItem>
        </Grid>
        <Grid item xs={12} md={6}>
          <StepItem icon={<HelpOutlineIcon sx={{ color: 'primary.main' }} />} title="常见问题">
            没有余额也能浏览与体验大部分功能；需要上链操作（如发布、交易、投票）时，才会产生少量链上手续费（Gas）。
          </StepItem>
        </Grid>
      </Grid>

      <Card
        sx={{
          mt: 3,
          bgcolor: 'success.light',
          border: 1,
          borderColor: 'success.main',
          borderRadius: 2
        }}
        elevation={0}
      >
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            <Typography variant="body1" sx={{ color: 'success.contrastText', fontWeight: 600 }}>
              {connected ? '已连接钱包，可以开始创作与探索。' : '准备就绪？现在就连接钱包开始体验。'}
            </Typography>
            {!connected && (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={connectWallet}
                disabled={isLoading}
                sx={{ ml: 'auto', textTransform: 'none', fontWeight: 700 }}
              >
                {isLoading ? '连接中…' : '立即连接钱包'}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>小贴士</Typography>
        <List dense>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 28 }}><span style={{ color: 'var(--mui-palette-primary-main)' }}>•</span></ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: 'text.secondary' } }} primary="若浏览器无钱包扩展，页面会提供下载入口。" />
          </ListItem>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 28 }}><span style={{ color: 'var(--mui-palette-primary-main)' }}>•</span></ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: 'text.secondary' } }} primary="钱包地址会显示在右上角，点击可复制或在未来扩展更多操作。" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default GettingStarted;
