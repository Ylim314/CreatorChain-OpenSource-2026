import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';

/**
 * MetaMask连接测试页面
 * 用于诊断钱包连接问题
 */
const MetaMaskTest = () => {
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState('idle');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const checkBasic = async () => {
    setLog([]);
    addLog('开始基础检查...', 'info');

    if (typeof window.ethereum === 'undefined') {
      addLog('❌ window.ethereum 不存在', 'error');
      setStatus('error');
      return;
    }
    addLog('✅ window.ethereum 存在', 'success');

    if (!window.ethereum.isMetaMask) {
      addLog('⚠️ 不是MetaMask', 'warning');
    } else {
      addLog('✅ 是MetaMask', 'success');
    }

    addLog(`chainId: ${window.ethereum.chainId}`, 'info');
    addLog(`networkVersion: ${window.ethereum.networkVersion}`, 'info');
    addLog(`selectedAddress: ${window.ethereum.selectedAddress || '无'}`, 'info');

    try {
      const isUnlocked = await window.ethereum._metamask?.isUnlocked?.();
      addLog(`解锁状态: ${isUnlocked}`, 'info');
    } catch (error) {
      addLog(`无法检查解锁状态: ${error.message}`, 'warning');
    }

    setStatus('success');
  };

  const testConnection = async () => {
    setLog([]);
    setStatus('testing');
    addLog('开始连接测试...', 'info');

    try {
      // 步骤1: 检查eth_accounts
      addLog('步骤1: 检查已授权账户...', 'info');
      const existingAccounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      addLog(`已授权账户数: ${existingAccounts.length}`, 'info');
      if (existingAccounts.length > 0) {
        addLog(`账户: ${existingAccounts.join(', ')}`, 'success');
      }

      // 步骤2: 请求账户授权
      if (existingAccounts.length === 0) {
        addLog('步骤2: 请求账户授权...', 'info');
        addLog('⏳ 等待用户在MetaMask中确认...', 'warning');
        
        const requestedAccounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        addLog(`✅ 获得授权账户数: ${requestedAccounts.length}`, 'success');
        addLog(`账户: ${requestedAccounts.join(', ')}`, 'success');
      }

      // 步骤3: 获取chainId
      addLog('步骤3: 获取chainId...', 'info');
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      addLog(`chainId: ${chainId} (十进制: ${parseInt(chainId, 16)})`, 'success');

      addLog('✅ 所有测试通过！', 'success');
      setStatus('success');
    } catch (error) {
      addLog(`❌ 测试失败: ${error.message}`, 'error');
      addLog(`错误代码: ${error.code}`, 'error');
      addLog(`完整错误: ${JSON.stringify(error)}`, 'error');
      setStatus('error');
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      default: return 'text.primary';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        MetaMask 连接测试
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        此页面用于诊断MetaMask连接问题。如果连接失败，请查看日志详情。
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={checkBasic}
          disabled={status === 'testing'}
        >
          基础检查
        </Button>
        <Button 
          variant="contained" 
          onClick={testConnection}
          disabled={status === 'testing'}
        >
          连接测试
        </Button>
      </Box>

      {log.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            测试日志
          </Typography>
          <Box sx={{ 
            fontFamily: 'monospace', 
            fontSize: '0.875rem',
            maxHeight: 400,
            overflow: 'auto'
          }}>
            {log.map((entry, index) => (
              <Box 
                key={index} 
                sx={{ 
                  color: getColor(entry.type),
                  mb: 0.5
                }}
              >
                <span style={{ opacity: 0.6 }}>[{entry.timestamp}]</span> {entry.message}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MetaMaskTest;
