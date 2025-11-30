# CreatorChain 安全审计报告

## 审计范围
- 钱包连接功能
- 购买创作市场中的作品授权功能
- 购买后本地积分更新机制

## 审计日期
2024年（当前日期）

---

## 🔴 严重漏洞 (Critical)

### 1. 价格验证缺失 - 前端价格可被篡改
**位置**: `client/src/pages/Marketplace.js:249-253`

**问题描述**:
- 前端从字符串提取价格（`extractPrice`），但发送给后端的是提取后的数值
- 后端直接使用请求中的 `price` 字段，**没有验证价格是否与创作的实际价格一致**
- 攻击者可以修改前端代码或直接调用API，发送任意价格（如0或负数）

**代码位置**:
```javascript
// 前端发送
const response = await apiService.buyItem({
  token_id: parseInt(item.id, 10),
  creation_id: item.id,
  price: price  // ⚠️ 这个价格可能被篡改
});
```

```go
// 后端直接使用，没有验证
var req struct {
    Price int64 `json:"price"`
}
// ... 没有验证 req.Price 是否等于 creation 的实际价格
```

**影响**: 
- 攻击者可以以0积分或任意低价购买作品
- 创作者损失积分收入

**修复建议**:
1. 后端必须从数据库查询创作的实际价格
2. 验证 `req.Price` 必须等于创作的实际价格
3. 如果价格不匹配，拒绝购买请求

---

### 2. 事务完整性漏洞 - 授权记录创建失败时积分无法回滚
**位置**: `backend/internal/api/marketplace_handler.go:201-238`

**问题描述**:
- 积分转移和授权记录创建不在同一个事务中
- 如果积分转移成功但授权记录创建失败，积分已经扣除但用户没有获得授权
- 代码中只有警告，没有实际回滚机制

**代码位置**:
```go
// 先转移积分
err = h.userRepo.TransferPoints(buyerAddress, creation.CreatorAddress, req.Price)
if err != nil {
    return // 失败则返回
}

// 然后创建授权记录
err = h.licenseRepo.Create(license)
if err != nil {
    // ⚠️ 只有警告，无法回滚积分
    c.JSON(http.StatusInternalServerError, gin.H{
        "warning": "Points may have been deducted. Please contact support if license is not visible.",
    })
    return
}
```

**影响**:
- 用户积分被扣除但没有获得授权
- 需要人工介入修复，用户体验差

**修复建议**:
1. 将积分转移和授权创建放在同一个数据库事务中
2. 如果授权创建失败，自动回滚积分转移
3. 使用分布式事务或补偿机制确保数据一致性

---

## 🟠 高危漏洞 (High)

### 3. 前端积分检查可被绕过
**位置**: `client/src/pages/Marketplace.js:188-191`

**问题描述**:
- 前端检查积分余额，但攻击者可以：
  1. 修改前端代码绕过检查
  2. 直接调用API绕过前端
  3. 在检查后、请求前快速消耗积分

**代码位置**:
```javascript
// 前端检查
if (points < price) {
  toast.error(`积分不足！需要 ${price} 积分，当前余额 ${points} 积分`);
  return;
}
// ⚠️ 这个检查可以被绕过
```

**影响**:
- 虽然后端也有检查，但前端检查的缺失可能导致用户体验问题
- 如果后端检查有漏洞，前端检查的缺失会放大风险

**修复建议**:
- ✅ 后端已有积分检查（`marketplace_handler.go:195`），这是正确的
- ⚠️ 但需要确保后端检查是原子性的，防止并发问题

---

### 4. 积分更新依赖客户端响应 - 可能不同步
**位置**: `client/src/pages/Marketplace.js:257-264`

**问题描述**:
- 前端依赖后端返回的 `new_balance` 更新积分
- 如果响应被篡改、网络问题或后端错误，积分可能不同步
- 虽然有 `refreshPoints` 作为后备，但可能不及时

**代码位置**:
```javascript
// 直接使用响应中的 new_balance 更新积分
if (response && response.new_balance !== undefined && updatePoints) {
  updatePoints(Number(response.new_balance));
} else if (refreshPoints) {
  refreshPoints(); // 后备方案
}
```

**影响**:
- 用户看到的积分可能不准确
- 可能导致用户误以为有足够积分而尝试购买

