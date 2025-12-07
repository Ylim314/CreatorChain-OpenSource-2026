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
  CardContent,
  CardActions
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  TextFields as TextIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { useThemeMode } from '../context/ThemeModeContext';

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
  }, [account]);

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
      
      if (!auth || !auth.signature) {
        throw new Error('请先连接钱包并登录');
      }

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
          mb: 2,
          alignItems: 'flex-start'
        }}
      >
        <Avatar
          sx={{
            bgcolor: isError ? '#f44336' : (isUser ? '#1976d2' : '#4caf50'),
            mx: 1
          }}
        >
          {isUser ? <PersonIcon /> : <AIIcon />}
        </Avatar>

        <Paper
          elevation={2}
          sx={{
            maxWidth: '70%',
            p: 2,
            bgcolor: isError ? '#ffebee' : (isUser ? (isDark ? '#1e3a5f' : '#e3f2fd') : (isDark ? '#2d3748' : '#f5f5f5')),
            borderRadius: 2
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
        </Paper>
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
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* 顶部工具栏 */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
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
      </Paper>

      {/* 消息列表 */}
      <Paper
        elevation={3}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          bgcolor: isDark ? '#1a1a1a' : '#fafafa'
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
              color: 'text.secondary'
            }}
          >
            <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" gutterBottom>
              欢迎使用AI创作助手
            </Typography>
            <Typography variant="body2" align="center" sx={{ maxWidth: 400 }}>
              在下方输入您的创作需求,AI将为您生成文本或图像作品
            </Typography>
            <Typography variant="caption" sx={{ mt: 2 }}>
              提示: 使用Shift+Enter换行, Enter直接发送
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(message => renderMessage(message))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Paper>

      {/* 输入框 */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              taskType === 'text'
                ? '描述你想生成的文本内容... (例如: 写一篇关于区块链技术的文章)'
                : '描述你想生成的图像... (例如: 一幅赛博朋克风格的未来城市,高清,8K)'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating || !selectedModel}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isGenerating || !selectedModel}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            {isGenerating ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>

        {!selectedModel && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            ⚠️ 请先在"AI模型配置"页面配置模型
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AIChat;
