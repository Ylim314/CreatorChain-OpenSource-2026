@echo off
set "DATABASE_URL=root:720720@tcp(localhost:3306)/creatorchain?charset=utf8mb4&parseTime=True&loc=Local"
set CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
set GIN_MODE=debug
set PORT=8080

echo Starting CreatorChain Backend...
echo Database URL: %DATABASE_URL%
echo CORS Origins: %CORS_ORIGINS%

go run cmd/api/main.go
