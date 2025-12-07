# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CreatorChain is a blockchain-based digital creation copyright protection platform that combines:
- **Dual-layer copyright protection**: Process recording + final work confirmation
- **Multi-AI model integration**: OpenAI, Anthropic, Google, and domestic models (智谱GLM-4.6, GLM-4-Air)
- **Zero-knowledge proof**: Cryptographic commitment scheme for privacy-preserving verification
- **IPFS storage**: Decentralized content storage via Pinata API
- **Points-based incentive system**: Compliant reward mechanism (not cryptocurrency)

## Architecture

### Tech Stack
- **Backend**: Go 1.21+ (Gin, GORM, Redis)
- **Frontend**: React 18 (Material-UI, Ethers.js, Tailwind CSS)
- **Smart Contracts**: Solidity 0.8.20 (OpenZeppelin, Hardhat)
- **Storage**: PostgreSQL/SQLite + IPFS + Redis (optional)

### Key Modules
- `backend/cmd/api/main.go` - Server entry point, initializes DB, Redis, AI/IPFS/ZKP engines
- `backend/internal/api/` - HTTP handlers (user, creation, marketplace, AI, upload, points)
- `backend/internal/service/` - Business logic layer with transaction support
- `backend/internal/repository/` - Database access layer with models
- `backend/internal/ai/` - Multi-AI model engine (智谱GLM, OpenAI fallback, Mock mode)
- `backend/internal/analysis/` - Content analyzer for contribution assessment
- `backend/internal/zkp/` - Cryptographic commitment scheme (Schnorr signatures, not full ZKP)
- `backend/internal/security/` - Signature verification, timestamp validation, replay attack protection
- `backend/internal/ipfs/` - IPFS client using Pinata API
- `backend/internal/monitoring/` - Metrics, logs, health checks
- `client/src/pages/` - React pages (Home, Create, MyCreations, Marketplace, etc.)
- `client/src/context/Web3ContextFixed.js` - Web3 wallet integration with signature-based auth
- `client/src/services/apiService.js` - API client with auth headers (User-Address, Signature, Message, Timestamp)
- `contracts/contracts/` - Smart contracts (SimpleCreationRegistry, CreatorNFT, CreatorDAO, LicenseManager, CreatorToken)

## Development Commands

### Backend (Go)
```bash
cd backend
go mod tidy                               # Install dependencies
go run cmd/api/main.go                    # Run dev server (port 8080)
go build -o bin/creatorchain cmd/api/main.go  # Build binary
go test ./...                             # Run all tests
go test ./internal/service -v             # Run specific package tests
go test -cover ./...                      # Run tests with coverage
```

### Frontend (React)
```bash
cd client
npm install                               # Install dependencies
npm start                                 # Run dev server (port 3000)
npm run build                             # Production build → client/build/
npm test                                  # Run Jest tests
npm test -- --watch=false                 # Run tests without watch mode
```

### Smart Contracts (Hardhat)
```bash
cd contracts
npm install                               # Install dependencies
npx hardhat compile                       # Compile contracts → artifacts/
npx hardhat test                          # Run tests
npx hardhat coverage                      # Coverage report
npx hardhat run scripts/deploy-enhanced.js --network localhost  # Deploy locally
npx hardhat run scripts/deploy-enhanced.js --network sepolia    # Deploy to testnet
```

### Quick Start
```bash
启动项目.bat                               # Windows one-click launcher (checks MySQL, starts backend + frontend)
```

## Configuration

### Backend Environment Variables (backend/.env)
Required:
```env
DATABASE_URL=sqlite:///creatorchain.db    # Or MySQL/PostgreSQL
PORT=8080
CORS_ORIGINS=http://localhost:3000       # Comma-separated whitelist
JWT_SECRET=your-secret-key                # Must be set for auth
```

Security (recommended):
```env
REQUEST_TIMEOUT_SECONDS=30                # Global request timeout (enables RequestTimeoutMiddleware)
REDIS_URL=redis://localhost:6379         # Optional caching layer
```

AI & Storage:
```env
AI_API_KEY=your_api_key                   # 智谱AI or OpenAI key
AI_BASE_URL=https://api.openai.com/v1    # Or https://open.bigmodel.cn/api/paas/v4/ for 智谱
IPFS_GATEWAY=https://ipfs.io/ipfs/
PINATA_API_KEY=your_pinata_key
PINATA_SECRET=your_pinata_secret
```

Blockchain (optional):
```env
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key
PRIVATE_KEY=your_private_key              # Rotate before production deployment!
```

