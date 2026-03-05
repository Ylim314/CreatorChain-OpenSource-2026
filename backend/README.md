# CreatorChain Backend

> 新增：补充清晰的后端项目结构，便于快速定位模块。

## 📁 项目结构（Backend）

```
backend/
├─ cmd/
│  └─ api/
│     └─ main.go                   # 应用入口
├─ internal/                       # 业务模块
│  ├─ api/                         # HTTP 处理
│  ├─ ai/                          # AI 引擎/模型集成
│  ├─ analysis/                    # 贡献度/风控分析
│  ├─ blockchain/                  # 链上交互客户端
│  ├─ ipfs/                        # IPFS/Pinata 集成
│  ├─ monitoring/                  # 监控与日志
│  ├─ repository/                  # 数据访问与模型
│  ├─ security/                    # 安全与权限
│  ├─ service/                     # 核心业务逻辑
│  └─ zkp/                         # 零知识证明
├─ pkg/
│  └─ utils/                       # 公共工具与配置
├─ scripts/                        # 辅助脚本
├─ uploads/                        # 本地上传目录
├─ docker-compose.yml
├─ Dockerfile
├─ go.mod / go.sum
├─ start_backend.bat               # Windows 一键启动
└─ README.md
```

### 常用命令
- 依赖：`cd backend && go mod tidy`
- 运行：`go run cmd/api/main.go`
- 编译：`go build -o bin/creatorchain cmd/api/main.go`
- 测试：`go test ./...`

基于 Go 的 CreatorChain 区块链创作平台后端服务，集成 AI 引擎、零知识证明和分布式存储。

## 🚀 快速开始

### 环境要求

- **Go**: 1.24+ (推荐使用 go1.24.7)
- **MySQL**: 8.0+ (默认数据库)
- **Redis**: 6+ (可选，支持内存缓存)
- **IPFS**: 本地节点或 Pinata API
- **Node.js**: 18+ (用于前端)

### 安装依赖

```bash
go mod tidy
```

### 配置环境

1. 复制环境配置文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置你的数据库和服务：

```bash
# 数据库配置 (MySQL)
# MySQL (默认数据库)
DATABASE_URL=mysql://root:720720@localhost:3306/creatorchain?charset=utf8mb4&parseTime=True&loc=Local

# PostgreSQL (生产环境推荐)
# DATABASE_URL=postgres://username:password@localhost:5432/creatorchain?sslmode=disable

# Redis配置 (可选，支持内存缓存)
REDIS_URL=redis://localhost:6379

# 以太坊节点配置
ETHEREUM_RPC=http://localhost:8545

# 服务端口
PORT=8080

# 积分管理配置（安全加固）
# POINTS_ADMIN_ADDRESSES: 管理员地址列表，用逗号分隔
# 只有列表中的地址才能调用 /api/v1/points/add 接口添加积分
# 示例: POINTS_ADMIN_ADDRESSES=0x1234567890123456789012345678901234567890,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
POINTS_ADMIN_ADDRESSES=
```

### 运行服务

#### 方法一：使用启动脚本 (推荐)

```bash
# 仅启动后端（在 backend 目录）
start_backend.bat
```

#### 方法二：手动启动

```bash
# 开发模式
go run cmd/api/main.go

# 或编译后运行
go build -o creatorchain-api cmd/api/main.go
./creatorchain-api
```

服务启动后访问：
- **后端 API**: http://localhost:8080
- **健康检查**: http://localhost:8080/health
- **监控面板**: http://localhost:8080/monitoring/metrics

## 📁 项目结构

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # 程序入口
├── internal/
│   ├── api/                     # HTTP 处理层
│   │   ├── user_handler.go      # 用户接口
│   │   ├── creation_handler.go  # 创作接口
│   │   ├── marketplace_handler.go # 市场接口
│   │   ├── transaction_handler.go # 交易接口
│   │   ├── ai_handler.go        # AI生成接口
│   │   └── middleware.go        # 中间件
│   ├── service/                 # 业务逻辑层
│   │   ├── user_service.go
│   │   ├── creation_service.go
│   │   └── marketplace_service.go
│   ├── repository/              # 数据访问层
│   │   ├── models.go            # 数据模型
│   │   ├── database.go          # 数据库连接
│   │   ├── user_repository.go
│   │   ├── creation_repository.go
│   │   └── transaction_repository.go
│   ├── ai/                      # AI引擎
│   │   └── ai_engine.go         # AI模型集成
│   ├── zkp/                     # 零知识证明
│   │   └── zkp_engine.go        # ZKP验证引擎
│   ├── ipfs/                    # 分布式存储
│   │   └── ipfs_client.go       # IPFS客户端
│   └── blockchain/              # 区块链客户端
│       └── client.go
└── pkg/
    └── utils/
        └── config.go            # 配置工具
