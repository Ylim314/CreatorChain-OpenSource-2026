import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, Chip, LinearProgress, Divider } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HowToVote, Gavel, AccountBalance, TrendingUp, CheckCircle, Cancel } from '@mui/icons-material';

const GovernanceVoting = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const proposals = [
    {
      id: 'CGP-001',
      title: '关于调整交易手续费的提案',
      status: 'active',
      proposer: '社区理事会',
      endDate: '2025-09-10',
      votesFor: 78,
      votesAgainst: 22,
      description: '建议将平台交易手续费从2.5%下调至2.0%，以激励更多创作者和收藏家参与交易。'
    },
    {
      id: 'CGP-002',
      title: '启动第二期创作者激励计划',
      status: 'active',
      proposer: 'AI艺术家小明',
      endDate: '2025-09-15',
      votesFor: 92,
      votesAgainst: 8,
      description: '提议从社区金库中拨出100,000 积分，用于奖励本季度优秀创作者，推动社区内容生态发展。'
    },
    {
      id: 'CGP-003',
      title: '关于集成新的AI绘画模型的提案',
      status: 'passed',
      proposer: '技术委员会',
      endDate: '2025-08-20',
      votesFor: 95,
      votesAgainst: 5,
      description: '建议平台集成最新的 "DreamWeaver V3" AI模型，为创作者提供更强大的创作工具。'
    },
    {
      id: 'CGP-004',
      title: '修改社区徽章等级标准',
      status: 'failed',
      proposer: '创意设计师小红',
      endDate: '2025-08-15',
      votesFor: 45,
      votesAgainst: 55,
      description: '建议提高钻石和铂金等级创作者的门槛，以保证徽章的稀有性。'
    }
  ];

  const governanceStats = [
    { label: '总提案数', value: '128', icon: <Gavel color="primary" /> },
    { label: '参与投票人数', value: '5,432', icon: <HowToVote color="success" /> },
    { label: '社区金库', value: '1,250,000 积分', icon: <AccountBalance color="warning" /> },
    { label: '活跃创作者', value: '8,976', icon: <TrendingUp color="info" /> }
  ];

  const handleVote = (proposal, vote) => {
    // In a real app, this would trigger a smart contract interaction
    alert(`您对提案 ${proposal.id} 投了 "${vote}" 票`);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)'
        : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold'
            }}
          >
            🏛️ 治理与投票
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            社区驱动的去中心化治理，共同决定平台的未来
          </Typography>
        </Box>

        {/* 治理统计 */}
        <Grid container spacing={4} mb={8}>
          {governanceStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  textAlign: 'center',
                  '&:hover': { 
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(99,102,241,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 提案列表 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🗳️ 当前提案
          </Typography>
          <Grid container spacing={4}>
            {proposals.map((proposal) => (
              <Grid item xs={12} md={6} key={proposal.id}>
                <Card 
                  sx={{ 
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(15px)',
                    borderLeft: `5px solid ${
                      proposal.status === 'active' ? '#3b82f6' : 
                      proposal.status === 'passed' ? '#10b981' : '#ef4444'
                    }`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {proposal.title}
                      </Typography>
                      <Chip 
                        label={proposal.status.toUpperCase()}
                        color={
                          proposal.status === 'active' ? 'primary' : 
                          proposal.status === 'passed' ? 'success' : 'error'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                      {proposal.description}
                    </Typography>
                    
                    <Box mb={3}>
                      <Typography variant="body2" fontWeight="bold">
                        投票进度
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={proposal.votesFor}
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: `${
                            proposal.status === 'active' ? '#ef4444' : 
                            proposal.status === 'passed' ? '#10b981' : '#ef4444'
                          }40`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: proposal.status === 'active' ? '#3b82f6' : 
                                             proposal.status === 'passed' ? '#10b981' : '#ef4444'
                          }
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" color="success.main">
                          赞成: {proposal.votesFor}%
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          反对: {proposal.votesAgainst}%
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="textSecondary">
                        提案人: {proposal.proposer}
                      </Typography>
                      {proposal.status === 'active' ? (
                        <Box>
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleVote(proposal, '赞成')}
                          >
                            <CheckCircle sx={{ fontSize: 16, mr: 0.5 }} />
                            赞成
                          </Button>
                          <Button 
                            variant="contained" 
                            color="error" 
                            size="small"
                            onClick={() => handleVote(proposal, '反对')}
                          >
                            <Cancel sx={{ fontSize: 16, mr: 0.5 }} />
                            反对
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          投票已结束
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 如何参与 */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" mb={4} fontWeight="bold">
            💡 如何参与治理
          </Typography>
          <Box 
            sx={{ 
              p: 4,
              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
              borderRadius: 3,
              border: '2px solid #6366f1',
              maxWidth: 800,
              mx: 'auto'
            }}
          >
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" mb={2}>1. 获得投票权</Typography>
                  <Typography variant="body2" color="textSecondary">
                    通过创作、交易或参与社区活动获得积分，达到一定积分即可获得投票权。
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" mb={2}>2. 提交提案</Typography>
                  <Typography variant="body2" color="textSecondary">
                    持有足够积分即可发起关于平台发展的提案。
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" mb={2}>3. 参与投票</Typography>
                  <Typography variant="body2" color="textSecondary">
                    使用您的积分对社区提案进行投票，影响平台决策。
                  </Typography>
                </Grid>
              </Grid>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                mt: 4,
                background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                px: 4,
                py: 1.5
              }}
            >
              🚀 开始您的治理之旅
            </Button>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default GovernanceVoting;
