import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  OutlinedInput
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Save,
  Api
} from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeModeContext';
import { useWeb3 } from '../context/Web3ContextFixed';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-hot-toast';

const AIModelConfig = () => {
  const { mode } = useThemeMode();
  const { account, connected } = useWeb3();
  const isDark = mode === 'dark';
  
  const [models, setModels] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    apiKey: '',
    apiUrl: '',
    defaultModel: '',
    useProxy: false,
    advancedParams: {},
    capabilities: []
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  // 支持的AI提供商（精简版：只保留主流、易理解的几个，避免给用户“全部都已深度集成”的错觉）
  const providers = [
    // 国产大模型 - 更受国内用户欢迎
    {
      id: 'kimi',
      name: 'Kimi (月之暗面)',
      apiUrl: 'https://api.moonshot.cn/v1',
      // 示例：按照官方文档常见的上下文版本列出，实际请以官网为准
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      imageModels: [],
      audioModels: [],
      capabilities: ['text', 'vision'],
      description: '面向长文本与图像理解的旗舰模型，模型名称和价格以 Moonshot 官网为准',
      website: 'https://www.kimi.com/',
      isDomestic: true
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      apiUrl: 'https://api.deepseek.com/v1',
      // 示例：chat / reasoner 为官方当前主推方向，具体版本号请查阅 DeepSeek 文档
      models: ['deepseek-chat', 'deepseek-reasoner'],
      imageModels: [],
      audioModels: [],
      capabilities: ['text', 'vision', 'code'],
      description: '支持高性能对话与推理（含思考模式），模型能力与价格以 DeepSeek 官网为准',
      website: 'https://chat.deepseek.com/',
      isDomestic: true
    },
    {
      id: 'tongyi',
      name: '通义千问 (阿里)',
      apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
      // 2025最新版本 - 文本生成模型
      models: [
        'qwen3-max',           // 最强旗舰模型(2025.09)
        'qwen-plus',           // 稳定版均衡模型(支持100万Token上下文)
        'qwen-flash',          // 极速版(速度快/成本低)
        'qwen-turbo',          // 不推荐(建议用qwen-flash替代)
        'qwen3-vl-plus',       // 视觉理解Plus(仅用于图文理解,不是生成)
        'qwen3-vl-flash'       // 视觉理解极速版
      ],
      // 视觉理解模型(图片转文字) - 已包含在models中
      visionModels: ['qwen3-vl-plus', 'qwen3-vl-flash'],
      // 图像生成模型(文字转图片)
      imageModels: [
        'qwen-image-plus',     // 通义千问文生图旗舰版(0.2元/张)
        'qwen-image',          // 通义千问文生图标准版
        'wan2.5-t2i-preview',  // 通义万相2.5预览版
        'wan2.2-t2i-plus'      // 通义万相2.2专业版
      ],
      audioModels: [],
      capabilities: ['text', 'vision', 'image_generation'],
      description: '通义千问2025最新模型:qwen3-max旗舰/qwen-plus均衡/qwen-flash极速。图像生成支持qwen-image-plus(中英文渲染)和wan2.5(艺术创作)。视觉理解支持qwen3-vl系列',
      website: 'https://help.aliyun.com/zh/model-studio/getting-started/models',
      isDomestic: true
    },
    // 豆包(抖音旗下)
    {
      id: 'doubao',
      name: '豆包 (字节跳动)',
      apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      // 豆包主推模型
      models: [
        'doubao-pro-32k',           // 专业版32K上下文
        'doubao-lite-32k',          // 轻量版32K
        'doubao-character-32k'      // 角色扮演版
      ],
      // 豆包视觉模型
      visionModels: ['doubao-vision-pro'],
      // 豆包图像生成(如有)
      imageModels: [],
      audioModels: [],
      capabilities: ['text', 'vision'],
      description: '字节跳动豆包大模型,支持长文本对话和图文理解。Pro版性能强劲,Lite版经济实惠,Character版擅长角色扮演',
      website: 'https://www.volcengine.com/docs/82379/1302050',
      isDomestic: true
    },
    // 智谱 GLM 系列
    {
      id: 'glm',
      name: 'GLM (智谱AI)',
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
      // 示例：GLM-4.6 / GLM-4.5 等旗舰模型，具体请参考官方模型概览
      models: ['glm-4.6', 'glm-4.5', 'glm-4-air'],
      imageModels: [],
      audioModels: [],
      capabilities: ['text', 'vision', 'code'],
      description: '国产通用大模型 GLM 系列示例，支持多模态与代码能力，型号以智谱文档为准',
      website: 'https://docs.bigmodel.cn/cn/guide/start/model-overview',
      isDomestic: true
    },
    // 国际大模型（示例模型列表，仅供参考，具体可按各平台最新文档调整）
    {
      id: 'openai',
      name: 'OpenAI',
      apiUrl: 'https://api.openai.com/v1',
      // 示例：按照当前文档常见的通用与高阶模型命名，实际请以 OpenAI Models 文档为准
      models: ['gpt-5.1', 'gpt-5', 'gpt-4.1', 'gpt-4o'],
      imageModels: ['gpt-image-1'],
      capabilities: ['text', 'image', 'audio', 'video'],
      description: 'OpenAI 通用与多模态模型示例，具体可参考 OpenAI Models 官方文档',
      website: 'https://platform.openai.com/docs/models',
      isDomestic: false
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
      // 示例：Gemini 3 / 2.5 / 2.0 系列模型，具体请参考 Google Gemini 模型文档
      models: ['gemini-3-pro-preview', 'gemini-3-pro-image-preview', 'gemini-2.5-pro', 'gemini-2.0-flash'],
      imageModels: ['gemini-3-pro-image-preview'],
      audioModels: [],
      capabilities: ['text', 'image', 'audio', 'video'],
      description: 'Google Gemini 多模态模型示例，支持文本、图片、音频和视频等能力，具体型号以官方文档为准',
      website: 'https://ai.google.dev/gemini-api/docs/models?hl=zh-cn',
      isDomestic: false
    },
    {
      id: 'custom',
      name: '自定义',
      apiUrl: '',
      models: [],
      imageModels: [],
      description: '自定义API端点',
      isDomestic: false
    }
  ];

  // 加载用户配置的模型
  const loadUserModels = useCallback(() => {
    if (!account) return;
    
    const savedModels = localStorage.getItem(`ai_models_${account}`);
    if (savedModels) {
      setModels(JSON.parse(savedModels));
    }
  }, [account]);

  useEffect(() => {
    loadUserModels();
  }, [loadUserModels]);

  const saveUserModels = (newModels) => {
    if (!account) return;
    localStorage.setItem(`ai_models_${account}`, JSON.stringify(newModels));
    setModels(newModels);
  };

  const handleAddModel = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      provider: '',
      apiKey: '',
      apiUrl: '',
      defaultModel: '',
      useProxy: false,
      advancedParams: {},
      // 默认用途先留空，或在选择提供商时自动带出
      capabilities: []
    });
    setDialogOpen(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      provider: model.provider,
      apiKey: model.apiKey,
      apiUrl: model.apiUrl,
      defaultModel: model.defaultModel,
      useProxy: model.useProxy || false,
      advancedParams: model.advancedParams || {},
      capabilities: model.capabilities || []
    });
    setDialogOpen(true);
  };

  const handleDeleteModel = (modelId) => {
    const newModels = models.filter(m => m.id !== modelId);
    saveUserModels(newModels);
    toast.success('模型配置已删除');
  };

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setFormData({
      ...formData,
      provider: providerId,
      apiUrl: provider.apiUrl,
      defaultModel: provider.models[0] || '',
      advancedParams: {},
      // 默认用途从提供商能力预填，用户仍可以在表单中调整
      capabilities: provider?.capabilities || []
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.provider || !formData.apiKey) {
      toast.error('请填写必要信息');
      return;
    }

    const modelData = {
      id: editingModel ? editingModel.id : Date.now().toString(),
      name: formData.name,
      provider: formData.provider,
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      defaultModel: formData.defaultModel,
      useProxy: formData.useProxy,
      advancedParams: formData.advancedParams,
      capabilities: formData.capabilities || [],
      createdAt: editingModel ? editingModel.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newModels;
    if (editingModel) {
      newModels = (models || []).map(m => m.id === editingModel.id ? modelData : m);
    } else {
      newModels = [...(models || []), modelData];
    }

    saveUserModels(newModels);
    setDialogOpen(false);
    toast.success(editingModel ? '模型配置已更新' : '模型配置已添加');
  };

  const testApiConnection = async () => {
    if (!formData.apiKey || !formData.apiUrl) {
      toast.error('请先填写API密钥和地址');
      return;
    }

    setTesting(true);
    try {
      // 测试API连接
      const response = await fetch('/api/v1/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: formData.provider,
          apiKey: formData.apiKey,
          apiUrl: formData.apiUrl,
          model: formData.defaultModel
        })
      });

      if (response.ok) {
        toast.success('API连接测试成功！');
      } else {
        toast.error('API连接测试失败');
      }
    } catch (error) {
      toast.error('连接测试出错：' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const getProviderInfo = (providerId) => {
    return providers.find(p => p.id === providerId);
  };

  const getStatusColor = (model) => {
    // 这里可以根据最后测试时间等判断状态
    return 'success';
  };

  if (!connected) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: isDark 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d5f 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box textAlign="center">
            <Typography variant="h4" mb={4} color="textPrimary">
              请先连接钱包
            </Typography>
            <Typography variant="body1" color="textSecondary">
              连接钱包后即可配置您的AI模型
            </Typography>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d5f 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
    }}>
      <Navbar />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 页面标题 */}
        <Box mb={4}>
          <Typography variant="h3" fontWeight="bold" mb={2}>
            AI模型配置
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={3}>
            配置您的AI模型API密钥，享受更强大的创作功能
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>多模态支持：</strong> 平台支持文本、图像、音频等多种AI模型。
              文本模型用于对话和创作，图像模型用于生成图片，音频模型用于语音合成。
              你可以根据创作需求配置相应的模型。
            </Typography>
          </Alert>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💡 <strong>使用说明</strong>：您需要从AI模型提供商处获取API密钥，然后在平台中配置。
              所有API调用费用由您与提供商直接结算，平台不收取额外费用。下方列出的模型名称均为示例推荐，具体可用型号与价格请以各提供商官网文档为准。
            </Typography>
          </Alert>
        </Box>

        {/* 快速开始指南 */}
        <Card sx={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          mb: 4
        }}>
          <CardContent>
            <Typography variant="h6" mb={2} fontWeight="bold">
              🚀 快速开始
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" mb={1}>1</Typography>
                  <Typography variant="body2" color="textSecondary">
                    选择AI提供商并注册账号
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" mb={1}>2</Typography>
                  <Typography variant="body2" color="textSecondary">
                    获取API密钥
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" mb={1}>3</Typography>
                  <Typography variant="body2" color="textSecondary">
                    在平台中配置密钥
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 支持的提供商 */}
        <Box mb={4}>
          <Typography variant="h5" mb={3} fontWeight="bold">
            支持的AI提供商
          </Typography>
          <Grid container spacing={3}>
            {(providers || []).map((provider) => (
              <Grid item xs={12} sm={6} md={4} key={provider.id}>
                <Card sx={{ 
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  height: '100%',
                  '&:hover': { transform: 'translateY(-2px)' },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {provider.name}
                      </Typography>
                      {provider.isDomestic && (
                        <Chip 
                          label="国内" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {provider.description}
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                        支持模型: {(provider.models || []).length} 个
                        {(provider.imageModels || []).length > 0 && ` (图像模型 ${(provider.imageModels || []).length} 个)`}
                        {(provider.audioModels || []).length > 0 && ` (音频模型 ${(provider.audioModels || []).length} 个)`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {(provider.capabilities || []).map((capability) => (
                          <Chip 
                            key={capability}
                            label={
                              capability === 'text' ? '文本' :
                              capability === 'image' ? '图像' :
                              capability === 'audio' ? '音频' :
                              capability === 'vision' ? '视觉' :
                              capability === 'code' ? '代码' : capability
                            }
                            size="small"
                            color={
                              capability === 'text' ? 'primary' :
                              capability === 'image' ? 'secondary' :
                              capability === 'audio' ? 'success' :
                              capability === 'vision' ? 'info' :
                              capability === 'code' ? 'warning' : 'default'
                            }
                            variant="outlined"
                            sx={{ fontSize: '0.6rem', height: 20 }}
                          />
                        ))}
                      </Box>
                    </Box>
                    {provider.website && (
                      <Box mb={2}>
                        <Typography variant="caption" color="primary">
                          🌐 {provider.website}
                        </Typography>
                      </Box>
                    )}
                    <Button 
                      size="small" 
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setFormData({
                          name: provider.name,
                          provider: provider.id,
                          apiKey: '',
                          apiUrl: provider.apiUrl,
                          defaultModel: provider.models[0] || '',
                          useProxy: false,
                          advancedParams: {}
                        });
                        setDialogOpen(true);
                      }}
                    >
                      配置
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 已配置的模型 */}
        <Box mb={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              已配置的模型 ({(models || []).length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleAddModel}
            >
              添加模型
            </Button>
          </Box>

          {(models || []).length === 0 ? (
            <Card sx={{ 
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              py: 6
            }}>
              <CardContent>
                <Typography variant="h6" color="textSecondary" mb={2}>
                  暂无配置的模型
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                  添加您的第一个AI模型配置开始创作
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={handleAddModel}
                >
                  添加模型
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {(models || []).map((model) => (
                <Grid item xs={12} md={6} key={model.id}>
                  <Card sx={{ 
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { transform: 'translateY(-2px)' },
                    transition: 'all 0.3s ease'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" mb={1}>
                            {model.name}
                          </Typography>
                          <Chip 
                            label={getProviderInfo(model.provider)?.name || model.provider}
                            color={getStatusColor(model)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {(model.capabilities || []).map((capability) => (
                              <Chip
                                key={capability}
                                label={
                                  capability === 'text' ? '文本' :
                                  capability === 'image' ? '图像' :
                                  capability === 'audio' ? '音频' :
                                  capability === 'video' ? '视频' :
                                  capability === 'vision' ? '视觉' :
                                  capability === 'code' ? '代码' : capability
                                }
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                        <Box>
                          <Tooltip title="编辑">
                            <IconButton size="small" onClick={() => handleEditModel(model)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除">
                            <IconButton size="small" onClick={() => handleDeleteModel(model.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        API地址: {model.apiUrl}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        默认模型: {model.defaultModel}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mb={2}>
                        密钥: {model.apiKey ? '••••••••' + model.apiKey.slice(-4) : '未设置'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleEditModel(model)}
                        >
                          查看详情
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined"
                          startIcon={<Api />}
                          onClick={testApiConnection}
                        >
                          测试连接
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      {/* 配置对话框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingModel ? '编辑模型配置' : '添加模型配置'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="显示名称"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="例如: 我的OpenAI"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>AI提供商</InputLabel>
                <Select
                  value={formData.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  label="AI提供商"
                >
                  {(providers || []).map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API地址"
                value={formData.apiUrl}
                onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                placeholder="https://api.openai.com/v1"
                helperText="API服务的基础URL地址"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API密钥"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                placeholder="请输入API密钥"
                helperText="您的API密钥将被安全加密存储"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>默认模型</InputLabel>
                <Select
                  value={formData.defaultModel}
                  onChange={(e) => setFormData({...formData, defaultModel: e.target.value})}
                  label="默认模型"
                >
                  {(getProviderInfo(formData.provider)?.models || []).map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>主要用途 / 能力</InputLabel>
                <Select
                  multiple
                  value={formData.capabilities || []}
                  input={<OutlinedInput label="主要用途 / 能力" />}
                  onChange={(e) => setFormData({
                    ...formData,
                    capabilities: typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value
                  })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected || []).map((value) => (
                        <Chip
                          key={value}
                          label={
                            value === 'text' ? '文本' :
                            value === 'image' ? '图像' :
                            value === 'audio' ? '音频' :
                            value === 'video' ? '视频' :
                            value === 'vision' ? '视觉' :
                            value === 'code' ? '代码' : value
                          }
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="text">文本对话 / 写作</MenuItem>
                  <MenuItem value="image">图像生成</MenuItem>
                  <MenuItem value="audio">语音合成 / 音频</MenuItem>
                  <MenuItem value="video">视频生成</MenuItem>
                  <MenuItem value="vision">图像理解 / 多模态</MenuItem>
                  <MenuItem value="code">代码助手</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                选择该配置主要用于哪些能力。不同创作功能（文字 / 图片 / 语音 / 视频）会根据这里的能力进行筛选。
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.useProxy}
                    onChange={(e) => setFormData({...formData, useProxy: e.target.checked})}
                  />
                }
                label="使用代理 (推荐)"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                通过代理访问API，提高连接稳定性
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button 
            onClick={testApiConnection} 
            disabled={testing || !formData.apiKey}
            startIcon={<Api />}
          >
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            startIcon={<Save />}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default AIModelConfig;