### Frontend Environment Variables
Create `client/.env` (optional):
```env
REACT_APP_API_URL=http://localhost:8080
```

## Code Conventions

### Go (Backend)
- Use `gofmt` and `goimports` for formatting
- Package structure: `internal/` for private packages, `pkg/` for shared utilities
- Repository pattern: `repository/` (DB access) → `service/` (business logic) → `api/` (HTTP handlers)
- Error handling: Use `error_handler.go` for consistent error responses
- Middleware stack order in `main.go` (order matters):
  ErrorHandler → Logger/Recovery → SecurityHeaders → SecureCORSMiddleware → RequestTimeoutMiddleware → RequestSizeLimit (10MB) → InputSanitization → AuditLog → Metrics → RateLimit → ValidateJSON

### React (Frontend)
- 2-space indentation
- PascalCase for components (`Navbar.js`, `PointsDisplay.js`)
- camelCase for hooks/utilities
- Material-UI + Tailwind for styling
- Web3 signature flow: Sign message with MetaMask → Include headers in API requests

### Solidity (Smart Contracts)
- SPDX license header required
- Pragma `0.8.20`
- PascalCase for contract names
- OpenZeppelin libraries for security (Ownable, AccessControl, ReentrancyGuard)
- Use `.env` for private keys (never commit to git)

## Testing Strategy

### Backend Tests
- Colocate tests with implementation: `user_service_test.go` next to `user_service.go`
- Table-driven tests for multiple scenarios
- Security tests: `backend/internal/security/*_test.go` cover timestamp validation, replay guards

```bash
cd backend
go test ./...                             # All tests
go test ./internal/security -v            # Verbose security tests
go test -race ./...                       # Race condition detection
```

### Frontend Tests
- Colocate with components: `components/__tests__/CreationCard.test.js`

### Smart Contract Tests
- Place in `contracts/test/` directory
- Run `npx hardhat coverage` before changing access control logic

## Security & Authentication

### Signature-Based Auth
The platform uses Ethereum signatures instead of traditional passwords:

1. **Login Flow** (see `backend/internal/security/signature.go`):
   - Frontend: User signs message: `CreatorChain Authentication [userAddress] [timestamp]`
   - Frontend sends headers: `User-Address`, `Signature`, `Message`, `Timestamp`
   - Backend: Validates signature, checks timestamp (±5 min), prevents replay attacks
   - Backend: Issues JWT token for subsequent requests

2. **Protected Routes**:
   - Use `AuthMiddleware()` to validate JWT tokens
   - JWT contains user address claim

3. **Replay Attack Prevention**:
   - `TimestampGuard` in `backend/internal/security/timestamp.go` tracks used timestamps
   - 5-minute validity window (`proofExpiryWindow`)
   - Prevents reuse of old signed messages

### CORS & Timeouts
- **CORS**: `SecureCORSMiddleware` only allows origins in `CORS_ORIGINS` env var (whitelist-based)
- **Timeouts**: Set `REQUEST_TIMEOUT_SECONDS` to enable global request timeout (504 on timeout)

### Secrets Management
- NEVER commit `.env` files to git
- Use `.env.example` as template
- Rotate Hardhat private keys before mainnet deployment
- Avoid committing `uploads/` directory (contains user-uploaded content)

## AI Integration

### Supported Models
1. **智谱AI (Primary)**: GLM-4.6 (150k tokens, 2 points), GLM-4-Air (128k tokens, 1 point)
2. **OpenAI (Fallback)**: GPT-4, GPT-3.5-turbo
3. **Mock Mode**: Test mode without API calls (set `AI_API_KEY=""`)

### Model Selection
- Frontend: User selects model via dropdown (see `client/src/pages/Create.js`)
- Backend: `ai_engine.go` routes to appropriate provider based on model name
- Cost: Each model has point cost (see `initializeModels()` in `ai_engine.go`)

### Mock Mode
When `AI_API_KEY` is empty, AI engine returns simulated responses:
```go
// Mock response includes fictional content + metadata
response := &GenerationResponse{
    Content: "This is a mock AI-generated [task] for testing...",
    // ... metadata
}
```

## Zero-Knowledge Proof System

**IMPORTANT**: This is a cryptographic commitment scheme, NOT full ZKP (zk-SNARK/zk-STARK).

### What It Is
- **Commitment Phase**: Hash(original_data + random_salt) → commitment_hash
- **On-chain Storage**: Only store commitment_hash (not original data)
- **Verification**: Provide original data to recalculate hash and verify

### Implementation Details
- `backend/internal/zkp/zkp_engine.go` uses Schnorr signatures
- Protects AI prompt/parameters privacy while proving creation authenticity
- Timestamp-based validation (no strict expiry unless configured)

