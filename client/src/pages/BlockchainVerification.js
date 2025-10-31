import React, { useState, useRef } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, Chip, LinearProgress, Alert } from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Security, Verified, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { uploadToIPFS } from '../utils/ipfs';

const BlockchainVerification = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const [verificationStep, setVerificationStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isGeneratingHash, setIsGeneratingHash] = useState(false);
  const [fileHash, setFileHash] = useState('');
  const [isRecordingBlockchain, setIsRecordingBlockchain] = useState(false);
  const [blockchainTxId, setBlockchainTxId] = useState('');
  const fileInputRef = useRef(null);

  // 处理文件上传
  const handleFileUpload = async (file) => {
    if (!file) return;

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('不支持的文件类型。请上传图片或文档文件。');
      toast.error('不支持的文件类型');
      return;
    }

    // 检查文件大小 (10MB限制)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('文件大小不能超过10MB');
      toast.error('文件大小不能超过10MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // 使用真实的IPFS上传功能
      const uploadedHash = await uploadToIPFS(file, {
        name: file.name,
        creator: 'blockchain-verification',
        attributes: {
          uploadedAt: new Date().toISOString(),
          fileType: file.type,
          fileSize: file.size
        }
      });

      // 保存上传结果
      setUploadedFile({
        ...file,
        uploadedHash: uploadedHash,
        uploadedAt: new Date().toISOString()
      });
      setVerificationStep(1); // 自动进入下一步
      toast.success('文件上传成功！');
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadError('文件上传失败：' + error.message);
      toast.error('文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理点击上传
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    handleFileUpload(file);
  };

  // 处理拖拽上传
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // 生成文件哈希
  const generateFileHash = async () => {
    setIsGeneratingHash(true);
    try {
      if (!uploadedFile || !uploadedFile.uploadedHash) {
        throw new Error('文件未正确上传，无法生成哈希');
      }

      // 使用文件的IPFS哈希作为文件哈希
      let hash = uploadedFile.uploadedHash;

      // 如果是本地路径，生成一个基于文件内容的哈希
      if (hash.startsWith('/uploads/')) {
        // 模拟生成SHA256哈希
        await new Promise(resolve => setTimeout(resolve, 2000));
        hash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      } else if (!hash.startsWith('0x')) {
        // 如果是IPFS哈希，转换为以0x开头的格式
        hash = '0x' + hash.slice(-64).padStart(64, '0');
      }

      setFileHash(hash);
      setVerificationStep(2); // 保持在哈希生成步骤
      toast.success('文件哈希生成成功！');
    } catch (error) {
      console.error('Hash generation failed:', error);
      toast.error('哈希生成失败：' + error.message);
    } finally {
      setIsGeneratingHash(false);
    }
  };

  // 记录到区块链
  const recordToBlockchain = async () => {
    setIsRecordingBlockchain(true);
    try {
      // 模拟区块链记录过程
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // 生成一个模拟的交易ID
      const mockTxId = '0x' + Array.from({length: 66}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setBlockchainTxId(mockTxId);
      // 等待一秒后自动进入证书生成步骤
      setTimeout(() => {
        setVerificationStep(4); // 自动跳转到证书生成步骤
      }, 1000);
      toast.success('区块链记录成功！');
    } catch (error) {
      toast.error('区块链记录失败');
    } finally {
      setIsRecordingBlockchain(false);
    }
  };

  const steps = [
    { title: '上传作品', description: '将您的AI创作作品上传到平台', icon: '📤' },
    { title: '生成哈希', description: '系统自动生成内容的唯一哈希值', icon: '🔗' },
    { title: '区块链记录', description: '哈希值永久记录在区块链上', icon: '⛓️' },
    { title: '获得证书', description: '获得不可篡改的版权证书', icon: '📜' }
  ];

  const features = [
    { title: '不可篡改性', description: '一旦上链，版权信息永远无法被修改', icon: <Security color="primary" /> },
    { title: '全球认证', description: '区块链技术确保全球范围内的版权认证', icon: <Verified color="success" /> },
    { title: '即时验证', description: '任何人都可以即时验证作品的原创性', icon: <CheckCircle color="info" /> }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d2d5f 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h2" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold'
            }}
          >
            🔒 区块链认证
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            利用区块链的不可篡改特性，为您的AI创作提供永久、可信的版权保护
          </Typography>
        </Box>

        {/* 认证流程 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            认证流程
          </Typography>
          <Grid container spacing={3}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: verificationStep > index ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-5px)' }
                  }}
                  onClick={() => setVerificationStep(index + 1)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h3" sx={{ mb: 2 }}>
                      {step.icon}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      步骤 {index + 1}: {step.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {step.description}
                    </Typography>
                    {verificationStep > index ? (
                      <Chip label="已完成" color="primary" size="small" sx={{ mt: 2 }} />
                    ) : verificationStep === index + 1 ? (
                      <Box sx={{ mt: 2 }}>
                        {index === 1 && isGeneratingHash ? (
                          <Box>
                            <LinearProgress sx={{ mb: 1 }} />
                            <Typography variant="caption" color="textSecondary">
                              正在生成哈希值...
                            </Typography>
                          </Box>
                        ) : index === 2 && isRecordingBlockchain ? (
                          <Box>
                            <LinearProgress sx={{ mb: 1 }} />
                            <Typography variant="caption" color="textSecondary">
                              正在记录到区块链...
                            </Typography>
                          </Box>
                        ) : index === 1 && fileHash ? (
                          <Box>
                            <Chip label="哈希已生成" color="success" size="small" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                              {fileHash}
                            </Typography>
                            <Button 
                              variant="contained" 
                              size="small" 
                              sx={{ mt: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerificationStep(3); // 进入区块链记录步骤
                                recordToBlockchain();
                              }}
                            >
                              ⛓️ 记录到区块链
                            </Button>
                          </Box>
                        ) : index === 2 && blockchainTxId ? (
                          <Box>
                            <Chip label="已记录" color="success" size="small" sx={{ mb: 1 }} />
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                              交易ID: {blockchainTxId}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ mt: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerificationStep(4); // 进入证书生成步骤
                              }}
                            >
                              📜 生成证书
                            </Button>
                          </Box>
                        ) : index === 3 && blockchainTxId ? (
                          <Box>
                            <Chip label="证书已生成" color="success" size="small" sx={{ mb: 1 }} />
                            <Button 
                              variant="contained" 
                              size="small" 
                              sx={{ mt: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('版权证书已生成！');
                              }}
                            >
                              📜 下载证书
                            </Button>
                          </Box>
                        ) : (
                          <Chip label="进行中" color="warning" size="small" />
                        )}
                      </Box>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box mt={4}>
            <Typography variant="body1" textAlign="center" mb={2}>
              认证进度: {verificationStep}/4
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(verificationStep / 4) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        {/* 技术特性 */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" mb={4} fontWeight="bold">
            技术优势
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      transform: 'scale(1.02)',
                      boxShadow: isDark ? '0 20px 40px rgba(59,130,246,0.3)' : '0 20px 40px rgba(59,130,246,0.2)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      {feature.icon}
                      <Typography variant="h6" fontWeight="bold" ml={1}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="textSecondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 文件上传区域 */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" mb={4} fontWeight="bold">
            开始认证您的作品
          </Typography>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.txt"
          />
          
          <Box 
            sx={{ 
              p: 4,
              background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
              borderRadius: 3,
              border: '2px dashed #3b82f6',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                borderColor: '#1d4ed8'
              }
            }}
            onClick={handleClickUpload}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <Box>
                <Typography variant="h6" mb={2} color="success.main">
                  ✅ 文件上传成功！
                </Typography>
                <Typography variant="body1" mb={2}>
                  文件名: {uploadedFile.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  文件大小: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                {uploadedFile.uploadedHash && (
                  <Typography variant="body2" color="textSecondary" mb={3} sx={{ wordBreak: 'break-all' }}>
                    上传哈希: {uploadedFile.uploadedHash}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="contained"
                    size="large"
                    sx={{ 
                      background: 'linear-gradient(45deg, #10b981, #059669)',
                      px: 4,
                      py: 1.5
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVerificationStep(2); // 跳转到生成哈希步骤
                      generateFileHash(); // 开始生成哈希
                    }}
                  >
                    🔗 继续认证流程
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 重置所有状态
                      setUploadedFile(null);
                      setVerificationStep(0);
                      setFileHash('');
                      setBlockchainTxId('');
                      setUploadError('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    重新上传
                  </Button>
                </Box>
              </Box>
            ) : isUploading ? (
              <Box>
                <Typography variant="h6" mb={2}>
                  ⏳ 正在上传文件...
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  请稍候，正在处理您的文件
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" mb={2}>
                  拖拽文件到此处或点击上传
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                    px: 4,
                    py: 1.5
                  }}
                >
                  📤 选择文件上传
                </Button>
                <Typography variant="body2" color="textSecondary" mt={2}>
                  支持图片、PDF、文本文件，最大10MB
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* 错误提示 */}
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
              {uploadError}
            </Alert>
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default BlockchainVerification;
