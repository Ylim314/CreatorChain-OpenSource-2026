import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Card,
  CardMedia,
  CardActions,
  styled,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  AutoAwesome as AIIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  TextFields as TextIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { useThemeMode } from '../context/ThemeModeContext';

// 自定义样式组件
const GradientPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== '$isDark',
})(({ theme, $isDark }) => ({
  background: $isDark 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  backdropFilter: 'blur(10px)',
  border: $isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => !['$isUser', '$isDark'].includes(prop),
})(({ theme, $isUser, $isDark }) => ({
  maxWidth: '75%',
  padding: theme.spacing(2),
  borderRadius: $isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  background: $isUser 
    ? ($isDark ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
    : ($isDark ? alpha(theme.palette.background.paper, 0.8) : alpha('#fff', 0.95)),
  backdropFilter: 'blur(10px)',
  boxShadow: $isUser 
    ? '0 8px 32px rgba(102, 126, 234, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: $isUser 
      ? '0 12px 40px rgba(102, 126, 234, 0.4)'
      : '0 12px 40px rgba(0, 0, 0, 0.15)',
  }
}));

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => !['$isUser', '$isDark'].includes(prop),
})(({ theme, $isUser, $isDark }) => ({
  width: 40,
  height: 40,
  background: $isUser
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
}));

const InputContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$isDark',
})(({ theme, $isDark }) => ({
  background: $isDark
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha('#fff', 0.9),
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  padding: theme.spacing(1.5),
  border: `2px solid ${$isDark ? alpha('#667eea', 0.3) : alpha('#667eea', 0.2)}`,
  transition: 'all 0.3s ease',
  '&:focus-within': {
    border: `2px solid ${$isDark ? alpha('#667eea', 0.6) : alpha('#667eea', 0.5)}`,
    boxShadow: `0 0 0 4px ${alpha('#667eea', 0.1)}`,
  }
}));

