import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Code, Security, Speed, ExpandMore, PlayArrow, CheckCircle } from '@mui/icons-material';

const SmartContracts = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [activeStep, setActiveStep] = useState(0);
  const [deployedContracts, setDeployedContracts] = useState([]);

  const contractTypes = [
    {
      name: 'ProofOfCreation',
      description: 'AI创作证明合约',
      features: ['创作验证', 'Merkle树存储', '贡献度评分'],
      gasEstimate: '~2,500,000',
      icon: '📜'
    },
    {
      name: 'MultiLayerRights',
      description: '多层版权管理',
      features: ['分层授权', '版税分配', '权限控制'],
      gasEstimate: '~3,200,000',
      icon: '🛡️'
    },
    {
      name: 'CreationRegistry',
      description: '作品注册中心',
      features: ['NFT铸造', '元数据存储', '所有权管理'],
      gasEstimate: '~4,100,000',
      icon: '📋'
    },
    {
      name: 'CreationMarketplace',
      description: '创作市场',
      features: ['交易撮合', '价格发现', '手续费管理'],
      gasEstimate: '~3,800,000',
      icon: '🏪'
    }
  ];

  const deploymentSteps = [
    {
      label: '环境准备',
      description: '配置部署环境和参数',
      details: ['检查网络连接', '验证钱包余额', '设置Gas价格']
    },
    {
      label: '合约编译',
      description: '编译智能合约代码',
      details: ['语法检查', '优化编译', '生成字节码']
    },
    {
      label: '部署执行',
      description: '将合约部署到区块链',
      details: ['提交交易', '等待确认', '获取合约地址']
    },
    {
      label: '验证测试',
      description: '验证合约功能',
      details: ['功能测试', '安全检查', '性能评估']
    }
  ];

  const handleDeploy = (contractName) => {
    setDeployedContracts(prev => [...prev, {
      name: contractName,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      timestamp: new Date().toLocaleString(),
      status: 'success'
    }]);
  };

  const codeExample = `// ProofOfCreation.sol - 核心功能展示
contract ProofOfCreation {
    struct ContributionFactors {
        uint8 promptComplexity;    // 提示词复杂度 (0-100)
        uint8 parameterOptimization; // 参数优化度 (0-100)
        uint8 iterationCount;      // 迭代次数权重 (0-100)
        uint8 modelDifficulty;     // 模型难度 (0-100)
        uint8 originalityScore;    // 原创性评分 (0-100)
    }
    
    function calculateContributionScore(
        ContributionFactors memory factors
    ) public pure returns (uint256) {
        // 加权计算：提示词30% + 参数25% + 迭代20% + 模型15% + 原创10%
        return (factors.promptComplexity * 30 +
                factors.parameterOptimization * 25 +
                factors.iterationCount * 20 +
                factors.modelDifficulty * 15 +
                factors.originalityScore * 10) / 100;
    }
}`;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #0ea5e9, #3b82f6)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold'
            }}
          >
            ⚡ 智能合约
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            基于区块链的智能合约系统，提供安全、透明、自动化的版权保护
          </Typography>
        </Box>

        {/* 合约展示 */}
        <Grid container spacing={4} mb={8}>
          {contractTypes.map((contract, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  height: '100%',
                  border: deployedContracts.find(c => c.name === contract.name) ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 20px 40px rgba(14,165,233,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {contract.icon}
                    </Typography>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {contract.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {contract.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      核心功能：
                    </Typography>
                    {contract.features.map((feature, idx) => (
                      <Box key={idx} display="flex" alignItems="center" mb={0.5}>
                        <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="body2" color="textSecondary">
                      Gas估算: {contract.gasEstimate}
                    </Typography>
                    {deployedContracts.find(c => c.name === contract.name) && (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ✅ 已部署
                      </Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant={deployedContracts.find(c => c.name === contract.name) ? "outlined" : "contained"}
                    onClick={() => handleDeploy(contract.name)}
                    disabled={!!deployedContracts.find(c => c.name === contract.name)}
                    sx={{ 
                      background: deployedContracts.find(c => c.name === contract.name) ? 'transparent' : 'linear-gradient(45deg, #0ea5e9, #3b82f6)'
                    }}
                  >
                    {deployedContracts.find(c => c.name === contract.name) ? '🔍 查看详情' : '🚀 部署合约'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 部署流程 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            📋 部署流程
          </Typography>
          <Card 
            sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px)',
              p: 3
            }}
          >
            <Stepper activeStep={activeStep} orientation="vertical">
              {deploymentSteps.map((step, index) => (
                <Step key={index}>
                  <StepLabel 
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body1" color="textSecondary" mb={2}>
                      {step.description}
                    </Typography>
                    <Box mb={2}>
                      {step.details.map((detail, idx) => (
                        <Box key={idx} display="flex" alignItems="center" mb={1}>
                          <PlayArrow color="primary" sx={{ fontSize: 16, mr: 1 }} />
                          <Typography variant="body2">{detail}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(index + 1)}
                      sx={{ mr: 1 }}
                      disabled={index === deploymentSteps.length - 1}
                    >
                      {index === deploymentSteps.length - 1 ? '完成' : '下一步'}
                    </Button>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Card>
        </Box>

        {/* 代码示例 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
            智能合约代码
          </Typography>
          <Accordion 
            sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px)'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" fontWeight="bold">
                📜 ProofOfCreation.sol - 核心代码片段
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box 
                sx={{ 
                  background: isDark ? '#1e293b' : '#f8fafc',
                  borderRadius: 2,
                  p: 3,
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '0.9rem',
                  overflow: 'auto'
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  <code>{codeExample}</code>
                </pre>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* 已部署合约列表 */}
        {deployedContracts.length > 0 && (
          <Box mb={8}>
            <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
              ✅ 已部署合约
            </Typography>
            <Grid container spacing={3}>
              {deployedContracts.map((contract, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card 
                    sx={{ 
                      background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                      border: '2px solid #10b981'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {contract.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        地址: {contract.address}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        部署时间: {contract.timestamp}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 技术特性 */}
        <Box textAlign="center">
          <Typography variant="h4" mb={4} fontWeight="bold">
            🛡️ 技术保障
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Security sx={{ fontSize: '4rem', color: '#ef4444', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  安全性
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  经过严格安全审计，采用最佳安全实践
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Speed sx={{ fontSize: '4rem', color: '#10b981', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  高效性
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  优化的Gas消耗，快速的交易确认
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Code sx={{ fontSize: '4rem', color: '#3b82f6', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  可扩展性
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  模块化设计，支持功能扩展和升级
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default SmartContracts;
