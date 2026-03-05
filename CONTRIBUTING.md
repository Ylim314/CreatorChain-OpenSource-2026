# Contributing to CreatorChain

Thank you for your interest in contributing.

## Development setup

1. Fork and clone the repository.
2. Create a feature branch:
   - `git checkout -b feat/your-change`
3. Install dependencies by workspace:
   - `cd backend && go mod tidy`
   - `cd client && npm install`
   - `cd contracts && npm install`

## Validation checklist

Run the following before opening a PR:

- `cd backend && go test ./...`
- `cd client && npm run build`
- `cd contracts && npx hardhat test`

## Commit style

Use Conventional Commits:

- `feat: add ...`
- `fix: resolve ...`
- `docs: update ...`
- `test: add ...`

## Pull request requirements

- Describe what changed and why.
- Link related issue(s).
- Include screenshots for UI changes.
- Mention new environment variables, migrations, or breaking changes.

## Security

Do not commit secrets (`.env`, private keys, API tokens).
Use `.env.example` templates and keep real credentials local.
