# CreatorChain Contracts

## 📁 项目结构（Contracts 工作区）

```
contracts/
├─ contracts/                # Solidity 合约
│  ├─ CreatorToken.sol       # 平台代币
│  ├─ CreatorNFT.sol         # 创作者作品 NFT
│  ├─ LicenseManager.sol     # 授权/许可管理
│  ├─ CreatorDAO.sol         # DAO 治理
│  └─ SimpleCreationRegistry.sol # 轻量确权示例
├─ scripts/                  # 部署/辅助脚本（deploy-full.cjs 等）
├─ test/                     # Hardhat 测试
├─ tools/                    # Hardhat 工具
├─ artifacts/                # 编译产物
├─ cache/                    # 编译缓存
├─ node_modules/             # 依赖
├─ deployed-addresses.json   # 部署地址记录
├─ deployed-contracts.json   # 部署信息
├─ hardhat.config.cjs        # Hardhat 配置
├─ package.json / lock       # 依赖清单
└─ README.md
```

## 🔧 常用命令
- 安装依赖：`npm install`
- 编译合约：`npx hardhat compile`
- 运行测试：`npx hardhat test`
- 本地部署示例：`npx hardhat run scripts/deploy-simple.js --network localhost`
- 覆盖率：`npx hardhat coverage`

## 🧭 部署提示
- 在 `.env` 或 Hardhat 配置中填好 `RPC_URL`、私钥等敏感信息，勿提交到仓库。
- 本地/开发网可使用默认助记词；测试网/主网请替换为安全私钥。
- 部署后更新 `deployed-addresses.json` 以便前端/后端读取。