**修复建议**:
1. 购买成功后总是调用 `refreshPoints()` 从后端获取最新积分
2. 不要完全依赖响应中的 `new_balance`
3. 添加积分同步验证机制

---

### 5. 价格提取逻辑可能不准确
**位置**: `client/src/pages/Marketplace.js:61-65`

**问题描述**:
- 使用正则表达式 `/(\d+)/` 提取价格，可能提取到错误的值
- 如果价格字符串格式变化，提取可能失败

**代码位置**:
```javascript
const extractPrice = (priceString) => {
  if (!priceString) return 0;
  const match = priceString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
```

**影响**:
- 可能提取到错误的价格值
- 导致购买失败或购买错误价格的作品

**修复建议**:
1. 后端应该返回结构化的价格数据（数字类型），而不是字符串
2. 如果必须从字符串提取，使用更严格的解析逻辑
3. 添加价格格式验证

---

## 🟡 中危漏洞 (Medium)

### 6. 时间戳重放攻击窗口过长
**位置**: `backend/internal/security/timestamp.go:51-76`

**问题描述**:
- 时间戳验证窗口为5分钟（300秒）
- 重放攻击保护在5分钟后清除，可能允许重放旧请求

**代码位置**:
```go
// 如果超过5分钟，清除旧记录，允许重新登录
if timeSinceLastLogin > 300 {
    g.latest[key] = timestamp
    return true
}
```

**影响**:
- 攻击者可能在5分钟后重放购买请求
- 虽然签名验证仍然有效，但时间戳检查可能不够严格

**修复建议**:
1. 对于购买等关键操作，使用更短的时间窗口（如1分钟）
2. 使用 nonce 机制防止重放攻击
3. 记录所有购买请求的签名，防止重复使用

---

### 7. 积分转移缺少余额验证
**位置**: `backend/internal/repository/user_repository.go:148-172`

**问题描述**:
- `TransferPoints` 方法直接执行 SQL 更新，没有在事务中先检查余额
- 虽然 `Update` 使用 `points - ?` 可能防止负数，但最好显式检查

**代码位置**:
```go
func (r *userRepository) TransferPoints(fromAddress, toAddress string, amount int64) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        // ⚠️ 没有先检查余额是否足够
        if err := tx.Model(&User{}).Where("address = ?", fromAddress).
            Update("points", gorm.Expr("points - ?", amount)).Error; err != nil {
            return err
        }
        // ...
    })
}
```

**影响**:
- 虽然数据库约束可能防止负数，但最好显式验证
- 如果余额不足，应该返回明确的错误

**修复建议**:
1. 在事务中先查询余额
2. 验证余额是否足够
3. 如果不足，返回明确的错误信息

---

### 8. 账户切换时认证信息清理不完整
**位置**: `client/src/context/Web3ContextFixed.js:269-293`

**问题描述**:
- 账户切换时只清理了部分认证信息
- 可能留下旧的签名和消息，导致认证混乱

**代码位置**:
```javascript
// 清除旧的缓存数据
localStorage.removeItem('userAddress');
localStorage.removeItem('authToken');
// ⚠️ 但没有清除 authSignature, authMessage, authTimestamp
```

**影响**:
- 可能导致使用旧账户的认证信息访问新账户的资源
- 虽然后端会验证签名，但可能造成混淆

**修复建议**:
1. 账户切换时清理所有认证相关的 localStorage 项
2. 使用 `clearAllCache()` 方法确保完整清理

---

## 🟢 低危问题 (Low)

### 9. 前端错误处理不够健壮
**位置**: `client/src/pages/Marketplace.js:276-334`

**问题描述**:
- 错误处理逻辑复杂，但某些边界情况可能未覆盖
- 网络错误和业务错误混在一起处理

**修复建议**:
- 区分网络错误、认证错误、业务错误
- 提供更明确的错误提示

---

### 10. 缺少购买请求的幂等性保护
**位置**: `backend/internal/api/marketplace_handler.go:92-282`

**问题描述**:
- 如果用户重复点击购买按钮，可能发送多个请求
- 虽然前端有 `purchasing` 状态，但网络延迟可能导致重复请求

**修复建议**:
1. 后端添加请求去重机制（使用请求ID或签名）
2. 检查是否已经存在相同的授权记录
3. 使用数据库唯一约束防止重复购买

