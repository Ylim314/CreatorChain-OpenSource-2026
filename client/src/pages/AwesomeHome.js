import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Container, Button, Alert } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticlesNew from '../components/ui/ParticlesNew';
import Card from '../components/ui/Card';
import GradientFuzzyText from '../components/ui/GradientFuzzyText';
import ThemedFuzzyText from '../components/ui/ThemedFuzzyText';

const features = [
  {
    title: "🔒 区块链认证",
    description: "基于不可篡改的区块链技术，确保作品版权永久保护",
    gradient: "from-blue-400 via-blue-500 to-blue-600",
    link: "/blockchain-verification"
  },
  {
    title: "🎨 多元化创作",
    description: "支持AI创作、手工创作，释放无限创意可能",
    gradient: "from-purple-400 via-purple-500 to-purple-600",
    link: "/create"
  },
  {
    title: "🌟 社区生态",
    description: "构建繁荣的数字创作者社区，共同推动创意产业发展",
    gradient: "from-green-400 via-green-500 to-green-600",
    link: "/community-ecosystem"
  },
  {
    title: "⚡ 智能合约",
    description: "自动化版权管理，确保创作者获得应有的收益", 
    gradient: "from-sky-400 via-sky-500 to-sky-600",
    link: "/smart-contracts"
  },
  {
    title: "📊 数据洞察",
    description: "深度分析平台数据，洞察创作趋势和市场动态",
    gradient: "from-yellow-400 via-orange-500 to-orange-600",
    link: "/data-analytics"
  },
  {
    title: "🏛️ 治理与投票",
    description: "社区驱动的决策机制，让每个创作者都有发言权",
    gradient: "from-indigo-400 via-indigo-500 to-indigo-600",
    link: "/governance-voting"
  }
];

