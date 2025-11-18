# 安全修复说明

## 已实施修复
- **签名与重放防护**：`backend/internal/security/signature.go` 与 `backend/internal/security/timestamp.go` 提供统一消息格式、时间戳校验与重放守卫；`backend/internal/api/middleware.go`、`backend/internal/service/user_service.go`、`backend/internal/api/user_handler.go` 均要求 `CreatorChain Authentication` 消息和时间戳，彻底阻断 5 分钟窗口内的重放攻击。
- **登录链路一致性**：前端 `client/src/context/Web3ContextFixed.js` 和 `client/src/services/apiService.js` 会在登录与后续请求中附带 `User-Address/Signature/Message/Timestamp` 头部；后台只要读取这些头即可复用 AuthMiddleware。
- **零知识证明校验**：`backend/internal/zkp/zkp_engine.go` 允许配置化的有效期，只拒绝明显异常的时间戳，避免历史证明自动失效。
- **防护中间件**：`backend/internal/api/security_middleware.go` 现在基于 `CORS_ORIGINS` 白名单返回 CORS 头，并提供真正的 `RequestTimeoutMiddleware`；`backend/cmd/api/main.go` 通过 `REQUEST_TIMEOUT_SECONDS` 自动开启全局超时，超时请求返回 504。
- **回归测试**：新增 `backend/internal/security/*_test.go` 与 `backend/internal/service/user_service_test.go`，涵盖消息格式、时间戳解析、重放守卫与 JWT 发放，`go test ./...` 现可对关键路径进行自动回归。
- **文档整理**：`AGENTS.md` 与本文档同步记录签名规范、CORS/超时配置以及新的环境变量，便于交接。

## 下一步建议
1. **前端 UI 提示**：在连接钱包时提示“需要签名登录消息”，降低用户误解签名风险。
2. **覆盖率扩展**：对 `AuthMiddleware`、AI 上传路由、Marketplace TODO 等补充集成或端到端测试，确保未来改动有失败信号。
3. **部署基线**：在 `docs/` 中新增 `deploy_security_checklist.md`，列出必须配置的环境变量（数据库、Redis、`CORS_ORIGINS`、`REQUEST_TIMEOUT_SECONDS`、链上私钥等）。
4. **敏感配置轮换**：上线前替换 Hardhat 示例私钥，并在 CI/CD 中加入 secret 扫描或预提交检查，避免明文密钥混入仓库。
