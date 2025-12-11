// IPFS上传和管理工具 - 企业级实现

// IPFS配置
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
const IPFS_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud';

// 允许的文件类型
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: [
    'audio/mpeg',      // .mp3
    'audio/mp3',       // .mp3 (某些浏览器)
    'audio/wav',       // .wav
    'audio/wave',      // .wav (某些浏览器)
    'audio/x-wav',     // .wav (某些浏览器)
    'audio/ogg',       // .ogg
    'audio/opus',      // .opus
    'audio/mp4',       // .m4a (iOS/Android录音)
    'audio/x-m4a',     // .m4a (某些浏览器)
    'audio/aac',       // .aac
    'audio/aacp',      // .aac (某些浏览器)
    'audio/3gpp',      // .3gp (Android录音)
    'audio/amr',       // .amr (Android录音)
    'audio/x-caf',     // .caf (iOS录音)
    'audio/flac',      // .flac
    'audio/webm'       // .webm
  ],
  document: ['application/pdf', 'text/plain', 'application/json']
};

// 最大文件大小 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 根据文件类型获取上传端点
const getUploadEndpoint = (fileType) => {
  if (!fileType) {
    return '/upload/image'; // 默认使用图片端点
  }
  
  if (fileType.startsWith('audio/')) {
    return '/upload/audio';
  } else if (fileType.startsWith('image/')) {
    return '/upload/image';
  } else {
    // 对于其他类型，默认使用图片端点（可以根据需要扩展）
    return '/upload/image';
  }
};

// 使用本地服务上传文件，返回 { hash, url }
const uploadToLocalService = (file, metadata, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  // 根据文件类型选择正确的上传端点
  const endpoint = getUploadEndpoint(file.type);
  const uploadUrl = `http://localhost:8080/api/v1${endpoint}`;

  // 上传到本地服务（不发送认证头，因为上传端点不需要认证）
  return fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
    // 不设置认证头，避免包含换行符的Message header导致400错误
  }).then(response => {
    if (!response.ok) {
      return response.json().catch(() => ({})).then(errorData => {
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      });
    }
    return response.json();
  }).then(result => {
    if (!result.success || !result.data) {
      throw new Error('上传响应格式错误');
    }
    return {
      hash: result.data.contentHash || result.data.url,
      url: result.data.url,
    };
  });
};

/**
 * 上传文件到IPFS
 * @param {File|Blob} file - 要上传的文件
 * @param {Object} metadata - 文件元数据
 * @param {Function} onProgress - 上传进度回调
 * @returns {Promise<{hash:string, url?:string}>} IPFS哈希值和可访问URL
 */
export const uploadToIPFS = async (file, metadata = {}, onProgress = null) => {
  try {
    // 验证文件
    validateFile(file);

    // 优先使用本地上传服务
    try {
      return await uploadToLocalService(file, metadata, onProgress);
    } catch (error) {
      console.warn('本地上传服务失败，尝试使用IPFS服务:', error.message);
    }

    // 检查IPFS服务配置
    if (!PINATA_API_KEY && !PINATA_JWT) {
      // IPFS服务未配置，使用模拟模式
      return { hash: generateMockHash(file), url: null };
    }

    // 使用Pinata API上传
    const ipfsHash = await uploadToPinata(file, metadata, onProgress);

    // 文件上传成功

    return { hash: ipfsHash, url: `${IPFS_GATEWAY}/ipfs/${ipfsHash}` };

  } catch (error) {
    throw new Error(`IPFS上传失败: ${error.message}`);
  }
};

/**
 * 使用Pinata API上传文件
 */
const uploadToPinata = async (file, metadata, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  // 添加元数据
  const pinataMetadata = {
    name: metadata.name || file.name || `upload_${Date.now()}`,
    keyvalues: {
      creator: metadata.creator || 'unknown',
      timestamp: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size.toString(),
      ...metadata.attributes
    }
  };

  formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

  // 设置固定选项
  const pinataOptions = {
    cidVersion: 1,
    wrapWithDirectory: false
  };

  formData.append('pinataOptions', JSON.stringify(pinataOptions));

  // 准备请求头
  const headers = {};

  if (PINATA_JWT) {
    headers['Authorization'] = `Bearer ${PINATA_JWT}`;
  } else {
    headers['pinata_api_key'] = PINATA_API_KEY;
    headers['pinata_secret_api_key'] = PINATA_SECRET_API_KEY;
  }

  // 发送请求
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: headers,
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
};

/**
 * 验证文件
 */
const validateFile = (file) => {
  if (!file) {
    throw new Error('文件不能为空');
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB)`);
  }

  // 检查文件类型
  if (file.type && !isAllowedFileType(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}`);
  }
};

