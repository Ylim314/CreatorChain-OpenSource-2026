// 应用常量定义

// 用户角色
export const USER_ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// 创作类型
export const CREATION_TYPES = {
  AI_GENERATED: 'ai_generated',
  MANUAL: 'manual',
  HYBRID: 'hybrid',
};

// 创作状态
export const CREATION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

// 文件类型
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac'],
  VIDEO: ['mp4', 'avi', 'mov', 'mkv'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
};

// 文件大小限制 (字节)
export const FILE_SIZE_LIMITS = {
  IMAGE: 50 * 1024 * 1024, // 50MB
  AUDIO: 100 * 1024 * 1024, // 100MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
};

// AI模型
export const AI_MODELS = {
  GPT_4: 'gpt-4',
  DALL_E_3: 'dall-e-3',
  STABLE_DIFFUSION: 'stable-diffusion',
  MIDJOURNEY: 'midjourney',
};

// 积分相关
export const POINTS = {
  NEW_USER_BONUS: 1000,
  CREATION_REWARD: 100,
  LIKE_REWARD: 5,
  SHARE_REWARD: 10,
  COMMENT_REWARD: 15,
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  CREATE: '/create',
  AI_STUDIO: '/ai-chat',
  MANUAL_CREATION: '/manual-creation',
  MY_CREATIONS: '/my-creations',
  MY_FAVORITES: '/my-favorites',
  EXPLORE: '/explore',
  MARKETPLACE: '/marketplace',
  PROFILE: '/profile',
  GOVERNANCE: '/governance',
  GETTING_STARTED: '/getting-started',
};

// 错误消息
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  INSUFFICIENT_BALANCE: '余额不足',
  NETWORK_ERROR: '网络连接错误',
  FILE_TOO_LARGE: '文件大小超出限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
  CREATION_FAILED: '创作失败，请重试',
  UPLOAD_FAILED: '上传失败，请重试',
};

// 成功消息
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: '钱包连接成功',
  CREATION_SUCCESS: '作品创建成功',
  UPLOAD_SUCCESS: '文件上传成功',
  FAVORITE_ADDED: '已添加到收藏',
  FAVORITE_REMOVED: '已从收藏中移除',
};

// 本地存储键名
export const STORAGE_KEYS = {
  FAVORITES: 'creatorchain_favorites',
  USER_SETTINGS: 'creatorchain_user_settings',
  THEME_MODE: 'creatorchain_theme_mode',
  AUTH_TOKEN: 'creatorchain_auth_token',
  USER_ADDRESS: 'creatorchain_user_address',
};