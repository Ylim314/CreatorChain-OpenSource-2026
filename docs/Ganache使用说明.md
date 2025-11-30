# Ganache 本地网络使用说明

## 问题说明

Ganache 默认情况下**不会自动保存工作区状态**，重启后所有账户余额会重置为初始值（100 ETH）。这会导致以下问题：

1. 如果之前从 Ganache 导入账户到 MetaMask，重启后这些账户在 Ganache 中的余额会重置
2. MetaMask 中的账户余额会显示为 0 或很少，因为 Ganache 状态已重置
3. 无法支付 Gas 费用进行交易

## 解决方案

### 方案 1：保存 Ganache 工作区（推荐）

1. **保存工作区**
   - 在 Ganache 界面右上角点击 **"SAVE"** 按钮
   - 选择保存位置并命名工作区（例如：`creatorchain-workspace`）
   - 下次启动时，点击 **"WORKSPACE QUICKSTART"** 或打开保存的工作区文件

2. **自动保存设置**
   - 在 Ganache 设置中启用自动保存
   - 这样每次关闭时会自动保存当前状态

### 方案 2：重新导入账户到 MetaMask

如果 Ganache 已重启且状态丢失，需要重新导入账户：

1. **获取账户私钥**
   - 在 Ganache 中，点击账户右侧的钥匙图标
   - 复制私钥（Private Key）

2. **导入到 MetaMask**
   - 打开 MetaMask
   - 点击账户图标 → **"导入账户"**
   - 选择 **"私钥"** 选项
   - 粘贴私钥并确认

3. **确保连接到正确的网络**
   - MetaMask 应该连接到 **Ganache Local** 网络
   - Chain ID: **5777**
   - RPC URL: `http://127.0.0.1:7545`

### 方案 3：使用助记词恢复账户

如果保存了 Ganache 的助记词（Mnemonic Phrase），可以：

1. **在 Ganache 中使用助记词**
   - 启动 Ganache 时选择 **"WORKSPACE QUICKSTART"**
   - 输入之前保存的助记词
   - 这样会恢复相同的账户和余额

2. **在 MetaMask 中使用助记词**
   - 在 MetaMask 中导入账户时选择 **"助记词"**
   - 输入相同的助记词
   - 选择相同的账户索引（通常是第一个账户，索引 0）

## 当前网络配置

项目已配置支持以下本地网络：

- **Hardhat**: Chain ID `1337`, RPC `http://127.0.0.1:8545`
- **Ganache**: Chain ID `5777`, RPC `http://127.0.0.1:7545`

## 验证网络连接

1. **检查 Ganache 运行状态**
   - 确认 Ganache 正在运行
   - 检查 RPC Server 地址：`HTTP://127.0.0.1:7545`
   - 确认 Network ID: `5777`

2. **检查 MetaMask 网络**
   - 打开 MetaMask
   - 确认当前网络显示为 **"Ganache Local"** 或 **"CreatorChain Local"**
   - 确认 Chain ID 为 `5777`

3. **检查账户余额**
   - 在 Ganache 中查看账户余额（应该是 100 ETH）
   - 在 MetaMask 中查看相同地址的余额（应该匹配）

## 常见问题

### Q: MetaMask 显示余额为 0，但 Ganache 显示有余额？

**A:** 这通常是因为：
- MetaMask 连接的网络不正确（检查 Chain ID）
- MetaMask 中的账户地址与 Ganache 中的不匹配
- Ganache 重启后状态重置，但 MetaMask 仍显示旧状态

**解决方法：**
1. 确认 MetaMask 连接到 Ganache 网络（Chain ID 5777）
2. 刷新 MetaMask 或重新导入账户
3. 在 Ganache 中重新查看账户余额

### Q: 交易失败，提示余额不足？

**A:** 检查以下几点：
1. Ganache 是否正在运行
2. MetaMask 是否连接到正确的网络（Chain ID 5777）
3. 账户是否有足够的 ETH（Ganache 默认每个账户 100 ETH）
4. 如果 Ganache 刚重启，需要重新导入账户

### Q: 如何永久保存 Ganache 状态？

**A:** 
1. 每次关闭 Ganache 前点击 **"SAVE"** 保存工作区
2. 启用 Ganache 的自动保存功能
3. 使用相同的助记词启动 Ganache，这样账户地址会保持一致

## 最佳实践

1. **开发前检查**
   - 启动 Ganache
   - 确认账户有足够的 ETH（至少 1 ETH）
   - 在 MetaMask 中确认网络连接正确

2. **定期保存**
   - 每次重要操作后保存 Ganache 工作区
   - 记录助记词和重要账户的私钥（仅用于开发环境）

3. **使用固定账户**
   - 始终使用 Ganache 中的第一个账户（索引 0）进行开发
   - 这样可以避免每次重启后需要重新导入多个账户

## 相关文件

- 合约地址配置：`client/src/services/blockchainService.js`
- 网络配置：`client/src/context/Web3ContextFixed.js`
- Ganache 配置：查看 Ganache 界面中的网络设置

