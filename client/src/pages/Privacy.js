import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack,
  Chip,
  Alert
} from '@mui/material';
import { Security, Info, ContactMail, Update } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeModeContext';

const Privacy = () => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  const sections = [
    {
      icon: <Info />,
      title: "信息收集",
      content: [
        "个人标识信息：当您创建账户或个人资料时，我们可能收集您的昵称、头像、联系方式等。",
        "钱包信息：连接的区块链钱包地址用于身份验证和交易处理。",
        "创作内容：您上传的艺术作品、元数据、描述等内容。",
        "使用数据：访问日志、设备信息、IP地址、浏览器类型等技术信息。",
        "交互数据：点赞、评论、收藏、购买等平台互动行为。"
      ]
    },
    {
      icon: <Security />,
      title: "信息使用",
      content: [
        "服务提供：处理您的创作上传、展示、交易等核心功能。",
        "身份验证：通过钱包地址验证用户身份，确保交易安全。",
        "个性化推荐：基于您的兴趣和行为提供相关内容推荐。",
        "平台改进：分析使用模式以优化用户体验和功能设计。",
        "安全防护：检测和预防欺诈、滥用等不当行为。",
        "法律合规：满足适用法律法规的要求。"
      ]
    },
    {
      icon: <ContactMail />,
      title: "信息分享",
      content: [
        "公开展示：您的创作作品和基本资料信息将在平台上公开展示。",
        "区块链记录：交易记录、所有权信息等将永久记录在区块链上。",
        "服务提供商：与IPFS存储、支付处理等第三方服务商共享必要信息。",
        "法律要求：在法律要求或保护平台权益时可能披露相关信息。",
        "用户同意：在获得您明确同意的情况下分享特定信息。"
      ]
    },
    {
      icon: <Update />,
      title: "数据保护",
      content: [
        "加密传输：使用SSL/TLS协议保护数据传输安全。",
        "访问控制：实施严格的内部访问权限管理制度。",
        "定期审计：定期进行安全评估和漏洞扫描。",
        "数据备份：建立可靠的数据备份和恢复机制。",
        "匿名处理：在可能的情况下对数据进行匿名化处理。",
        "及时更新：持续更新安全措施以应对新的威胁。"
      ]
    }
  ];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: dark
            ? 'linear-gradient(180deg, #0B1220 0%, #0D1325 100%)'
            : '#F8FAFC'
        }}
      />
      <Box sx={{ 
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh', 
        py: 4 
      }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              mb: 2
            }}
          >
            隐私政策
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '800px', 
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            CreatorChain 致力于保护您的隐私权。本政策详细说明我们如何收集、使用、存储和保护您的个人信息。
          </Typography>
          <Chip 
            label={`最后更新：${new Date().toLocaleDateString()}`}
            sx={{ 
              mt: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          />
        </Box>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4,
            bgcolor: 'info.light',
            color: 'info.contrastText'
          }}
        >
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            由于CreatorChain基于区块链技术，部分信息（如交易记录、NFT所有权）将永久且公开地记录在区块链上，无法删除或修改。请在使用前充分理解这一特性。
          </Typography>
        </Alert>
        <Stack spacing={4}>
          {sections.map((section, index) => (
            <Card 
              key={index}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    color: 'primary.main', 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {section.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 700
                    }}
                  >
                    {section.title}
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {section.content.map((item, itemIndex) => (
                    <Box key={itemIndex} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mt: 1,
                        mr: 2,
                        flexShrink: 0
                      }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.7
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
        <Card 
          sx={{
            mt: 6,
            bgcolor: 'primary.light',
            border: 1,
            borderColor: 'primary.main'
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 2, fontWeight: 700 }}>
              联系我们
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.primary',
                mb: 2,
                lineHeight: 1.6
              }}
            >
              如果您对本隐私政策有任何疑问或需要行使您的隐私权利，请通过以下方式联系我们：
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Chip 
                label="GitHub主页" 
                component="a"
                href="https://github.com/Ylim314"
                target="_blank"
                rel="noopener noreferrer"
                clickable
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  textDecoration: 'none'
                }}
              />
              <Chip 
                label="邮箱：2023105450118@stu.sias.edu.cn" 
                component="a"
                href="mailto:2023105450118@stu.sias.edu.cn"
                clickable
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  textDecoration: 'none'
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Privacy;