```

## 🛠 API 接口

### 健康检查

- `GET /health` - 服务状态检查

### 用户认证

- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `GET /api/v1/users/:address` - 获取用户信息
- `PUT /api/v1/users/:address` - 更新用户信息

### 创作管理

- `GET /api/v1/public/creations` - 获取创作列表
- `POST /api/v1/creations` - 创建新作品
- `GET /api/v1/public/creations/:id` - 获取作品详情
- `PUT /api/v1/creations/:id` - 更新作品信息
- `DELETE /api/v1/creations/:id` - 删除作品

### AI 生成服务

- `GET /api/v1/ai/models` - 获取可用 AI 模型
- `GET /api/v1/ai/models/:model` - 获取模型详细信息
- `POST /api/v1/ai/generate` - AI 内容生成
- `GET /api/v1/ai/verify/:hash` - 验证零知识证明
- `GET /api/v1/ai/ipfs/:hash` - 获取 IPFS 内容

### 市场交易

- `GET /api/v1/public/marketplace/listings` - 获取商品列表
- `POST /api/v1/marketplace/list` - 上架商品
- `POST /api/v1/marketplace/buy` - 购买商品

### 积分系统

- `GET /api/v1/points/:address` - 获取积分余额
- `POST /api/v1/points/transfer` - 转移积分
- `POST /api/v1/points/add` - 添加积分
- `GET /api/v1/points/history/:address` - 获取积分历史

### 交易记录

- `GET /api/v1/public/transactions` - 获取交易列表
- `GET /api/v1/public/transactions/:hash` - 获取交易详情
- `GET /api/v1/public/stats/transactions` - 获取交易统计
- `GET /api/v1/public/stats/gas` - 获取 Gas 统计

## 🔧 技术栈

### 核心框架

- **Web 框架**: Gin 1.9.1
- **数据库**: MySQL 8.0+ + GORM 1.30.0
- **缓存**: Redis 6+ + go-redis/v9 (支持内存缓存)
- **配置管理**: godotenv 1.5.1
- **区块链**: go-ethereum 1.13.8

### AI 引擎

- **模型集成**: Stable Diffusion, DALL-E 3, Midjourney
- **贡献度分析**: 科学评分算法
- **模型管理**: 多模型切换和优化

### 零知识证明

- **算法**: Schnorr 零知识证明
- **隐私保护**: 创作过程隐私验证
- **证明生成**: 自动化证明生成和验证

### 分布式存储

- **IPFS**: 内容寻址存储
- **Pinata API**: 企业级 IPFS 服务
- **冗余备份**: 多节点存储保障

### 区块链集成

- **以太坊**: go-ethereum 1.13.8
- **智能合约**: Solidity 0.8.20
- **安全库**: OpenZeppelin + SafeMath

## 📝 开发说明

### 数据库迁移

程序启动时会自动执行数据库迁移，创建必要的表结构。使用 MySQL 作为默认数据库。

### 认证机制

使用以太坊签名进行用户认证，支持 Web3 钱包登录。包含防重放攻击的时间戳验证。

### 错误处理

统一的错误响应格式：

```json
{
  "error": "错误描述"
}
```

### 分页查询

列表接口支持分页，默认参数：

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

## 🔐 安全特性

- **多层安全防护**: CORS 跨域保护、速率限制、输入清理
- **以太坊签名认证**: 基于钱包地址的身份验证
- **防重放攻击**: 时间戳验证机制
- **数据验证和清理**: XSS 和注入攻击防护
- **审计日志**: 完整的操作记录和监控

## 📈 性能优化

- **多级缓存**: Redis 缓存 + 内存缓存
- **数据库优化**: 连接池、自动索引、查询优化
- **分页查询**: 避免大量数据加载
- **监控系统**: 实时性能指标和健康检查
- **Gin 高性能**: HTTP 服务器优化

## 🚀 部署

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t creatorchain-backend .

# 运行容器
docker run -p 8080:8080 --env-file .env creatorchain-backend
```

### 直接部署

```bash
# 编译
go build -o creatorchain-api cmd/api/main.go

# 运行
./creatorchain-api
```

## 📚 相关文档

- [前端项目](../client/README.md)
- [智能合约](../contracts/README.md)
- [部署指南](../docs/作品安装说明.md)
- [项目主文档](../docs/README.md)
- [作品简介](../docs/作品简介.md)
- [设计思路](../docs/设计思路.md)

## 🎯 快速启动

使用项目根目录的启动脚本：

```bash
# 一键启动整个项目
../start_all.bat
```

启动后访问：
- **前端**: http://localhost:3000
- **后端**: http://localhost:8080
- **健康检查**: http://localhost:8080/health
