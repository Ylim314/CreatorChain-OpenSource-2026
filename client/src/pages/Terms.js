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
import { 
  Gavel, 
  Security, 
  Copyright, 
  Warning, 
  Info
} from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeModeContext';

const Terms = () => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  const sections = [
    {
      icon: <Info />,
      title: "服务描述",
      content: [
        "CreatorChain是一个基于区块链技术的创作者平台，为用户提供数字内容创作、版权保护和交易服务。",
        "平台支持多种数字内容格式，包括但不限于图像、音频、视频、文档等。",
        "我们提供AI辅助创作工具，帮助用户生成原创内容。",
        "平台采用去中心化架构，确保内容的安全性和不可篡改性。",
        "用户可以通过平台进行内容交易、版权授权等商业活动。"
      ]
    },
    {
      icon: <Security />,
      title: "用户责任",
      content: [
        "用户需要确保其上传的内容不侵犯他人版权、商标权或其他知识产权。",
        "用户对其上传的内容承担完全责任，包括但不限于内容的真实性、合法性。",
        "用户不得上传包含恶意代码、病毒或有害内容的文件。",
        "用户不得利用平台进行违法活动或传播不当信息。",
        "用户需要保护其账户安全，不得与他人共享账户信息。"
      ]
    },
    {
      icon: <Copyright />,
      title: "版权和知识产权",
      content: [
        "用户保留其原创内容的版权，平台不会获得用户内容的版权。",
        "用户授予平台展示、分发其内容的非独占性权利。",
        "平台上的所有商标、标识、界面设计等知识产权归CreatorChain所有。",
        "用户不得复制、修改或分发平台的专有技术或代码。",
        "平台尊重第三方知识产权，如发现侵权行为将及时处理。"
      ]
    },
    {
      icon: <Warning />,
      title: "免责声明",
      content: [
        "平台不对用户间的交易承担责任，所有交易风险由用户自行承担。",
        "平台不保证服务的连续性和无错误性，可能因维护、升级等原因暂停服务。",
        "用户使用平台服务产生的任何损失，平台不承担赔偿责任。",
        "平台不对第三方链接或内容承担责任。",
        "用户理解区块链技术的特性，包括不可逆性和去中心化风险。"
      ]
    },
    {
      icon: <Gavel />,
      title: "争议解决",
      content: [
        "本条款受中华人民共和国法律管辖。",
        "如发生争议，双方应首先通过友好协商解决。",
        "协商不成的，可向平台所在地有管辖权的人民法院提起诉讼。",
        "平台保留修改本条款的权利，修改后的条款将在平台公布。",
        "用户继续使用服务即视为接受修改后的条款。"
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
        py: 2 
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{
              color: 'text.primary',
              fontWeight: 800,
              mb: 1
            }}
          >
            服务条款
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '800px', 
              mx: 'auto',
              lineHeight: 1.6,
              mb: 1
            }}
          >
            欢迎使用CreatorChain平台。通过访问和使用我们的服务，您同意遵守以下条款和条件。
          </Typography>
          <Chip 
            label={`最后更新：${new Date().toLocaleDateString()}`}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          />
        </Box>
        
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            bgcolor: 'info.light',
            color: 'info.contrastText'
          }}
        >
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            请仔细阅读本服务条款。使用CreatorChain平台即表示您已阅读、理解并同意受本条款约束。
          </Typography>
        </Alert>

        <Stack spacing={2}>
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
            mt: 3,
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
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
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

export default Terms;
