import React from 'react';
import { Box, Paper, Typography, Alert, AlertTitle } from '@mui/material';
import { InfoOutlined, CheckCircleOutlined } from '@mui/icons-material';

const ErrorInfo = () => {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlined color="primary" />
          控制台错误说明
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>关于 "A listener indicated an asynchronous response" 错误</AlertTitle>
          这个错误是浏览器扩展（通常是MetaMask）的常见问题，不会影响应用功能。
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔍 错误原因
          </Typography>
          <Typography variant="body1" paragraph>
            这个错误通常由以下原因引起：
          </Typography>
          <ul>
            <li>MetaMask扩展与页面通信时连接中断</li>
            <li>多个浏览器扩展同时尝试与页面通信</li>
            <li>页面刷新时机与扩展响应冲突</li>
            <li>网络问题导致扩展无法完成异步操作</li>
          </ul>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ✅ 解决方案
          </Typography>
          <Typography variant="body1" paragraph>
            我们已经实施了以下解决方案：
          </Typography>
          <ul>
            <li>自动过滤MetaMask扩展相关的错误</li>
            <li>使用安全的错误日志记录</li>
            <li>忽略不影响功能的扩展错误</li>
          </ul>
        </Box>

        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>
            <CheckCircleOutlined sx={{ mr: 1 }} />
            应用功能正常
          </AlertTitle>
          这些错误不会影响CreatorChain的任何功能，包括：
          <ul style={{ marginTop: '8px' }}>
            <li>钱包连接和断开</li>
            <li>AI创作功能</li>
            <li>区块链验证</li>
            <li>积分系统</li>
            <li>作品管理</li>
          </ul>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🛠️ 如果错误仍然困扰你
          </Typography>
          <Typography variant="body1" paragraph>
            可以尝试以下方法：
          </Typography>
          <ol>
            <li><strong>重启浏览器</strong>：关闭所有标签页，重新打开浏览器</li>
            <li><strong>更新MetaMask</strong>：确保使用最新版本的MetaMask扩展</li>
            <li><strong>禁用其他扩展</strong>：临时禁用其他可能与Web3相关的扩展</li>
            <li><strong>清除浏览器数据</strong>：清除缓存和本地存储数据</li>
          </ol>
        </Box>

        <Alert severity="warning">
          <AlertTitle>重要提示</AlertTitle>
          这些错误是浏览器扩展的正常行为，不是应用代码的问题。
          我们的应用已经正确处理了这些情况，确保用户体验不受影响。
        </Alert>
      </Paper>
    </Box>
  );
};

export default ErrorInfo;