---

## ✅ 安全措施（已实现）

1. ✅ **后端签名验证**: 使用以太坊签名验证用户身份
2. ✅ **时间戳验证**: 防止重放攻击
3. ✅ **积分余额检查**: 后端检查积分是否足够
4. ✅ **数据库事务**: 积分转移使用事务
5. ✅ **认证中间件**: 所有购买请求都需要认证

---

## 📋 修复优先级

### ✅ 已修复（P0 - 立即修复）
1. ✅ **价格验证缺失** - 已添加后端价格验证，防止价格篡改攻击
2. ✅ **事务完整性漏洞** - 已使用数据库事务确保积分转移和授权创建的原子性
3. ✅ **积分更新机制** - 已修改前端代码，总是从后端刷新积分
4. ✅ **账户切换清理** - 已修复账户切换时完整清理所有认证信息

### 待修复（P1 - 高优先级）
5. **积分转移余额验证** - 显式检查余额（已在事务中添加检查）

### 待修复（P2 - 中优先级）
6. **时间戳窗口** - 缩短关键操作的时间窗口
7. **价格提取逻辑** - 改进解析逻辑（建议后端返回结构化数据）

### 待修复（P3 - 低优先级）
8. **幂等性保护** - 添加请求去重

---

## 🔧 修复建议代码示例

### 修复1: 价格验证
```go
// 在 BuyItem 中，验证价格
if req.Price != creation.Price {
    c.JSON(http.StatusBadRequest, gin.H{
        "error": "Price mismatch. Expected: " + strconv.FormatInt(creation.Price, 10),
    })
    return
}
```

### 修复2: 事务完整性
```go
// 将积分转移和授权创建放在同一事务中
err = h.db.Transaction(func(tx *gorm.DB) error {
    // 转移积分
    if err := tx.Model(&User{}).Where("address = ?", buyerAddress).
        Update("points", gorm.Expr("points - ?", req.Price)).Error; err != nil {
        return err
    }
    
    if err := tx.Model(&User{}).Where("address = ?", creation.CreatorAddress).
        Update("points", gorm.Expr("points + ?", req.Price)).Error; err != nil {
        return err
    }
    
    // 创建授权记录
    if err := tx.Create(license).Error; err != nil {
        return err // 如果失败，整个事务回滚
    }
    
    return nil
})
```

---

## 📝 总结

本次审计发现了 **2个严重漏洞**、**3个高危漏洞**、**4个中危问题**和**2个低危问题**。

### ✅ 已修复的关键问题
1. ✅ **价格验证缺失** - 已添加后端价格验证，防止攻击者篡改价格
2. ✅ **事务完整性漏洞** - 已使用数据库事务确保积分转移和授权创建的原子性，失败时自动回滚
3. ✅ **积分更新机制** - 已修改前端代码，总是从后端刷新积分，不依赖响应中的值
4. ✅ **账户切换清理** - 已修复账户切换时完整清理所有认证信息

### 🔧 修复详情

#### 修复1: 价格验证（backend/internal/api/marketplace_handler.go）
- 添加了价格验证逻辑，确保请求的价格与创作的实际价格一致
- 双重检查机制，防止价格篡改攻击

#### 修复2: 事务完整性（backend/internal/api/marketplace_handler.go）
- 使用 GORM 事务将积分转移和授权创建放在同一个事务中
- 如果授权创建失败，自动回滚积分转移
- 在事务中再次验证余额，防止并发问题

#### 修复3: 积分更新（client/src/pages/Marketplace.js）
- 修改购买成功后的积分更新逻辑
- 总是调用 `refreshPoints()` 从后端获取最新积分
- 不依赖响应中的 `new_balance` 字段

#### 修复4: 账户切换清理（client/src/context/Web3ContextFixed.js）
- 账户切换时清除所有认证相关的 localStorage 项
- 防止使用旧账户的认证信息访问新账户的资源

### ⚠️ 剩余待修复问题
- 积分转移余额验证（已在事务中添加，但可以进一步优化）
- 时间戳窗口优化
- 价格提取逻辑改进
- 幂等性保护

**建议**：已修复的问题都是最关键的安全漏洞。剩余问题可以逐步优化。

