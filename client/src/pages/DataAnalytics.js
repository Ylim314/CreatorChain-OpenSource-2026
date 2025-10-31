import React, { useState } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, LinearProgress, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { TrendingUp, Analytics, Timeline, Assessment, ShowChart, PieChart } from '@mui/icons-material';

const DataAnalytics = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const categoryStats = [
    { name: '数字艺术', count: 6547, percentage: 41, color: '#3b82f6' },
    { name: '概念设计', count: 3892, percentage: 25, color: '#8b5cf6' },
    { name: '视觉效果', count: 2347, percentage: 15, color: '#ef4444' },
    { name: '3D模型', count: 1847, percentage: 12, color: '#10b981' },
    { name: '其他', count: 1214, percentage: 7, color: '#f59e0b' }
  ];

  const trendingCreators = [
    { name: 'AI艺术大师', avatar: '🎨', trend: '+45%', works: 89, revenue: '12,300 积分' },
    { name: '数字创想家', avatar: '✨', trend: '+32%', works: 67, revenue: '8,900 积分' },
    { name: '视觉魔法师', avatar: '🌟', trend: '+28%', works: 45, revenue: '6,700 积分' },
    { name: '创意工程师', avatar: '🚀', trend: '+25%', works: 56, revenue: '7,200 积分' }
  ];

  const platformMetrics = [
    { 
      title: '创作数量趋势', 
      value: '∞', 
      change: '持续增长', 
      percentage: '无限可能',
      icon: <TrendingUp color="success" />,
      description: '无限创作可能'
    },
    { 
      title: '用户活跃度', 
      value: '∞', 
      change: '全球参与', 
      percentage: '持续增长',
      icon: <Analytics color="primary" />,
      description: '全球用户参与'
    },
    { 
      title: '交易总额', 
      value: '∞ 积分', 
      change: '持续增长', 
      percentage: '无限可能',
      icon: <Assessment color="warning" />,
      description: '无限交易可能'
    },
    { 
      title: '平均价格', 
      value: '0 Gas', 
      change: '零手续费', 
      percentage: '100%',
      icon: <ShowChart color="info" />,
      description: '零手续费交易'
    }
  ];

  const timeRanges = [
    { value: '24h', label: '24小时' },
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' }
  ];

  const handleMetricClick = (metric) => {
    setSelectedMetric(metric);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold'
            }}
          >
            📊 数据洞察
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            深度分析平台数据，洞察AI创作趋势和市场动态
          </Typography>
        </Box>

        {/* 时间范围选择 */}
        <Box display="flex" justifyContent="center" mb={6}>
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "contained" : "outlined"}
              onClick={() => setTimeRange(range.value)}
              sx={{ 
                mr: 1,
                background: timeRange === range.value ? 'linear-gradient(45deg, #f59e0b, #d97706)' : 'transparent'
              }}
            >
              {range.label}
            </Button>
          ))}
        </Box>

        {/* 核心指标 */}
        <Grid container spacing={4} mb={8}>
          {platformMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 40px rgba(245,158,11,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleMetricClick(metric)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    {metric.icon}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {metric.title}
                  </Typography>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Chip 
                      label={`${metric.change} (${metric.percentage})`}
                      color="success"
                      size="small"
                      icon={<TrendingUp />}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 分类统计 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
            作品分类分析
          </Typography>
          <Card 
            sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px)',
              p: 3
            }}
          >
            <Grid container spacing={3}>
              {categoryStats.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {category.count} 作品
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={category.percentage} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        backgroundColor: `${category.color}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: category.color
                        }
                      }}
                    />
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      占比: {category.percentage}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Box>

        {/* 热门创作者 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            🔥 热门创作者趋势
          </Typography>
          <Grid container spacing={3}>
            {trendingCreators.map((creator, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(15px)',
                    textAlign: 'center',
                    '&:hover': { 
                      transform: 'translateY(-10px)',
                      boxShadow: '0 25px 50px rgba(245,158,11,0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mx: 'auto', 
                        mb: 2,
                        fontSize: '2rem',
                        background: 'linear-gradient(45deg, #f59e0b, #d97706)'
                      }}
                    >
                      {creator.avatar}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      {creator.name}
                    </Typography>
                    <Chip 
                      label={creator.trend}
                      color="success"
                      icon={<TrendingUp />}
                      sx={{ mb: 2 }}
                    />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">作品</Typography>
                      <Typography variant="body2" fontWeight="bold">{creator.works}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">收益</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {creator.revenue}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 实时图表模拟 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            📈 实时数据图表
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  height: 300
                }}
              >
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    创作量趋势
                  </Typography>
                  <Box 
                    sx={{ 
                      height: 200,
                      background: 'linear-gradient(45deg, #3b82f620, #8b5cf620)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #3b82f6'
                    }}
                  >
                    <Typography variant="h6" color="textSecondary">
                      📊 折线图: 过去7天创作量变化
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  height: 300
                }}
              >
                <CardContent sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    收益分布
                  </Typography>
                  <Box 
                    sx={{ 
                      height: 200,
                      background: 'linear-gradient(45deg, #10b98120, #f59e0b20)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #10b981'
                    }}
                  >
                    <Typography variant="h6" color="textSecondary">
                      🥧 饼图: 创作者收益分布
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* 数据导出 */}
        <Box textAlign="center">
          <Typography variant="h4" mb={4} fontWeight="bold">
            📥 数据导出
          </Typography>
          <Box 
            sx={{ 
              p: 4,
              background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
              borderRadius: 3,
              border: '2px solid #f59e0b',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" mb={3}>
              💾 导出分析报告
            </Typography>
            <Typography variant="body1" color="textSecondary" mb={3}>
              获取详细的数据分析报告，包含图表、趋势和洞察
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button 
                variant="contained" 
                sx={{ 
                  background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                  px: 3
                }}
              >
                📊 导出PDF
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  px: 3
                }}
              >
                📋 导出CSV
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 指标详情弹窗 */}
      <Dialog 
        open={!!selectedMetric} 
        onClose={() => setSelectedMetric(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedMetric && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                {selectedMetric.icon}
                <Typography variant="h6" ml={1}>
                  {selectedMetric.title} - 详细分析
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Typography variant="h4" color="primary" fontWeight="bold" mb={1}>
                  {selectedMetric.value}
                </Typography>
                <Typography variant="body1" color="textSecondary" mb={2}>
                  {selectedMetric.description}
                </Typography>
                <Chip 
                  label={`变化: ${selectedMetric.change} (${selectedMetric.percentage})`}
                  color="success"
                  icon={<TrendingUp />}
                />
              </Box>
              
              <Box 
                sx={{ 
                  height: 200,
                  background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #3b82f6',
                  mb: 3
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  📈 {selectedMetric.title}的详细趋势图
                </Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary">
                * 数据基于过去{timeRanges.find(r => r.value === timeRange)?.label}的统计分析
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedMetric(null)}>
                关闭
              </Button>
              <Button variant="contained">
                查看更多
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Footer />
    </Box>
  );
};

export default DataAnalytics;