const AIChat = () => {
  const { account } = useWeb3();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  // 状态管理
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [taskType, setTaskType] = useState('text'); // 'text' or 'image'
  const [userModels, setUserModels] = useState([]);
  
  const messagesEndRef = useRef(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载用户配置的模型
  useEffect(() => {
    if (!account) return;
    
    const savedModels = localStorage.getItem(`ai_models_${account}`);
    if (savedModels) {
      const models = JSON.parse(savedModels);
      setUserModels(models);
      
      // 自动选择第一个模型
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].id);
      }
    }
  }, [account, selectedModel]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedModel || isGenerating) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      taskType: taskType,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // 获取认证信息
      const authData = localStorage.getItem('auth');
      const auth = authData ? JSON.parse(authData) : null;
      
      console.log('🔍 认证数据检查:', { 
        hasAuthData: !!authData, 
        hasAuth: !!auth, 
        hasSignature: !!auth?.signature,
        hasAddress: !!auth?.address,
        account 
      });
      
      if (!auth || !auth.signature || !auth.address) {
        console.error('❌ 认证数据不完整:', auth);
        throw new Error('请先连接钱包并登录');
      }
      
      console.log('✅ 认证检查通过:', { address: auth.address, hasSignature: !!auth.signature });
      
      console.log('✅ 认证检查通过:', { address: auth.address, hasSignature: !!auth.signature });

      const selectedModelConfig = userModels.find(m => m.id === selectedModel);
      if (!selectedModelConfig) {
        throw new Error('选择的模型配置不存在');
      }

      // 调用AI API
      const response = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': account || auth.address,
          'Signature': auth.signature,
          'Message': auth.message,
          'Message-Encoding': 'base64',
          'Timestamp': auth.timestamp
        },
        body: JSON.stringify({
          prompt: inputMessage,
          model: selectedModelConfig.defaultModel,
          task: taskType,
          provider: selectedModelConfig.provider,
          style: 'modern',
          complexity: 7,
          creativity: 8,
          parameters: {
            temperature: 0.7,
            max_tokens: taskType === 'text' ? 2000 : 1000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `生成失败: ${response.statusText}`);
      }

      const result = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: taskType === 'text' ? result.content : null,
        imageUrl: taskType === 'image' ? result.image_url : null,
        taskType: taskType,
        model: selectedModelConfig.defaultModel,
        provider: selectedModelConfig.provider,
        timestamp: new Date().toLocaleTimeString(),
        metadata: result.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI生成错误:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'error',
        content: error.message || '生成失败,请重试',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存作品到链上
  const handleSaveToBlockchain = async (message) => {
    try {
      // TODO: 实现保存到区块链的逻辑
      console.log('保存作品到链上:', message);
      alert('作品已保存到区块链!');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  // 渲染消息
  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          mb: 3,
          alignItems: 'flex-start',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        <StyledAvatar $isUser={isUser}>
          {isUser ? <PersonIcon /> : <AIIcon />}
        </StyledAvatar>

        <MessageBubble
          elevation={0}
          $isUser={isUser}
          $isDark={isDark}
          sx={{
            mx: 1.5,
            bgcolor: isError ? alpha('#f44336', 0.1) : undefined,
            border: isError ? '1px solid #f44336' : undefined
          }}
        >
          {/* 消息头部 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {message.timestamp}
            </Typography>
            {message.model && (
              <Chip
                label={message.model}
                size="small"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
            {message.taskType && (
              <Chip
                icon={message.taskType === 'text' ? <TextIcon /> : <ImageIcon />}
                label={message.taskType === 'text' ? '文本' : '图像'}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* 文本内容 */}
          {message.content && (
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: isError ? '#d32f2f' : 'text.primary'
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* 图像内容 */}
          {message.imageUrl && (
            <Card sx={{ mt: 2, maxWidth: 500 }}>
              <CardMedia
                component="img"
                image={message.imageUrl}
                alt="AI生成的图像"
                sx={{ maxHeight: 400, objectFit: 'contain' }}
              />
              <CardActions>
                <Button
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveToBlockchain(message)}
                >
                  保存到链上
                </Button>
                <Button
                  size="small"
                  href={message.imageUrl}
                  target="_blank"
                  download
                >
                  下载图片
                </Button>
              </CardActions>
            </Card>
          )}

          {/* 元数据 */}
          {message.metadata && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Typography variant="caption" color="text.secondary">
                提供商: {message.provider} | 置信度: {(message.metadata.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
          )}
        </MessageBubble>
      </Box>
    );
  };

  // 处理Enter键发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 100px)', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 3,
      background: isDark 
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* 顶部工具栏 */}
      <GradientPaper elevation={0} $isDark={isDark} sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>选择AI模型</InputLabel>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              label="选择AI模型"
              size="small"
            >
              {userModels.map(model => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>任务类型</InputLabel>
            <Select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              label="任务类型"
              size="small"
            >
              <MenuItem value="text">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextIcon sx={{ mr: 1 }} fontSize="small" />
                  文本生成
                </Box>
              </MenuItem>
              <MenuItem value="image">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} fontSize="small" />
                  图像生成
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            清空对话
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="caption" color="text.secondary">
            当前账户: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '未连接'}
          </Typography>
        </Box>
      </GradientPaper>

      {/* 消息列表 */}
      <GradientPaper
        elevation={0}
        $isDark={isDark}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          mb: 2,
          borderRadius: 3,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease-in'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                animation: 'pulse 2s infinite'
              }}
            >
              <AIIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              欢迎使用AI智能创作
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 500, mt: 2, mb: 3, opacity: 0.8 }}>
              🎨 在下方输入您的创作需求,AI将为您生成精美的文本或图像作品
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip 
                icon={<TextIcon />}
                label="文本生成" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                icon={<ImageIcon />}
                label="图像创作" 
                color="secondary" 
                variant="outlined"
              />
              <Chip 
                label="一键上链" 
                color="success" 
                variant="outlined"
              />
            </Box>
            <Typography variant="caption" sx={{ mt: 4, opacity: 0.6 }}>
              💡 提示: 使用 Shift+Enter 换行, Enter 直接发送
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(message => renderMessage(message))}
            <div ref={messagesEndRef} />
          </>
        )}
      </GradientPaper>

      {/* 输入框 */}
      <InputContainer $isDark={isDark}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              taskType === 'text'
                ? '✨ 描述你想生成的文本内容... (例如: 写一篇关于区块链技术的文章)'
                : '🎨 描述你想生成的图像... (例如: 一幅赛博朋克风格的未来城市,霓虹灯光,高清,8K)'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating || !selectedModel}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: 'none',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                fontSize: '1rem',
                lineHeight: 1.6,
              }
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isGenerating || !selectedModel}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              width: 48,
              height: 48,
              transition: 'all 0.3s ease',
              '&:hover': { 
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                transform: 'scale(1.05)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': { 
                background: alpha('#667eea', 0.3),
                transform: 'none'
              }
            }}
          >
            {isGenerating ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>

        {!selectedModel && (
          <Typography variant="caption" color="error" sx={{ mt: 1.5, display: 'block' }}>
            ⚠️ 请先在"AI模型配置"页面配置模型
          </Typography>
        )}
      </InputContainer>
    </Box>
  );
};

export default AIChat;

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 15px 50px rgba(102, 126, 234, 0.5);
    }
  }
`;
if (!document.head.querySelector('style[data-ai-chat]')) {
  style.setAttribute('data-ai-chat', 'true');
  document.head.appendChild(style);
}
