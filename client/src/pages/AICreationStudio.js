import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Slider, FormControl, InputLabel, Select, MenuItem, Button, Chip, Avatar, Alert } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Palette, AutoAwesome, Tune, Psychology, Error, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 默认AI模型（用于演示）
const defaultModels = [
  {
    id: 'demo-gpt4',
    name: 'GPT-4 演示版',
    provider: 'openai',
    defaultModel: 'gpt-4',
    apiKey: 'demo-key',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-dalle',
    name: 'DALL-E 3 演示版',
    provider: 'openai',
    defaultModel: 'dall-e-3',
    apiKey: 'demo-key',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

const AICreationStudio = () => {
  const { mode } = useThemeMode();
  const { account } = useWeb3();
  const navigate = useNavigate();
  const isDark = mode === 'dark';
  
  const [creativity, setCreativity] = useState(75);
  const [style, setStyle] = useState('modern');
  const [complexity, setComplexity] = useState(50);
  const [generatedArt, setGeneratedArt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [iterations] = useState(5);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userModels, setUserModels] = useState([]);
  const [hasConfiguredModels, setHasConfiguredModels] = useState(false);

  // 加载用户配置的AI模型
  useEffect(() => {
    if (account) {
      const savedModels = localStorage.getItem(`ai_models_${account}`);
      if (savedModels) {
        const models = JSON.parse(savedModels);
        setUserModels(models);
        setHasConfiguredModels(models.length > 0);
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0].id);
        }
      } else {
        // 如果没有配置的模型，仅用于展示 demo 模型，但不计入“已配置”
        // 避免在用户未真正填写 API 密钥时显示“已配置 X 个AI模型”
        setUserModels(defaultModels);
        setHasConfiguredModels(false);
        if (!selectedModel && defaultModels.length > 0) {
          setSelectedModel(defaultModels[0].id);
        }
      }
    }
  }, [account, selectedModel]);

  // 本页面主要用于图像 / 艺术创作，只允许选择具备图像能力的模型
  const imageCapableModels = (userModels || []).filter((model) => {
    const caps = model.capabilities || [];
    // 兼容旧数据：如果没有配置能力，则默认认为可用
    if (!caps || caps.length === 0) return true;
    return caps.includes('image') || caps.includes('vision');
  });
  const hasImageModels = imageCapableModels.length > 0;

  const styles = [
    { value: 'modern', label: '现代风格', color: '#3b82f6' },
    { value: 'classical', label: '古典风格', color: '#8b5cf6' },
    { value: 'abstract', label: '抽象风格', color: '#ef4444' },
    { value: 'minimalist', label: '极简风格', color: '#10b981' },
    { value: 'surreal', label: '超现实', color: '#f59e0b' },
    { value: 'realistic', label: '写实风格', color: '#6366f1' },
    { value: 'artistic', label: '艺术风格', color: '#ec4899' }
  ];


  const handleGenerate = async () => {
    if (!hasConfiguredModels) {
      setError('请先配置AI模型');
      return;
    }

    if (!selectedModel) {
      setError('请选择一个AI模型');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    
    try {
      const selectedModelConfig = userModels.find(m => m.id === selectedModel);
      if (!selectedModelConfig) {
        throw new Error('选择的模型配置不存在');
      }

      // 调用真正的AI生成API
      const response = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Address': account || '0x742d35Cc6634C0532925a3b8D4C9Db96C4B4d8b6',
          'Signature': '0x1234567890abcdef...', // 示例签名
          'Message': 'AI Generation Request',
          'Timestamp': Date.now().toString()
        },
        body: JSON.stringify({
          prompt: `Create a ${styles.find(s => s.value === style)?.label} artwork`,
          style: style,
          complexity: complexity,
          creativity: creativity,
          model: selectedModelConfig.defaultModel,
          provider: selectedModelConfig.provider,
          apiKey: selectedModelConfig.apiKey,
          apiUrl: selectedModelConfig.apiUrl,
          iterations: iterations,
          parameters: {
            temperature: 0.7,
            max_tokens: 1000,
            quality: 'high'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setGeneratedArt({
        id: result.id,
        style: style,
        creativity: creativity,
        complexity: complexity,
        preview: result.content,
        imageUrl: result.image_url,
        score: result.score,
        confidence: result.confidence,
        model: result.model,
        cost: result.cost,
        processingTime: result.processing_time,
        metadata: result.metadata
      });
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      // AI Generation Error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: isDark ? '#050816' : '#f5f5f5'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              color: isDark ? '#e5e7eb' : '#111827',
              fontWeight: 700,
              letterSpacing: '0.03em'
            }}
          >
            AI 创作工坊
          </Typography>
          <Typography 
            variant="h6" 
            color={isDark ? 'grey.400' : 'text.secondary'} 
            sx={{ maxWidth: 640, mx: 'auto', mb: 3 }}
          >
            释放AI的创造力，打造独一无二的数字艺术作品
          </Typography>
          
          {/* 配置提示 */}
          {!hasConfiguredModels && (
            <Alert 
              severity="warning" 
              sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => navigate('/ai-model-config')}
                  startIcon={<Settings />}
                >
                  去配置
                </Button>
              }
            >
              <Typography variant="body2">
                您还没有配置AI模型，请先配置您的API密钥才能开始创作
              </Typography>
            </Alert>
          )}
          
          {hasConfiguredModels && !hasImageModels && (
            <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              <Typography variant="body2">
                您已配置 {userModels.length} 个AI模型，但当前页面需要支持<strong>图片 / 视觉</strong>能力的模型。
                请在“AI模型配置”中为模型勾选“图像生成 / 视觉”能力，或新增对应模型后再进行创作。
              </Typography>
            </Alert>
          )}

          {hasImageModels && (
            <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              <Typography variant="body2">
                已配置 {imageCapableModels.length} 个支持图片创作的AI模型，可以开始创作了！
              </Typography>
            </Alert>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* 控制面板 */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                backgroundColor: isDark ? '#0b1120' : '#ffffff',
                borderRadius: 2,
                boxShadow: isDark 
                  ? '0 10px 30px rgba(15,23,42,0.9)' 
                  : '0 10px 30px rgba(15,23,42,0.08)',
                border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                height: 'fit-content'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" mb={3} fontWeight="bold">
                  <Tune sx={{ mr: 1, verticalAlign: 'middle' }} />
                  创作参数
                </Typography>

                {/* 创意度滑块 */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    创意度: {creativity}%
                  </Typography>
                  <Slider
                    value={creativity}
                    onChange={(e, value) => setCreativity(value)}
                    min={0}
                    max={100}
                    sx={{ 
                      color: isDark ? '#38bdf8' : '#2563eb'
                    }}
                  />
                </Box>

                {/* 复杂度滑块 */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    复杂度: {complexity}%
                  </Typography>
                  <Slider
                    value={complexity}
                    onChange={(e, value) => setComplexity(value)}
                    min={0}
                    max={100}
                    sx={{ 
                      color: isDark ? '#a855f7' : '#7c3aed'
                    }}
                  />
                </Box>

                {/* AI模型选择 */}
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel>AI模型</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="AI模型"
                    disabled={!hasImageModels}
                  >
                    {imageCapableModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <Box>
                            <Typography variant="body1">{model.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {model.defaultModel}
                            </Typography>
                          </Box>
                          <Chip 
                            label={model.provider} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 风格选择 */}
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel>艺术风格</InputLabel>
                  <Select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    label="艺术风格"
                  >
                    {styles.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        <Box display="flex" alignItems="center">
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              backgroundColor: s.color,
                              mr: 1 
                            }} 
                          />
                          {s.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={isGenerating || !hasConfiguredModels || !selectedModel}
                  sx={{ 
                    backgroundColor: isDark ? '#2563eb' : '#1d4ed8',
                    '&:hover': {
                      backgroundColor: isDark ? '#1d4ed8' : '#1e40af'
                    },
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {isGenerating ? '正在创作…' : 
                   !hasConfiguredModels ? '请先配置模型' :
                   !selectedModel ? '请选择模型' :
                   '开始创作'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* 生成预览区 */}
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                backgroundColor: isDark ? '#020617' : '#ffffff',
                borderRadius: 2,
                boxShadow: isDark 
                  ? '0 10px 30px rgba(15,23,42,0.9)' 
                  : '0 10px 30px rgba(15,23,42,0.08)',
                border: `1px solid ${isDark ? '#1e293b' : '#e5e7eb'}`,
                height: 500
              }}
            >
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" mb={3} fontWeight="bold">
                  <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                  创作预览
                </Typography>

                {error ? (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '80%',
                      backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.06)',
                      borderRadius: 3,
                      border: '1px solid rgba(248,113,113,0.6)'
                    }}
                  >
                    <Typography variant="h6" color="error">
                      创作失败
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      {error}
                    </Typography>
                  </Box>
                ) : success && generatedArt ? (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '80%',
                      backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)',
                      borderRadius: 3,
                      border: '1px solid rgba(34,197,94,0.6)',
                      mb: 2
                    }}
                  >
                    <Typography variant="h6" color="success.main">
                      创作成功！
                    </Typography>
                  </Box>
                ) : null}
                
                {isGenerating ? (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '80%',
                      backgroundColor: isDark ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.06)',
                      borderRadius: 3,
                      border: '1px solid rgba(79,70,229,0.6)'
                    }}
                  >
                    <Typography variant="h6" color="primary">
                      AI正在创作中...
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      预计需要 2-3 秒
                    </Typography>
                  </Box>
                ) : generatedArt ? (
                  <Box>
                    <Box 
                      sx={{ 
                        height: 300,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: isDark ? '#020617' : '#f9fafb',
                        border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        color={isDark ? 'grey.100' : 'text.primary'} 
                        sx={{ px: 3, textAlign: 'center', whiteSpace: 'pre-wrap' }}
                      >
                        {generatedArt.preview}
                      </Typography>
                      <Chip 
                        label="新作品"
                        color="primary"
                        sx={{ position: 'absolute', top: 16, right: 16 }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">创意度</Typography>
                        <Typography variant="h6">{generatedArt.creativity}%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">复杂度</Typography>
                        <Typography variant="h6">{generatedArt.complexity}%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">风格</Typography>
                        <Typography variant="h6">
                          {styles.find(s => s.value === generatedArt.style)?.label}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '80%',
                      border: `1px dashed ${isDark ? '#4b5563' : '#d1d5db'}`,
                      borderRadius: 2,
                      backgroundColor: isDark ? '#020617' : '#f9fafb'
                    }}
                  >
                    <Typography variant="h6" color="textSecondary">
                      设置参数后点击开始创作
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AI模型展示 */}
        <Box mt={8}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">
              <Psychology sx={{ mr: 1, verticalAlign: 'middle', fontSize: '2rem' }} />
              我的AI模型
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Settings />}
              onClick={() => navigate('/ai-model-config')}
            >
              管理模型
            </Button>
          </Box>
          
          {hasImageModels ? (
            <Grid container spacing={3}>
              {imageCapableModels.map((model) => (
                <Grid item xs={12} sm={6} md={4} key={model.id}>
                  <Card 
                    sx={{ 
                      backgroundColor: isDark ? '#020617' : '#ffffff',
                      textAlign: 'center',
                      border: selectedModel === model.id 
                        ? `1px solid ${isDark ? '#2563eb' : '#1d4ed8'}` 
                        : `1px solid ${isDark ? '#111827' : '#e5e7eb'}`,
                      '&:hover': { 
                        transform: 'translateY(-5px)',
                        boxShadow: isDark 
                          ? '0 18px 40px rgba(15,23,42,0.9)'
                          : '0 18px 40px rgba(15,23,42,0.1)'
                      },
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <CardContent>
                      <Avatar 
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          backgroundColor: isDark ? '#111827' : '#e5e7eb',
                          color: isDark ? '#e5e7eb' : '#111827'
                        }}
                      >
                        <AutoAwesome />
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {model.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        {model.defaultModel}
                      </Typography>
                      <Chip 
                        label={model.provider}
                        color={selectedModel === model.id ? "primary" : "default"}
                        variant={selectedModel === model.id ? "filled" : "outlined"}
                        sx={{ mb: 1 }}
                      />
                      {selectedModel === model.id && (
                        <Chip 
                          label="当前选择"
                          color="success"
                          size="small"
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              py: 6
            }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" mb={2}>
                  还没有配置AI模型
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  配置您的AI模型API密钥，开始创作之旅
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Settings />}
                  onClick={() => navigate('/ai-model-config')}
                >
                  配置AI模型
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default AICreationStudio;
