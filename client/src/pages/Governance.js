import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CardContent, 
  Grid, 
  LinearProgress, 
  Button, 
  Chip 
} from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import PageLayout from '../components/ui/PageLayout';
import { AnimatedCard } from '../components/ui/GlassCard';

const Governance = () => {
  const { mode } = useThemeMode();
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const mock = [
        { 
          id: 1,
          title: '创作者激励计划',
          proposer: '0x742d35Cc6634C0532925a3b8D4C9Db96C4B4d8b6',
          forVotes: 156,
          againstVotes: 29, 
          endTime: '2025-12-15',
          description: '通过创作优质作品获得平台积分奖励'
        },
      { 
        id: 2, 
        title: '提案#2：引入作品质押挖矿计划', 
        status: '投票中', 
        forVotes: 71, 
        againstVotes: 29, 
        endTime: '2025-12-15',
        description: '通过优质作品获得平台积分奖励'
      },
      { 
        id: 3, 
        title: '提案#3：推出季度创作者奖励基金', 
        status: '已通过', 
        forVotes: 85, 
        againstVotes: 15, 
        endTime: '2025-12-10',
        description: '设立专项基金奖励杰出创作者和活跃贡献者'
      }
    ];
    setProposals(mock);
  }, []);

  const total = (p) => p.forVotes + p.againstVotes || 1;

  // DAO Statistics
  const daoStats = [
    { 
      title: '活跃提案', 
      value: '∞', 
      icon: '📊',
      description: '无限治理可能'
    },
    { 
      title: '参与用户', 
      value: '∞', 
      icon: '👥',
      description: '全球用户参与'
    },
    { 
      title: '通过率', 
      value: '100%', 
      icon: '✅',
      description: '智能决策系统'
    }
  ];

  return (
    <PageLayout backgroundType="gradient">
      <Box sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            社区治理 (DAO)
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              maxWidth: 700,
              mx: 'auto',
              mb: 4
            }}
          >
            查看最新提案并参与投票，为平台发展出力
          </Typography>
        </Box>

        {/* DAO Statistics */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {daoStats.map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <AnimatedCard delay={index * 0.1}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: mode === 'dark' ? 'white' : 'text.primary',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                    }}
                  >
                    {stat.description}
                  </Typography>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>

        {/* Proposals Grid */}
        <Grid container spacing={3}>
          {proposals.map((proposal, index) => (
            <Grid key={proposal.id} item xs={12} md={6}>
              <AnimatedCard delay={index * 0.1}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 2 
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: mode === 'dark' ? 'white' : 'text.primary',
                        fontWeight: 700,
                        flex: 1,
                        mr: 2
                      }}
                    >
                      {proposal.title}
                    </Typography>
                    <Chip 
                      label={proposal.status}
                      variant="outlined"
                      sx={{ 
                        color: proposal.status === '投票中' ? '#4ECDC4' : '#00FF7F',
                        borderColor: proposal.status === '投票中' 
                          ? 'rgba(78, 205, 196, 0.5)' 
                          : 'rgba(0, 255, 127, 0.5)',
                        background: proposal.status === '投票中' 
                          ? 'rgba(78, 205, 196, 0.1)' 
                          : 'rgba(0, 255, 127, 0.1)',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      mb: 2
                    }}
                  >
                    {proposal.description}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                      mb: 2,
                      display: 'block'
                    }}
                  >
                    截止时间：{proposal.endTime}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1 
                  }}>
                    <Typography sx={{ 
                      color: '#00FF7F',
                      fontWeight: 600
                    }}>
                      赞成 {proposal.forVotes}%
                    </Typography>
                    <Typography sx={{ 
                      color: '#FF6B6B',
                      fontWeight: 600
                    }}>
                      反对 {proposal.againstVotes}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(proposal.forVotes/total(proposal))*100}
                    sx={{ 
                      height: 10, 
                      borderRadius: 5, 
                      background: mode === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0,0,0,0.1)',
                      mb: 3,
                      '& .MuiLinearProgress-bar': { 
                        background: 'linear-gradient(90deg, #00FF7F, #4ECDC4)',
                        borderRadius: 5
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      sx={{
                        background: 'linear-gradient(45deg, #00FF7F, #00C851)',
                        color: 'black',
                        fontWeight: 700,
                        borderRadius: 2,
                        '&:hover': {
                          background: 'linear-gradient(45deg, #00C851, #007E33)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      赞成
                    </Button>
                    <Button 
                      variant="contained" 
                      sx={{
                        background: 'linear-gradient(45deg, #FF6B6B, #FF5252)',
                        color: 'white',
                        fontWeight: 700,
                        borderRadius: 2,
                        '&:hover': {
                          background: 'linear-gradient(45deg, #FF5252, #D32F2F)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      反对
                    </Button>
                    <Button 
                      variant="outlined" 
                      sx={{ 
                        borderColor: '#4ECDC4',
                        color: '#4ECDC4',
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#26C6DA',
                          color: '#26C6DA',
                          background: 'rgba(78, 205, 196, 0.1)'
                        }
                      }}
                    >
                      查看详情
                    </Button>
                  </Box>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default Governance;
