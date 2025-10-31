import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Card, 
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Switch,
  Divider
} from '@mui/material';
import { 
  CloudUpload,
  Palette,
  Description,
  MusicNote,
  VideoLibrary,
  Code,
  CheckCircle
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { useNavigate } from 'react-router-dom';
import { uploadToIPFS } from '../utils/ipfs';
import PageLayout from '../components/ui/PageLayout';
import { GlassCard } from '../components/ui/GlassCard';
import logger from '../utils/logger';
import blockchainService from '../services/blockchainService';
import apiService from '../services/apiService';

// 手工创作类型
const manualCreationTypes = [
  { 
    value: 0, 
    label: "图像", 
    icon: "🖼️", 
    description: "照片、插画、设计图等",
    maxSize: 50 * 1024 * 1024, // 50MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  },
  { 
    value: 1, 
    label: "文本", 
    icon: "📝", 
    description: "文章、小说、诗歌等",
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['text/plain', 'application/pdf', 'application/msword']
  },
  { 
    value: 2, 
    label: "音频", 
    icon: "🎵", 
    description: "音乐、播客、音效等",
    maxSize: 100 * 1024 * 1024, // 100MB
    acceptedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']
  },
  { 
    value: 3, 
    label: "视频", 
    icon: "🎬", 
    description: "短片、动画、教程等",
    maxSize: 500 * 1024 * 1024, // 500MB
    acceptedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/webm']
  },
  { 
    value: 4, 
    label: "代码", 
    icon: "💻", 
    description: "程序、脚本、算法等",
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['text/plain', 'application/json', 'application/javascript']
  }
];

// 创作工具
const creationTools = [
  'Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'Blender',
  'Figma', 'Sketch', 'Procreate', 'Canva', 'Final Cut Pro',
  'Logic Pro', 'Ableton Live', 'Audacity', 'VS Code', '其他'
];

const ManualCreation = () => {
  const navigate = useNavigate();
  const { connected, account } = useWeb3();
  
  // 表单状态
  const [activeStep, setActiveStep] = useState(0);
  const [creationType, setCreationType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [tools, setTools] = useState([]);
  const [creationProcess, setCreationProcess] = useState('');
  const [creationTime, setCreationTime] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const steps = [
    '选择创作类型',
    '上传作品文件', 
    '填写作品信息',
    '记录创作过程',
    '区块链确权'
  ];

  // 处理文件上传
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (creationType === null) return;
    const typeConfig = manualCreationTypes[creationType];
    
    // 检查文件大小
    if (selectedFile.size > typeConfig.maxSize) {
      setError(`文件大小不能超过 ${Math.round(typeConfig.maxSize / 1024 / 1024)}MB`);
      return;
    }

    // 检查文件类型
    if (!typeConfig.acceptedTypes.includes(selectedFile.type)) {
      setError(`不支持的文件类型: ${selectedFile.type}`);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 添加工具
  const handleAddTool = (tool) => {
    if (!tools.includes(tool)) {
      setTools([...tools, tool]);
    }
  };

  // 移除工具
  const handleRemoveTool = (toolToRemove) => {
    setTools(tools.filter(tool => tool !== toolToRemove));
  };

  // 下一步
  const handleNext = () => {
    if (activeStep === 0 && creationType === null) {
      setError('请选择创作类型');
      return;
    }
    if (activeStep === 1 && !file) {
      setError('请上传作品文件');
      return;
    }
    if (activeStep === 2 && (!title.trim() || !description.trim())) {
      setError('请填写作品标题和描述');
      return;
    }
    
    setError('');
    setActiveStep(activeStep + 1);
  };

  // 上一步
  const handleBack = () => {
    setError('');
    setActiveStep(activeStep - 1);
  };

  // 提交创作 - 完整的双重确权流程
  const handleSubmit = async () => {
    if (!connected || !account) {
      setError('请先连接钱包');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 第一阶段：初始化区块链服务
      setSuccess('正在初始化区块链连接...');
      await blockchainService.initialize();

      // 第二阶段：上传文件到IPFS
      setSuccess('正在上传文件到IPFS分布式存储...');
      const fileHash = await uploadToIPFS(file, {
        name: title || file.name,
        creator: account,
        attributes: {
          creationType: creationType !== null ? manualCreationTypes[creationType].label : 'unknown',
          tools: tools.join(','),
          visibility: visibility
        }
      });

      logger.info('文件上传到IPFS成功:', fileHash);

      // 第三阶段：构建创作元数据
      const processMetadata = {
        title,
        description,
        type: 'manual',
        creationType: creationType,
        creationTypeLabel: creationType !== null ? manualCreationTypes[creationType].label : 'unknown',
        tags,
        tools,
        creationProcess,
        creationTime,
        visibility,
        creator: account,
        timestamp: new Date().toISOString(),
        fileHash,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ipfsHash: fileHash
      };

      // 第四阶段：第一次确权 - 记录创作过程
      setSuccess('第一次确权：正在记录创作过程到区块链...');
      const registrationResult = await blockchainService.registerCreation(processMetadata);

      logger.info('创作过程注册成功:', registrationResult);

      // 第五阶段：保存到后端数据库（可选）
      setSuccess('正在保存创作记录...');
      try {
        await apiService.createCreation({
          ...processMetadata,
          blockchainTxHash: registrationResult.transactionHash,
          creationId: registrationResult.creationId,
          status: 'process_recorded',
          gasUsed: registrationResult.gasUsed
        });
        console.log('数据库保存成功');
      } catch (dbError) {
        // 静默处理数据库错误，不影响用户体验
        console.debug('后端服务不可用，使用本地存储:', dbError.message);
      }

      // 第六阶段：上传最终元数据到IPFS
      setSuccess('正在上传完整元数据到IPFS...');
      const finalMetadata = {
        ...processMetadata,
        creationId: registrationResult.creationId,
        registrationTx: registrationResult.transactionHash,
        processRecordedAt: new Date().toISOString(),
        version: '1.0'
      };

      const metadataHash = await uploadToIPFS(
        new Blob([JSON.stringify(finalMetadata, null, 2)], { type: 'application/json' }),
        {
          name: `${title}_metadata.json`,
          creator: account,
          attributes: {
            type: 'metadata',
            creationId: registrationResult.creationId.toString()
          }
        }
      );

      // 第七阶段：第二次确权 - 最终确认
      setSuccess('第二次确权：正在进行最终确认...');
      const confirmationResult = await blockchainService.confirmCreation(
        registrationResult.creationId,
        {
          finalIpfsHash: metadataHash,
          fileHash: fileHash,
          metadataHash: metadataHash,
          creator: account,
          confirmedAt: new Date().toISOString()
        }
      );

      logger.info('创作确认成功:', confirmationResult);

      // 第八阶段：更新数据库状态（可选）
      try {
        await apiService.updateCreationStatus(registrationResult.creationId, {
          status: 'confirmed',
          metadataHash: metadataHash,
          confirmationTx: confirmationResult.transactionHash,
          confirmedAt: new Date().toISOString()
        });
        console.log('数据库状态更新成功');
      } catch (dbError) {
        // 静默处理数据库错误，不影响用户体验
        console.debug('后端服务不可用，数据已保存到区块链:', dbError.message);
      }

      // 保存到本地存储以便"我的作品"页面显示
      const localCreation = {
        id: registrationResult.creationId,
        title: title,
        description: description,
        type: 'manual',
        creationType: creationType,
        image: fileHash, // 保存上传后返回的图片路径或IPFS哈希
        creationTypeLabel: creationType !== null ? manualCreationTypes[creationType].label : 'unknown',
        tags: tags,
        tools: tools,
        visibility: visibility,
        creator: account,
        fileHash: fileHash,
        metadataHash: metadataHash,
        registrationTx: registrationResult.transactionHash,
        confirmationTx: confirmationResult.transactionHash,
        confirmed: true,
        timestamp: new Date().toISOString(),
        localCreation: true
      };

      // 保存到localStorage
      const existingCreations = JSON.parse(localStorage.getItem('userCreations') || '[]');
      existingCreations.unshift(localCreation); // 添加到开头
      localStorage.setItem('userCreations', JSON.stringify(existingCreations));

      // 完成
      setSuccess(`🎉 双重确权完成！
        
✅ 创作ID: ${registrationResult.creationId}
✅ 过程记录交易: ${registrationResult.transactionHash.slice(0, 10)}...
✅ 最终确认交易: ${confirmationResult.transactionHash.slice(0, 10)}...
✅ IPFS文件哈希: ${fileHash.slice(0, 10)}...
✅ 元数据哈希: ${metadataHash.slice(0, 10)}...

您的作品已获得完整的区块链版权保护！`);
      
      // 3秒后跳转到我的创作页面
      setTimeout(() => {
        setIsUploading(false);
        navigate('/my-creations', { 
          state: { 
            newCreation: {
              id: registrationResult.creationId,
              title: title,
              confirmed: true
            }
          }
        });
      }, 3000);

    } catch (err) {
      logger.error('创作确权失败:', err);
      
      // 详细的错误处理
      let errorMessage = '确权过程失败';
      
      if (err.message.includes('用户取消')) {
        errorMessage = '用户取消了交易，创作确权已中断';
      } else if (err.message.includes('余额不足')) {
        errorMessage = '钱包余额不足支付Gas费用，请充值后重试';
      } else if (err.message.includes('网络错误')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (err.message.includes('IPFS')) {
        errorMessage = 'IPFS上传失败，请检查网络连接';
      } else {
        errorMessage = `确权失败: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            {manualCreationTypes.map((type) => (
              <Grid item xs={12} sm={6} md={4} key={type.value}>
                <Card 
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: creationType === type.value ? '2px solid #9c27b0' : '1px solid #e0e0e0',
                    backgroundColor: creationType === type.value ? 'rgba(156, 39, 176, 0.1)' : 'background.paper',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => setCreationType(type.value)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ mb: 2 }}>
                      {type.icon}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {type.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      最大 {Math.round(type.maxSize / 1024 / 1024)}MB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <input
              accept={creationType !== null ? manualCreationTypes[creationType].acceptedTypes.join(',') : '*'}
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                size="large"
                sx={{ mb: 4 }}
              >
                选择文件上传
              </Button>
            </label>
            
            {file && (
              <Card sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    📁 {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    大小: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    类型: {file.type}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="作品标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="为你的作品起一个吸引人的标题"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="作品描述"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述你的作品内容、创作理念等"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="添加标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签后按回车添加"
              />
              <Box sx={{ mt: 2 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ mr: 2, mb: 2 }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>作品可见性</InputLabel>
                <Select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <MenuItem value="public">🌍 公开 - 所有人可见</MenuItem>
                  <MenuItem value="private">🔒 私密 - 仅自己可见</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                🛠️ 使用的创作工具
              </Typography>
              <Box sx={{ mb: 4 }}>
                {creationTools.map((tool) => (
                  <Chip
                    key={tool}
                    label={tool}
                    onClick={() => handleAddTool(tool)}
                    variant={tools.includes(tool) ? "filled" : "outlined"}
                    sx={{ mr: 2, mb: 2 }}
                    color={tools.includes(tool) ? "primary" : "default"}
                  />
                ))}
              </Box>
              {tools.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    已选择的工具:
                  </Typography>
                  {tools.map((tool) => (
                    <Chip
                      key={tool}
                      label={tool}
                      onDelete={() => handleRemoveTool(tool)}
                      sx={{ mr: 2, mb: 2 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="创作过程描述"
                value={creationProcess}
                onChange={(e) => setCreationProcess(e.target.value)}
                placeholder="描述你的创作过程、灵感来源、技术细节等"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="创作时间"
                value={creationTime}
                onChange={(e) => setCreationTime(e.target.value)}
                placeholder="例如：2024年1月，耗时3天"
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 4, textAlign: 'center' }}>
              🎨 手工创作确认
            </Typography>
            
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  <strong>类型:</strong> {creationType !== null ? manualCreationTypes[creationType].label : '未选择'} 🎨
                </Typography>
                <Typography variant="body2">
                  <strong>文件:</strong> {file?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>标签:</strong> {tags.join(', ')}
                </Typography>
                <Typography variant="body2">
                  <strong>工具:</strong> {tools.join(', ')}
                </Typography>
                <Typography variant="body2">
                  <strong>可见性:</strong> {visibility === 'public' ? '🌍 公开' : '🔒 私密'}
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>🎨 手工创作标识:</strong> 此作品将明确标记为"手工创作"，区别于AI生成内容。
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>🔐 双重确权流程:</strong> 您的作品将获得完整的区块链版权保护
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                📝 <strong>第一次确权:</strong> 记录创作过程到区块链 → 上传文件到IPFS分布式存储
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                ✅ <strong>第二次确权:</strong> 最终确认与元数据固定 → 生成版权证书NFT
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'success.main' }}>
                🏆 <strong>完成后:</strong> 获得永久的、不可篡改的区块链版权证明
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>⚠️ 重要提示:</strong> 确权过程需要支付少量Gas费用，请确保钱包有足够余额。
                确权完成后，版权信息将永久存储在区块链上，无法删除或修改。
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  // 如果没有连接钱包，显示提示
  if (!connected) {
    return (
      <PageLayout>
        <Box sx={{ maxWidth: '900px', mx: 'auto', p: 6, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 4 }}>
            🎨 手工创作
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
            请先连接钱包以开始手工创作
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            size="large"
          >
            返回首页连接钱包
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box sx={{ maxWidth: '900px', mx: 'auto', p: 6 }}>
        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
          🎨 手工创作
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
          上传你自己手工制作的作品，享受区块链版权保护
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 4 }}>
            {success}
          </Alert>
        )}

        <GlassCard sx={{ p: 6, mb: 6 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </GlassCard>

        <GlassCard sx={{ p: 6, mb: 6 }}>
          {renderStepContent()}
        </GlassCard>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            上一步
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {isUploading ? '提交中...' : '确认提交'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
            >
              下一步
            </Button>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default ManualCreation;