const AwesomeHome = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { connected, account } = useWeb3();
  
  // 处理卡片点击事件
  const handleCardClick = (link) => {
    navigate(link);
  };

  
  // 根据主题模式动态设置样式
  const isDark = mode === 'dark';
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const overlayColor = isDark 
    ? 'from-black/70 via-purple-900/30 to-blue-900/50'
    : 'from-white/70 via-blue-100/60 to-purple-100/50';
  const cardBg = isDark 
    ? 'from-gray-900/80 to-gray-800/80' 
    : 'from-white/90 to-gray-50/90';
  const cardBorder = isDark ? 'border-gray-700/50' : 'border-gray-300/50';
  const cardTextColor = isDark ? 'text-white' : 'text-gray-900';
  const cardDescColor = isDark ? 'text-gray-300' : 'text-gray-600';

  return (
    <Box className={`relative min-h-screen overflow-hidden ${bgColor}`}>
      {/* 炫酷的粒子背景 */}
      <ParticlesNew 
        particleCount={120} 
        colors={['#00D4FF', '#FF00E5', '#FFFF00', '#00FF88', '#FF4444']} 
      />
      
      {/* 渐变覆盖层 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${overlayColor}`} />

      {/* 内容层 */}
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero区域 */}
        <Container maxWidth="lg" className="pt-32 pb-20">
          <div className="text-center">
            <div className="mb-8">
              <GradientFuzzyText
                fontSize="clamp(2rem, 8vw, 6rem)"
                fontWeight={900}
                gradientColors={['#00D4FF', '#FF00E5', '#FFFF00']}
                baseIntensity={0.12}
                hoverIntensity={0.35}
                enableHover={true}
              >
                CreatorChain
              </GradientFuzzyText>
              <style>
                {`
                  @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                  }
                `}
              </style>
            </div>

            <div className="mb-12">
              <ThemedFuzzyText
                fontSize="clamp(1rem, 3vw, 2rem)"
                fontWeight={400}
                baseIntensity={0.035}
                hoverIntensity={0.18}
                enableHover={true}
                autoReduceBaseInDark={true}
                sharpenOverlayAlpha={0.55}
                highContrast={true}
                glow={true}
                glowStrength={0.6}
              >
                在去中心化的世界中，保护您的创作，实现价值共享
              </ThemedFuzzyText>
            </div>

            {/* 炫酷按钮 */}
            <div className="flex gap-6 justify-center flex-wrap mb-16">
              <Button
                onClick={() => navigate('/ai-chat')}
                className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white px-12 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                ✨ 开始创作
              </Button>
              
              <Button
                onClick={() => navigate('/explore')}
                variant="outlined"
                className="relative overflow-hidden border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-12 py-4 rounded-full text-lg font-bold backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                style={{
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                }}
              >
                🚀 探索作品
              </Button>
              
            </div>
            
            
            {/* 钱包状态显示 */}
            {connected && account && (
              <div className="mt-6 max-w-md mx-auto">
                <Alert severity="success">
                  钱包已连接: {account.slice(0, 6)}...{account.slice(-4)}
                </Alert>
              </div>
            )}
          </div>
        </Container>

        {/* 特性网格 */}
        <Container maxWidth="lg" className="py-20">
          <Box className="mb-16 text-center">
            <Typography 
              variant="h2" 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{
                background: 'linear-gradient(45deg, #00D4FF, #FF00E5)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text', 
                color: 'transparent'
              }}
            >
              为什么选择CreatorChain？
            </Typography>
            <Typography 
              variant="h6" 
              className="text-gray-400"
              sx={{
                textAlign: 'center',
                width: '100%',
                display: 'block',
                mx: 'auto',
                maxWidth: '600px'
              }}
            >
              我们为创作者提供了一个全新的、去中心化的平台，让创意真正属于创作者
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card 
                  className={`h-full p-6 bg-gradient-to-br ${cardBg} border ${cardBorder} backdrop-blur-xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:transform hover:scale-105`}
                  style={{
                    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => handleCardClick(feature.link)}
                >
                  {/* 悬浮时的光效 */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${feature.gradient.split(' ')[1]}, ${feature.gradient.split(' ')[3]})`
                    }}
                  />
                  
                  <Typography variant="h6" sx={{ color: cardTextColor }} className="font-bold mb-3 relative z-10">
                    {feature.title}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: cardDescColor }} className="relative z-10 leading-relaxed">
                    {feature.description}
                  </Typography>
                  
                  {/* 添加点击提示箭头 */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Typography variant="body2" sx={{ color: cardTextColor, fontSize: '12px' }}>
                        →
                      </Typography>
                    </div>
                  </div>
                  
                  {/* 底部发光线 */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(90deg, ${feature.gradient.split(' ')[1]}, ${feature.gradient.split(' ')[3]})`
                    }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* 统计数据 */}
        <Container maxWidth="lg" className="py-20">
          <div className="text-center">
            <Typography 
              variant="h2" 
              className="text-4xl md:text-5xl font-bold mb-16"
              style={{
                background: 'linear-gradient(45deg, #00FF88, #00D4FF)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              平台特色
            </Typography>
            
            <Grid container spacing={8}>
              {[
                { value: '∞', label: '无限可能', color: '#FF00E5', link: '/explore' },
                { value: '100%', label: '版权保护', color: '#00D4FF', link: '/explore' }, 
                { value: '0 Gas', label: '零手续费', color: '#FFFF00', link: '/marketplace' },
                { value: '24/7', label: '全天候服务', color: '#00FF88', link: '/governance' }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <div 
                    className="text-center group cursor-pointer p-6 rounded-xl backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-110"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      boxShadow: `0 0 20px ${stat.color}20`
                    }}
                    onClick={() => handleCardClick(stat.link)}
                  >
                    <Typography 
                      variant="h2" 
                      className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ color: cardDescColor }}>
                      {stat.label}
                    </Typography>
                  </div>
                </Grid>
              ))}
            </Grid>
          </div>
        </Container>

        <Footer />
      </div>
    </Box>
  );
};

export default AwesomeHome;
