import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Tabs,
  Tab,
  Chip,
  Stack
} from '@mui/material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { makeGatewayURL } from '../utils/ipfs';
import { mockCreations } from '../data/mock/creations';

const CreationDetails = () => {
  const { id } = useParams();
  const { contracts, account } = useWeb3();
  const navigate = useNavigate();
  
  const [creation, setCreation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const run = async () => {
      // 如果没连上合约或合约为空，先用本地样品兜底
      if ((!contracts || !contracts.creationRegistry) && id) {
        const local = mockCreations.find(c => String(c.id) === String(id));
        if (local) {
          setCreation(local);
          return; // 本地已命中则不再请求链上
        }
      }
      if (contracts && id) {
        try {
          setIsLoading(true);
          setError('');

          const tokenURI = await contracts.creationRegistry.tokenURI(id);
          const metadataUrl = makeGatewayURL(tokenURI.replace('ipfs://', ''));

          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) throw new Error(`获取元数据失败: ${metadataResponse.statusText}`);
          const metadata = await metadataResponse.json();

          const creationData = await contracts.creationRegistry.getCreation(id);
          const owner = await contracts.creationRegistry.ownerOf(id);

          setCreation({ id, owner, ...metadata, ...creationData });
        } catch (error) {
          // 加载Token ID失败
          setError('加载创作详情失败，请刷新页面重试');
        } finally {
          setIsLoading(false);
        }
      }
    };
    run();
  }, [contracts, id]);

  // 已内联加载逻辑，无需单独函数

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderContent = () => {
    if (!creation) return null;
    
    switch (String(creation.creationType || '').toLowerCase()) {
      case 'image':
        return (
          <img 
            src={creation.image || makeGatewayURL(creation.contentHash)} 
            alt={creation.title} 
            style={{ maxWidth: '100%', borderRadius: 8 }} 
          />
        );
      case 'audio':
        return <audio controls src={makeGatewayURL(creation.contentHash)} style={{ width: '100%' }} />;
      case 'video':
        return <video controls src={makeGatewayURL(creation.contentHash)} style={{ maxWidth: '100%', borderRadius: 8 }} />;
      case 'text':
        // 需要实现获取文本内容
        return <Typography>文本内容预览暂未实现</Typography>;
      default:
        return <Typography>不支持的预览类型</Typography>;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
  }
  
  if (!creation) {
    return <Typography sx={{ color: 'gray', textAlign:'center', my:6 }}>未找到创作</Typography>;
  }

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          {renderContent()}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {creation.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {creation.description}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            所有者: 
            <Chip 
              label={creation.owner === account ? '你' : `${creation.owner.substring(0, 6)}...`} 
              onClick={() => navigate(`/profile/${creation.owner}`)}
              sx={{ ml: 1 }}
            />
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="primary" sx={{ mr: 2 }}>
              购买授权
            </Button>
            <Button variant="outlined" color="secondary">
              出价
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 5 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="详情" />
          <Tab label="贡献者" />
          <Tab label="授权历史" />
          <Tab label="交易历史" />
        </Tabs>
        
        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>创作详情</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}><Typography color="text.secondary">Token ID:</Typography></Grid>
                  <Grid item xs={8}><Typography>{creation.id}</Typography></Grid>
                  
                  <Grid item xs={4}><Typography color="text.secondary">AI模型:</Typography></Grid>
                  <Grid item xs={8}><Typography>{creation.aiModel}</Typography></Grid>
                  
                  <Grid item xs={4}><Typography color="text.secondary">提示词:</Typography></Grid>
                  <Grid item xs={8}><Typography sx={{ whiteSpace: 'pre-wrap' }}>{creation.prompt}</Typography></Grid>
                  
                  <Grid item xs={4}><Typography color="text.secondary">参数:</Typography></Grid>
                  <Grid item xs={8}><Typography>{creation.parameters}</Typography></Grid>
                  
                  <Grid item xs={4}><Typography color="text.secondary">内容哈希:</Typography></Grid>
                  <Grid item xs={8}><Typography sx={{ wordBreak: 'break-all' }}>{creation.contentHash}</Typography></Grid>
                  
                  <Grid item xs={4}><Typography color="text.secondary">元数据哈希:</Typography></Grid>
                  <Grid item xs={8}><Typography sx={{ wordBreak: 'break-all' }}>{creation.metadataHash}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          {tabValue === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>贡献者</Typography>
                <Stack spacing={2}>
                  {creation.contributors.map((contributor, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip 
                        label={`${contributor.address.substring(0, 10)}...`} 
                        onClick={() => navigate(`/profile/${contributor.address}`)}
                      />
                      <Typography>{contributor.share}%</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
          {tabValue === 2 && <Typography>授权历史暂未实现</Typography>}
          {tabValue === 3 && <Typography>交易历史暂未实现</Typography>}
        </Box>
      </Box>
    </Box>
  );
};

export default CreationDetails;