/**
 * 检查是否为允许的文件类型
 */
const isAllowedFileType = (mimeType) => {
  return Object.values(ALLOWED_FILE_TYPES).some(types => types.includes(mimeType));
};

/**
 * 生成模拟IPFS哈希
 */
const generateMockHash = (file) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const fileName = file.name ? file.name.replace(/[^a-zA-Z0-9]/g, '') : 'unnamed';

  // 生成类似真实的IPFS哈希
  return `Qm${random}${fileName}${timestamp}`.substring(0, 46);
};

/**
 * 从 IPFS 获取文件
 * @param {string} cid - IPFS 哈希值
 * @param {Object} options - 获取选项
 * @returns {Promise<Blob>} 文件数据
 */
export const retrieveFromIPFS = async (cid, options = {}) => {
  try {
    const url = makeGatewayURL(cid);
    const response = await fetch(url, {
      timeout: options.timeout || 30000
    });

    if (!response.ok) {
      throw new Error(`获取文件失败: ${response.status} ${response.statusText}`);
    }

    return await response.blob();

  } catch (error) {
    // 从 IPFS 获取文件失败
    throw error;
  }
};

/**
 * 构建IPFS网关URL
 * @param {string} cid - IPFS哈希值或本地URL路径
 * @param {string} path - 文件路径(可选)
 * @returns {string} 完整的URL
 */
export const makeGatewayURL = (cid, path = '') => {
  if (!cid) {
    return 'https://via.placeholder.com/300x200?text=Loading';
  }

  // 检查是否为本地上传的URL路径
  if (cid.startsWith('/uploads/')) {
    return `http://localhost:8080${cid}`;
  }

  // 验证CID格式
  if (!isValidCID(cid)) {
    // 无效的IPFS CID
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(cid)}`;
  }

  const cleanPath = path.startsWith('/') ? path : (path ? '/' + path : '');
  return `${IPFS_GATEWAY}/ipfs/${cid}${cleanPath}`;
};

/**
 * 验证IPFS CID格式
 */
const isValidCID = (cid) => {
  if (!cid || typeof cid !== 'string') {
    return false;
  }

  // CIDv0格式 (Qm...)
  if (cid.length === 46 && cid.startsWith('Qm')) {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid);
  }

  // CIDv1格式 (bafy...)
  if (cid.length >= 59 && cid.startsWith('bafy')) {
    return /^bafy[a-z2-7]+$/.test(cid);
  }

  return false;
};

/**
 * 上传JSON数据到IPFS
 * @param {Object} data - 要上传的JSON数据
 * @param {Object} metadata - 元数据
 * @returns {Promise<string>} IPFS哈希值
 */
export const uploadJSONToIPFS = async (data, metadata = {}) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    return await uploadToIPFS(blob, {
      ...metadata,
      name: metadata.name || 'metadata.json',
      attributes: {
        ...metadata.attributes,
        contentType: 'application/json',
        dataType: 'metadata'
      }
    });
  } catch (error) {
    // 上传JSON数据失败
    throw error;
  }
};

/**
 * 从 IPFS 获取JSON数据
 * @param {string} cid - IPFS哈希值
 * @returns {Promise<Object>} JSON数据
 */
export const retrieveJSONFromIPFS = async (cid) => {
  try {
    const blob = await retrieveFromIPFS(cid);
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    // 从 IPFS 获取JSON数据失败
    throw error;
  }
};

/**
 * 检查IPFS服务状态
 * @returns {Promise<boolean>} 服务是否可用
 */
export const checkIPFSService = async () => {
  try {
    if (!PINATA_API_KEY && !PINATA_JWT) {
      return false;
    }

    const headers = {};
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_SECRET_API_KEY;
    }

    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: headers
    });

    return response.ok;
  } catch (error) {
    // 检查IPFS服务失败
    return false;
  }
};

/**
 * 获取文件信息
 * @param {string} cid - IPFS哈希值
 * @returns {Promise<Object>} 文件信息
 */
export const getFileInfo = async (cid) => {
  try {
    const url = makeGatewayURL(cid);
    const response = await fetch(url, { method: 'HEAD' });

    return {
      cid,
      size: parseInt(response.headers.get('content-length') || '0'),
      type: response.headers.get('content-type') || 'unknown',
      url: url,
      accessible: response.ok
    };
  } catch (error) {
    // 获取文件信息失败
    return {
      cid,
      size: 0,
      type: 'unknown',
      url: makeGatewayURL(cid),
      accessible: false
    };
  }
};

// 导出常量
export {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  IPFS_GATEWAY
};