### Why Not Full ZKP?
- Performance: zk-SNARK proof generation takes 10-30s, high gas costs
- Pragmatism: Commitment scheme meets privacy needs for MVP
- Future upgrade path: Phase 1 (current) → Phase 2 (Circom + SnarkJS) → Phase 3 (general ZKP circuits)

See detailed comments in `zkp_engine.go` for cryptographic references.

## Database & Migrations

### Auto-Migration
- GORM auto-migrate runs on startup (see `main.go:87-97`)
- Models: User, Creation, Listing, Transaction, PointsTransaction, License, Proposal, Vote, BlockchainEvent

### Database Optimization
- `DatabaseOptimizer` adds indexes on startup (`main.go:105-108`)
- Handles users, creations, transactions, points tables

### Supported Databases
- SQLite (default for dev): `DATABASE_URL=sqlite:///creatorchain.db`
- MySQL: `DATABASE_URL=root:password@tcp(localhost:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local`
- PostgreSQL: `DATABASE_URL=postgresql://user:password@localhost:5432/dbname?sslmode=disable`

## Monitoring & Observability

### Endpoints
- `GET /health` - Health check (checks DB, Redis connectivity)
- `GET /monitoring/metrics` - Performance metrics (request count, latency)
- `GET /monitoring/logs` - Recent application logs (in-memory collector, 1000 entries)

### Metrics Collection
- `MetricsCollector` tracks requests, errors, latency per endpoint
- `LogCollector` captures structured logs from middleware
- `HealthChecker` runs configurable health checks (see `main.go:177-192`)

## Commit & PR Guidelines

### Commit Message Format
Recent commits use Conventional Commits (English or Chinese):
```
feat: 集成智谱GLM-4.6及Mock模式支持
fix: 合并AI引擎格式化修改
docs: 完善零知识证明技术说明和注释
test: 添加智谱AI API集成测试脚本
```

Format: `type(optional-scope): summary`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

### Pull Request Checklist
1. Describe touched modules (backend/frontend/contracts)
2. Link related issues
3. Attach screenshots (UI changes), curl output (API changes), or contract addresses (blockchain changes)
4. List verification commands:
   - Backend: `go test ./...`
   - Frontend: `npm test -- --watch=false`
   - Contracts: `npx hardhat test`
5. Flag new environment variables or migrations
6. Never commit secrets (`.env`, `uploads/`, generated binaries)

## Common Pitfalls

### Backend
- **JWT_SECRET**: Must be set in `.env` or auth will fail
- **CORS**: Add frontend URL to `CORS_ORIGINS` or requests will be blocked
- **Database**: Check MySQL service is running before starting (`net start mysql80` on Windows)
- **Redis**: Optional but recommended for production (user session caching)

### Frontend
- **MetaMask**: Users must sign login message (not just connect wallet)
- **API Headers**: All protected requests need `User-Address`, `Signature`, `Message`, `Timestamp` headers
- **Wallet Network**: Ensure MetaMask is on correct network (localhost:8545 for dev)

### Smart Contracts
- **Private Keys**: Rotate `hardhat.config.cjs` private keys before mainnet
- **Gas Estimation**: Test on testnet (Sepolia/Mumbai) before mainnet
- **OpenZeppelin Version**: Using `@openzeppelin/contracts@5.4.0` (check compatibility)

## Documentation

### Existing Docs
- `README.md` - Full project overview, features, API endpoints
- `AGENTS.md` - Condensed guidelines for AI assistants (structure, commands, security)
- `SECURITY_FIXES.md` - Recent security improvements (signature auth, CORS, timeout, replay protection)
- `docs/` - Architecture design docs (in Chinese)

### Architecture Diagrams
See `README.md` for Mermaid diagram showing:
- Frontend Layer (React + Material-UI + Web3)
- Backend Layer (Gin + GORM + Redis)
- AI Engine Layer (Multi-model + Contribution Analysis + ZKP)
- Blockchain Layer (Smart Contracts + DAO Governance)
- Storage Layer (PostgreSQL/SQLite + Redis + IPFS)

## Future Enhancements (From SECURITY_FIXES.md)

1. **Frontend UX**: Show "签名登录消息" prompt when connecting wallet
2. **Test Coverage**: Add integration tests for AuthMiddleware, AI upload routes, Marketplace
3. **Deployment Checklist**: Create `docs/deploy_security_checklist.md` with required env vars
4. **Secret Rotation**: Add CI/CD secret scanning, pre-commit hooks to prevent credential leaks
