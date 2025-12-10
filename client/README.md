# CreatorChain Client

## 📁 项目结构（Client 工作区）

```
client/
├─ src/
│  ├─ components/      # 通用组件
│  ├─ pages/           # 页面
│  ├─ context/         # 全局状态/Provider
│  ├─ services/        # API 封装 (axios/ethers)
│  ├─ utils/           # 工具函数
│  ├─ config/          # 配置
│  ├─ constants/       # 常量
│  ├─ hooks/           # 自定义 Hooks
│  ├─ data/            # 示例数据/文案
│  └─ theme/           # 主题与样式
├─ public/             # 静态资源
├─ build/              # 构建产物（npm run build）
├─ package.json / lock # 依赖清单
├─ tailwind.config.js  # Tailwind 配置
└─ README.md
```

## 🔧 常用命令
- 安装依赖：`npm install`
- 开发启动：`npm start`  (默认 http://localhost:3000)
- 构建产物：`npm run build`
- 运行测试：`npm test -- --watch=false`

## 🔗 区块链/后端接入
- 默认链上交互通过 `services` 或 `utils` 中的 Ethers.js 封装；部署地址与 ABI 需与 `contracts` 工作区保持同步。
- API 基址请在 `.env` 或配置文件中设置，避免写死在源码。

