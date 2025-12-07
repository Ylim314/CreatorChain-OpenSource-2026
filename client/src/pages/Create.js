import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  Button,
  Container
} from '@mui/material';
import {
  SmartToy,
  Palette,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';
import { GlassCard } from '../components/ui/GlassCard';

// 创作方法选择
const creationMethods = [
  {
    id: 'ai',
    title: '🤖 AI创作',
    description: '使用AI模型生成创作内容',
    icon: <SmartToy sx={{ fontSize: 60 }} />,
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    link: '/ai-chat',
    badge: 'AI生成',
    features: [
      '多种AI模型支持',
      '智能提示词优化',
      '批量生成功能',
      '参数可调节'
    ]
  },
  {
    id: 'manual',
    title: '🎨 手工创作', 
    description: '上传自己手工制作的作品',
    icon: <Palette sx={{ fontSize: 60 }} />,
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    link: '/manual-creation',
    badge: '手工创作',
    features: [
      '多格式文件支持',
      '创作工具记录',
      '过程描述详细',
      '时间线记录'
    ]
  }
];

const Create = () => {
  const navigate = useNavigate();

  const handleMethodSelect = (method) => {
    navigate(method.link);
  };

  return (
    <PageLayout>
      <Container maxWidth="lg" className="py-8">
        {/* 页面标题 */}
        <Box className="text-center mb-12">
          <Typography variant="h3" className="mb-4 font-bold">
            🎨 创作中心
          </Typography>
          <Typography variant="h6" color="text.secondary" className="mb-2">
            选择你的创作方式，开启数字创作之旅
          </Typography>
          <Typography variant="body1" color="text.secondary">
            无论AI创作还是手工创作，都能享受区块链版权保护
          </Typography>
        </Box>

        {/* 创作方法选择 */}
        <Grid container spacing={4} className="mb-8">
          {creationMethods.map((method) => (
            <Grid item xs={12} md={6} key={method.id}>
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  method.id === 'ai' 
                    ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20' 
                    : 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
                }`}
                onClick={() => handleMethodSelect(method)}
              >
                <CardContent className="p-8 text-center">
                  {/* 图标 */}
                  <Box className="mb-6">
                    {method.icon}
                  </Box>
                  
                  {/* 标题和徽章 */}
                  <Box className="mb-4">
                    <Typography variant="h4" className="mb-2 font-bold">
                      {method.title}
                    </Typography>
                    <Box 
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        method.id === 'ai' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {method.badge}
                    </Box>
                  </Box>
                  
                  {/* 描述 */}
                  <Typography variant="body1" color="text.secondary" className="mb-6">
                    {method.description}
                  </Typography>
                  
                  {/* 特性列表 */}
                  <Box className="text-left mb-6">
                    {method.features.map((feature, index) => (
                      <Box key={index} className="flex items-center mb-2">
                        <Box 
                          className={`w-2 h-2 rounded-full mr-3 ${
                            method.id === 'ai' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* 选择按钮 */}
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    className={`w-full ${
                      method.id === 'ai' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    开始{method.id === 'ai' ? 'AI' : '手工'}创作
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 创作说明 */}
        <GlassCard className="p-6">
          <Typography variant="h5" className="mb-4 text-center">
            🔐 双重确权保护
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Typography variant="h6" className="mb-2">
                  📝 创作过程记录
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  详细记录创作过程、工具使用、时间线等信息，确保创作的真实性
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Typography variant="h6" className="mb-2">
                  ✅ 最终确认上链
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  作品完成后进行最终确认，生成区块链证明，永久保护版权
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>

        {/* 作品类型标识说明 */}
        <GlassCard className="p-6 mt-6">
          <Typography variant="h5" className="mb-4 text-center">
            🏷️ 作品类型标识
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Box className="inline-block bg-purple-100 dark:bg-purple-900 px-4 py-2 rounded-lg mb-2">
                  <Typography variant="body1" className="font-medium">
                    🤖 AI生成
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  AI创作的作品将明确标记为"AI生成"，确保透明度
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Box className="inline-block bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg mb-2">
                  <Typography variant="body1" className="font-medium">
                    🎨 手工创作
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  手工创作的作品将标记为"手工创作"，突出原创性
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>

        {/* 可见性控制说明 */}
        <GlassCard className="p-6 mt-6">
          <Typography variant="h5" className="mb-4 text-center">
            🔒 作品可见性控制
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Typography variant="h6" className="mb-2">
                  🌍 公开作品
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  所有人可见，可以浏览、点赞、收藏，适合展示优秀作品
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="text-center">
                <Typography variant="h6" className="mb-2">
                  🔒 私密作品
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  仅自己可见，保护隐私，适合未完成或私人作品
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>
      </Container>
    </PageLayout>
  );
};

export default Create;