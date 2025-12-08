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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { useWeb3 } from '../context/Web3ContextFixed';
import { makeGatewayURL } from '../utils/ipfs';
import { mockCreations } from '../data/mock/creations';
import { toast } from 'react-hot-toast';
import apiService from '../services/apiService';

const CreationDetails = () => {
  // 组件加载时立即输出日志，确认代码已加载
  console.log('🎬 CreationDetails 组件已加载');
  console.log('🎬 当前时间:', new Date().toISOString());
  
  const { id } = useParams();
  const { contracts, account, connected, points, forceRefreshConnection, refreshPoints, updatePoints } = useWeb3();
  const navigate = useNavigate();
  
  // 输出 Web3 上下文状态
  console.log('🎬 Web3 状态:', {
    account,
    connected,
    points,
    hasRefreshPoints: !!refreshPoints,
    hasUpdatePoints: !!updatePoints
  });
  
  const [creation, setCreation] = useState(null);
  const [backendCreation, setBackendCreation] = useState(null); // 后端创作数据（用于获取正确的TokenID）
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // 购买授权对话框状态
  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [licenseType, setLicenseType] = useState('personal');
  const [licenseDuration, setLicenseDuration] = useState(30);
  const [purchasingLicense, setPurchasingLicense] = useState(false);
  
  // 出价对话框状态
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError('');
      
      // 优先从后端加载创作数据
      if (id) {
        try {
          const backendData = await apiService.getCreation(id);
          if (backendData) {
            setBackendCreation(backendData);
            
            // 处理图片URL
            let imageUrl = backendData.image_url || backendData.ImageURL || backendData.image || '';
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `http://localhost:8080${imageUrl}`;
            }
            
            // 设置作品数据
            setCreation({
              id: backendData.id || backendData.ID,
              title: backendData.title || backendData.Title,
              description: backendData.description || backendData.Description,
              image: imageUrl,
              contentHash: backendData.content_hash || backendData.ContentHash,
              metadataHash: backendData.metadata_hash || backendData.MetadataHash,
              creator: backendData.creator_address || backendData.CreatorAddress,
              owner: backendData.creator_address || backendData.CreatorAddress,
              price: backendData.price_in_points || backendData.PriceInPoints || 0,
              aiModel: backendData.ai_model || backendData.AIModel || 'N/A',
              prompt: backendData.prompt_text || backendData.PromptText || 'N/A',
              parameters: 'N/A',
              creationType: backendData.creation_type || backendData.CreationType || 'image',
              likes: backendData.likes || 0,
              views: backendData.views || 0,
              contributors: [],
              createdAt: backendData.created_at || backendData.CreatedAt,
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('从后端加载创作详情失败:', error);
        }
      }
      
      // 备用：尝试从区块链加载
      if (contracts && contracts.creationRegistry && id) {
        try {
          const tokenURI = await contracts.creationRegistry.tokenURI(id);
          const metadataUrl = makeGatewayURL(tokenURI.replace('ipfs://', ''));

          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) throw new Error(`获取元数据失败: ${metadataResponse.statusText}`);
          const metadata = await metadataResponse.json();

          const creationData = await contracts.creationRegistry.getCreation(id);
          const owner = await contracts.creationRegistry.ownerOf(id);

          setCreation({ id, owner, ...metadata, ...creationData });
        } catch (error) {
          console.error('从区块链加载失败:', error);
          // 最后兜底：使用Mock数据
          const local = mockCreations.find(c => String(c.id) === String(id));
          if (local) {
            setCreation(local);
          } else {
            setError('作品不存在');
          }
        }
      } else {
        // 无区块链连接时使用Mock数据
        const local = mockCreations.find(c => String(c.id) === String(id));
        if (local) {
          setCreation(local);
        } else {
          setError('作品不存在');
        }
      }
      
      setIsLoading(false);
    };
    run();
  }, [contracts, id]);

  // 已内联加载逻辑，无需单独函数

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 检查用户是否已认证
  const checkAuth = () => {
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    if (!address || !signature || !message || !timestamp) {
      return false;
    }
    
    // 检查地址是否匹配
    if (address.toLowerCase() !== account?.toLowerCase()) {
      return false;
    }
    
    // 检查时间戳是否过期（5分钟窗口）
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = now - timestampNum;
    
    if (timeDiff > 300) {
      return false;
    }
    
    return true;
  };

  // 处理购买授权
  const handlePurchaseLicense = async () => {
    if (!connected || !account) {
      toast.error('请先连接钱包');
      return;
    }

    // 详细检查认证信息
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    // 检查地址是否匹配
    if (address && account && address.toLowerCase() !== account.toLowerCase()) {
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('账户已切换，请重新完成签名认证', { duration: 5000 });
      return;
    }
    
    // 检查认证信息是否完整
    if (!address || !signature || !message || !timestamp) {
      toast.error('认证信息不完整，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 检查时间戳是否过期
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timestampAge = now - timestampNum;
    
    if (isNaN(timestampNum) || timestampAge < 0 || timestampAge > 300) {
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('认证已过期，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    if (creation.owner === account) {
      toast.error('您不能购买自己作品的授权');
      return;
    }

    setLicenseDialogOpen(true);
  };

  // 确认购买授权
  const handleConfirmPurchaseLicense = async () => {
    // 强制显示，确保函数被调用
    console.log('🚀 ========== 开始购买授权流程 ==========');
    console.error('🚀 ERROR级别日志：开始购买授权流程（确保显示）');
    alert('调试：购买授权函数已调用！请查看控制台。如果看不到这条消息，说明函数没有被调用。');
    
    console.log('📋 初始状态:', {
      licenseDuration,
      licenseType,
      connected,
      account,
      points,
      hasUpdatePoints: !!updatePoints,
      hasRefreshPoints: !!refreshPoints
    });

    if (!licenseDuration || licenseDuration <= 0) {
      console.error('❌ 授权期限无效:', licenseDuration);
      toast.error('请输入有效的授权期限');
      return;
    }

    // 再次检查钱包连接和认证
    if (!connected || !account) {
      toast.error('请先连接钱包');
      return;
    }

    // 详细检查认证信息
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    // 检查地址是否匹配
    if (address && account && address.toLowerCase() !== account.toLowerCase()) {
      console.warn('⚠️ 存储的地址与当前连接地址不匹配');
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('账户已切换，请重新完成签名认证', { duration: 5000 });
      return;
    }
    
    // 检查认证信息是否完整
    if (!address || !signature || !message || !timestamp) {
      console.error('❌ 认证信息不完整');
      toast.error('认证信息不完整，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 检查时间戳是否过期
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timestampAge = now - timestampNum;
    
    if (isNaN(timestampNum) || timestampAge < 0 || timestampAge > 300) {
      console.warn('⚠️ 认证时间戳无效或已过期:', { timestampAge, timestampNum, now });
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('认证已过期，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    // 再次验证认证头（在发送请求前）
    const authHeaders = apiService.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0) {
      console.error('❌ 认证头为空，无法发送请求');
      toast.error('认证信息丢失，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    setPurchasingLicense(true);

    try {
      // 计算价格（可以根据授权类型和期限计算）
      const basePrice = licenseType === 'commercial' ? 500 : licenseType === 'exclusive' ? 2000 : 200;
      const price = Math.ceil(basePrice * (licenseDuration / 30)); // 按月份计算，向上取整

      // 检查积分余额
      if (points < price) {
        toast.error(`积分不足！需要 ${price} 积分，当前余额 ${points} 积分`);
        setPurchasingLicense(false);
        return;
      }

      console.log('🔍 购买授权请求:', {
        token_id: parseInt(id, 10),
        creation_id: parseInt(id, 10),
        price: price,
        license_type: licenseType,
        duration: licenseDuration,
        authHeadersCount: Object.keys(authHeaders).length,
        hasUserAddress: !!authHeaders['User-Address'],
        hasSignature: !!authHeaders['Signature'],
        hasMessage: !!authHeaders['Message'],
        hasTimestamp: !!authHeaders['Timestamp'],
        userAddress: authHeaders['User-Address'] ? `${authHeaders['User-Address'].substring(0, 6)}...${authHeaders['User-Address'].substring(authHeaders['User-Address'].length - 4)}` : null,
        timestamp: authHeaders['Timestamp'],
        currentAccount: account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : null,
        addressMatch: address && account && address.toLowerCase() === account.toLowerCase()
      });

      // 优先使用后端创作中的 token_id（数据库中的真实TokenID），否则退化为当前路由ID
      const tokenIdForLicense = backendCreation?.token_id
        ? parseInt(backendCreation.token_id, 10)
        : parseInt(id, 10);

      // 确保 creation_id 是数字类型，如果不存在则不发送
      const creationIdForLicense = backendCreation?.id 
        ? parseInt(backendCreation.id, 10) 
        : undefined;

      // 构建请求数据，只包含有效的字段
      const buyItemData = {
        token_id: tokenIdForLicense,
        price: price,
        license_type: licenseType,
        duration: licenseDuration
      };

      // 只有当 creation_id 存在时才添加到请求中
      if (creationIdForLicense !== undefined && !isNaN(creationIdForLicense)) {
        buyItemData.creation_id = creationIdForLicense;
      }

      // 调用购买API（使用buyItem API，后续可以创建专门的购买授权API）
      const response = await apiService.buyItem(buyItemData);

      console.log('📦 购买授权完整响应:', JSON.stringify(response, null, 2));
      console.log('💰 当前积分:', points);
      console.log('💰 购买价格:', price);
      console.log('💰 updatePoints 函数存在:', !!updatePoints);
      console.log('💰 refreshPoints 函数存在:', !!refreshPoints);

      toast.success(`购买授权成功！已花费 ${price} 积分购买${licenseDuration}天的${licenseType === 'commercial' ? '商业' : licenseType === 'exclusive' ? '独家' : '个人'}授权`);
      
      // 优先使用响应中的 new_balance，这是最准确的
      let newBalance = null;
      
      // 检查响应中的 new_balance
      if (response && response.new_balance !== undefined) {
        newBalance = Number(response.new_balance);
        console.log('✅ 从响应中获取 new_balance:', newBalance);
      } else if (response && response.newBalance !== undefined) {
        newBalance = Number(response.newBalance);
        console.log('✅ 从响应中获取 newBalance:', newBalance);
      }
      
      // 如果响应中有 new_balance，立即使用它更新积分
      if (newBalance !== null && !isNaN(newBalance) && updatePoints) {
        console.log('💰 立即使用响应中的积分更新:', newBalance);
        updatePoints(newBalance);
        console.log('✅ 积分已更新为:', newBalance);
        
        // 验证更新是否成功（延迟一点检查）
        setTimeout(() => {
          console.log('🔍 验证积分更新后的值（需要从上下文获取）');
        }, 100);
      } else {
        // 如果响应中没有 new_balance，手动计算或刷新
        console.warn('⚠️ 响应中没有 new_balance，尝试其他方式');
        
        if (updatePoints && typeof points === 'number' && !isNaN(points)) {
          const calculatedBalance = points - price;
          if (calculatedBalance >= 0) {
            console.log('💰 手动计算积分:', { 旧积分: points, 价格: price, 新积分: calculatedBalance });
            updatePoints(calculatedBalance);
            console.log('✅ 手动计算更新成功，新积分:', calculatedBalance);
          } else {
            console.error('❌ 手动计算的积分为负数，尝试刷新');
            if (refreshPoints) {
              refreshPoints();
            }
          }
        } else if (refreshPoints) {
          console.log('🔄 调用 refreshPoints 刷新积分...');
          await refreshPoints();
        } else {
          console.error('❌ 无法更新积分：所有方法都不可用');
          toast.error('积分更新失败，请手动刷新页面');
        }
      }
      
      // 触发全局事件，通知其他页面刷新（如"我的授权"页面）
      window.dispatchEvent(new CustomEvent('licensePurchased', { 
        detail: { 
          tokenId: tokenIdForLicense,
          licenseId: response?.license_id 
        } 
      }));

      setLicenseDialogOpen(false);
      setLicenseType('personal');
      setLicenseDuration(30);
      
      console.log('✅ ========== 购买授权流程完成 ==========');
    } catch (error) {
      console.error('❌ ========== 购买授权失败 ==========');
      console.error('❌ 错误详情:', error);
      console.error('📋 完整错误信息:', {
        message: error.message,
        status: error.status,
        details: error.details,
        response: error.response,
        stack: error.stack
      });
      
      // 打印后端返回的详细错误
      if (error.details) {
        console.error('🔍 后端错误详情:', JSON.stringify(error.details, null, 2));
      }
      
      let errorMessage = '购买授权失败，请稍后重试';
      
      // 检查具体的错误类型
      if (error.status === 401 || error.message?.includes('Unauthorized')) {
        const backendMessage = error.details?.message || error.details?.error || '';
        
        if (backendMessage.includes('Missing required authentication headers')) {
          errorMessage = '认证头缺失，请刷新页面后重新连接钱包并完成签名认证';
        } else if (backendMessage.includes('Timestamp already used') || backendMessage.includes('Replay detected')) {
          errorMessage = '认证时间戳已被使用，请刷新页面后重新连接钱包并完成签名认证';
          // 清除认证信息，强制重新认证
          localStorage.removeItem('authSignature');
          localStorage.removeItem('authMessage');
          localStorage.removeItem('authTimestamp');
        } else if (backendMessage.includes('Invalid signature')) {
          errorMessage = '签名验证失败，请刷新页面后重新连接钱包并完成签名认证';
          localStorage.removeItem('authSignature');
          localStorage.removeItem('authMessage');
          localStorage.removeItem('authTimestamp');
        } else if (backendMessage.includes('timestamp too old') || backendMessage.includes('Invalid timestamp')) {
          errorMessage = '认证已过期，请刷新页面后重新连接钱包并完成签名认证';
          localStorage.removeItem('authSignature');
          localStorage.removeItem('authMessage');
          localStorage.removeItem('authTimestamp');
        } else {
          errorMessage = `认证失败: ${backendMessage || '请刷新页面后重新连接钱包并完成签名认证'}`;
        }
      } else if (error.details?.message) {
        errorMessage = error.details.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      console.log('🏁 ========== 购买授权流程结束（finally） ==========');
      setPurchasingLicense(false);
    }
  };

  // 处理出价
  const handleBid = () => {
    if (!connected || !account) {
      toast.error('请先连接钱包');
      return;
    }

    // 详细检查认证信息
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    // 检查地址是否匹配
    if (address && account && address.toLowerCase() !== account.toLowerCase()) {
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('账户已切换，请重新完成签名认证', { duration: 5000 });
      return;
    }
    
    // 检查认证信息是否完整
    if (!address || !signature || !message || !timestamp) {
      toast.error('认证信息不完整，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 检查时间戳是否过期
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timestampAge = now - timestampNum;
    
    if (isNaN(timestampNum) || timestampAge < 0 || timestampAge > 300) {
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('认证已过期，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    if (creation.owner === account) {
      toast.error('您不能对自己的作品出价');
      return;
    }

    setBidDialogOpen(true);
  };

  // 确认出价
  const handleConfirmBid = async () => {
    const amount = parseFloat(bidAmount);
    
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的出价金额');
      return;
    }

    // 再次检查钱包连接和认证
    if (!connected || !account) {
      toast.error('请先连接钱包');
      return;
    }

    // 详细检查认证信息
    const address = localStorage.getItem('userAddress');
    const signature = localStorage.getItem('authSignature');
    const message = localStorage.getItem('authMessage');
    const timestamp = localStorage.getItem('authTimestamp');
    
    // 检查地址是否匹配
    if (address && account && address.toLowerCase() !== account.toLowerCase()) {
      localStorage.removeItem('userAddress');
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('账户已切换，请重新完成签名认证', { duration: 5000 });
      return;
    }
    
    // 检查认证信息是否完整
    if (!address || !signature || !message || !timestamp) {
      toast.error('认证信息不完整，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }
    
    // 检查时间戳是否过期
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timestampAge = now - timestampNum;
    
    if (isNaN(timestampNum) || timestampAge < 0 || timestampAge > 300) {
      localStorage.removeItem('authSignature');
      localStorage.removeItem('authMessage');
      localStorage.removeItem('authTimestamp');
      toast.error('认证已过期，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    // 再次验证认证头（在发送请求前）
    const authHeaders = apiService.getAuthHeaders();
    if (Object.keys(authHeaders).length === 0) {
      toast.error('认证信息丢失，请点击右上角"连接钱包"按钮重新连接并完成签名认证', {
        duration: 5000,
      });
      return;
    }

    if (points < amount) {
      toast.error(`积分不足！需要 ${amount} 积分，当前余额 ${points} 积分`);
      return;
    }

    setSubmittingBid(true);

    try {
      console.log('🔍 出价请求:', {
        token_id: parseInt(id, 10),
        creation_id: parseInt(id, 10),
        price: amount,
        bid: true,
        authHeadersCount: Object.keys(authHeaders).length,
        hasUserAddress: !!authHeaders['User-Address'],
        hasSignature: !!authHeaders['Signature'],
        hasMessage: !!authHeaders['Message'],
        hasTimestamp: !!authHeaders['Timestamp'],
        userAddress: authHeaders['User-Address'] ? `${authHeaders['User-Address'].substring(0, 6)}...${authHeaders['User-Address'].substring(authHeaders['User-Address'].length - 4)}` : null,
        timestamp: authHeaders['Timestamp'],
        currentAccount: account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : null,
        addressMatch: address && account && address.toLowerCase() === account.toLowerCase()
      });

      // 调用出价API（后续可以实现专门的出价API）
      // 目前使用购买API作为临时方案
      const response = await apiService.buyItem({
        token_id: parseInt(id, 10),
        creation_id: parseInt(id, 10),
        price: amount,
        bid: true
      });

      toast.success(`出价成功！已出价 ${amount} 积分`);
      
      // 刷新用户积分
      if (forceRefreshConnection) {
        forceRefreshConnection();
      }

      setBidDialogOpen(false);
      setBidAmount('');
    } catch (error) {
      console.error('❌ 出价失败:', error);
      
      let errorMessage = '出价失败，请稍后重试';
      if (error.status === 401 || error.message?.includes('Unauthorized')) {
        errorMessage = '认证失败，请刷新页面后重新连接钱包并完成签名认证';
        localStorage.removeItem('authSignature');
        localStorage.removeItem('authMessage');
        localStorage.removeItem('authTimestamp');
      } else if (error.details?.message) {
        errorMessage = error.details.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setSubmittingBid(false);
    }
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
            {creation?.title || '未命名作品'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {creation?.description || '暂无描述'}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            所有者: 
            <Chip 
              label={creation?.owner === account ? '你' : (creation?.owner ? `${creation.owner.substring(0, 6)}...` : '未知')} 
              onClick={() => creation?.owner && navigate(`/profile/${creation.owner}`)}
              sx={{ ml: 1 }}
            />
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mr: 2 }}
              onClick={handlePurchaseLicense}
              disabled={!connected || creation?.owner === account}
            >
              购买授权
            </Button>
            <Button 
              variant="outlined" 
              color="secondary"
              onClick={handleBid}
              disabled={!connected || creation?.owner === account}
            >
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
                {creation.contributors && creation.contributors.length > 0 ? (
                  <Stack spacing={2}>
                    {creation.contributors.map((contributor, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip 
                          label={contributor.address ? `${contributor.address.substring(0, 10)}...` : '未知地址'} 
                          onClick={() => contributor.address && navigate(`/profile/${contributor.address}`)}
                        />
                        <Typography>{contributor.share}%</Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">暂无贡献者信息</Typography>
                )}
              </CardContent>
            </Card>
          )}
          {tabValue === 2 && <Typography>授权历史暂未实现</Typography>}
          {tabValue === 3 && <Typography>交易历史暂未实现</Typography>}
        </Box>
      </Box>

      {/* 购买授权对话框 */}
      <Dialog open={licenseDialogOpen} onClose={() => !purchasingLicense && setLicenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>购买授权</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>授权类型</InputLabel>
              <Select
                value={licenseType}
                label="授权类型"
                onChange={(e) => setLicenseType(e.target.value)}
              >
                <MenuItem value="personal">个人授权 (200积分/月)</MenuItem>
                <MenuItem value="commercial">商业授权 (500积分/月)</MenuItem>
                <MenuItem value="exclusive">独家授权 (2000积分/月)</MenuItem>
              </Select>
              <FormHelperText>
                {licenseType === 'personal' && '个人授权：仅限个人使用，不可用于商业用途'}
                {licenseType === 'commercial' && '商业授权：可用于商业用途，但非独家'}
                {licenseType === 'exclusive' && '独家授权：独家商业使用权，价格较高'}
              </FormHelperText>
            </FormControl>
            
            <TextField
              fullWidth
              label="授权期限（天）"
              type="number"
              value={licenseDuration}
              onChange={(e) => setLicenseDuration(parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 365 }}
              sx={{ mb: 2 }}
              helperText={`预计费用: ${Math.ceil((licenseType === 'commercial' ? 500 : licenseType === 'exclusive' ? 2000 : 200) * (licenseDuration / 30))} 积分`}
            />
            
            <Typography variant="body2" color="text.secondary">
              作品: {creation?.title}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLicenseDialogOpen(false)} disabled={purchasingLicense}>
            取消
          </Button>
          <Button 
            onClick={(e) => {
              console.log('🖱️ 购买授权按钮被点击！', e);
              console.log('🖱️ 当前时间:', new Date().toISOString());
              console.log('🖱️ handleConfirmPurchaseLicense 函数:', typeof handleConfirmPurchaseLicense);
              try {
                handleConfirmPurchaseLicense();
              } catch (error) {
                console.error('❌ 按钮点击处理出错:', error);
              }
            }} 
            variant="contained"
            disabled={purchasingLicense || !licenseDuration || licenseDuration <= 0}
          >
            {purchasingLicense ? '购买中...' : '确认购买'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 出价对话框 */}
      <Dialog open={bidDialogOpen} onClose={() => !submittingBid && setBidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>出价</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="出价金额（积分）"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{ mb: 2 }}
              helperText={`当前余额: ${points} 积分`}
            />
            
            <Typography variant="body2" color="text.secondary">
              作品: {creation?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              出价后，作品所有者可以接受或拒绝您的出价
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDialogOpen(false)} disabled={submittingBid}>
            取消
          </Button>
          <Button 
            onClick={handleConfirmBid} 
            variant="contained"
            disabled={submittingBid || !bidAmount || parseFloat(bidAmount) <= 0}
          >
            {submittingBid ? '提交中...' : '确认出价'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreationDetails;
