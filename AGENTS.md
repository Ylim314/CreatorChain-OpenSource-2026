# Repository Guidelines

## Project Structure & Module Organization
CreatorChain centers on `backend/` (Go API), `client/` (React UI), and Hardhat workspaces (`blockchain/`, `contracts/`). `backend/cmd/api/main.go` boots the service while `internal/{api,service,repository,ai,blockchain,ipfs,zkp}` holds handlers, logic, persistence, and integrations with helpers under `backend/pkg`. React screens live in `client/src/{components,pages,context,services,theme}` with assets under `client/public`. Solidity sources live in `blockchain/contracts/CreatorChainRegistry.sol` plus `contracts/contracts/SimpleCreationRegistry.sol` with build artifacts inside each `artifacts/` folder and deployment helpers such as `scripts/deploy-enhanced.js`.

## Build, Test, and Development Commands
Backend: `cd backend && go mod tidy`, `go run cmd/api/main.go`, `go build -o bin/creatorchain cmd/api/main.go`, `go test ./...`. Frontend: `cd client && npm install`, `npm start`, `npm run build` (generates `client/build`), `npm test` (Jest + React Testing Library). Smart contracts: inside `blockchain/` or `contracts/` run `npm install`, `npx hardhat compile`, `npx hardhat test`, and deploy with `node ..\scripts\deploy-enhanced.js --network localhost` or `npx hardhat run scripts/deploy-enhanced.js --network sepolia`. Use the root `启动项目.bat` for one-click startup on Windows.

## Coding Style & Naming Conventions
Use `gofmt`/`goimports`, tab indentation, PascalCase exports, and lower-camel receivers as in `internal/api/creation_handler.go`; place config helpers in `pkg/utils`. React code uses 2-space indents, PascalCase component files (`Navbar.js`, `PointsDisplay.js`), camelCase hooks/utilities, and colocated Tailwind classes while shared tokens sit under `src/theme`. Solidity sources must include SPDX headers, pragma `0.8.20`, PascalCase contracts, and OpenZeppelin-style modifiers; pull secrets from `.env` files instead of embedding them in source.

## Testing Guidelines
Add Go specs next to implementations (e.g., `internal/service/user_service_test.go`) using table-driven cases with mocks for DB/IPFS/AI/chain clients, then run `go test ./...`. React specs should live next to the component (`components/__tests__/CreationCard.test.js`) or follow CRA defaults and assert UI states via Testing Library before running `npm test -- --watch=false`. Hardhat specs go under `contracts/test/` or `blockchain/test/`, covering deployment, roles, and failure branches; run `npx hardhat coverage` whenever you change permissions.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits (`feat: 集成智谱GLM-4.6`, `fix: 合并AI引擎格式化修改`, `docs: 完善零知识证明技术说明和注释`, `test: 添加智谱AI API集成测试脚本`), so keep the `type(optional-scope): summary` format in English or Chinese. Each PR must describe touched modules, link issues, attach screenshots/curl output or contract addresses for UI/API/chain changes, and list verification commands (e.g., `go test ./...`, `npm test`, `npx hardhat test`). Flag new env vars or migrations explicitly.

## Security & Configuration Tips
Use the `.env.example` templates and keep credentials (DB URLs, `ETHEREUM_RPC`, Pinata keys) out of git because `backend/internal/ipfs` and `internal/blockchain` load them at startup. Rotate the sample private keys in `blockchain/hardhat.config.js` before deploying beyond localhost, avoid committing generated `uploads/` data, and keep `/health`, Redis caching, and `/monitoring/metrics` enabled to spot abuse. Configure `CORS_ORIGINS` (comma list) plus optional `REQUEST_TIMEOUT_SECONDS` so `SecureCORSMiddleware` and `RequestTimeoutMiddleware` (see `backend/pkg/utils/config.go`, `backend/internal/api/security_middleware.go`) enforce an explicit browser allow list and cancel runaway handlers.
