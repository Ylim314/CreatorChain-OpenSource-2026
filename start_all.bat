@echo off
setlocal

REM Change to project root directory (this script's location)
cd /d "%~dp0"

echo [1/4] Checking MySQL...
mysqladmin ping -u root -p720720 >nul 2>&1
if errorlevel 1 (
  echo MySQL is not running or password is wrong.
  echo Please start MySQL service "MySQL80" and make sure root password is 720720.
  pause
  exit /b 1
)

echo [2/4] Preparing database "creatorchain_final"...
mysql -u root -p720720 -e "CREATE DATABASE IF NOT EXISTS creatorchain_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul

echo [3/4] Starting backend...
cd backend
echo DATABASE_URL=root:720720@tcp(localhost:3306)/creatorchain_final?charset=utf8mb4^&parseTime=True^&loc=Local> .env.tmp
echo PORT=8080>> .env.tmp
echo GIN_MODE=release>> .env.tmp
echo JWT_SECRET=creatorchain-demo-jwt-secret-123456>> .env.tmp
echo CORS_ORIGINS=http://localhost:3000>> .env.tmp
move /y .env.tmp .env >nul

REM Always use go run to ensure latest code is used
REM Delete old server.exe if it exists to force recompilation
if exist server.exe (
  echo Removing old server.exe to ensure latest code is used...
  del /f /q server.exe >nul 2>&1
)

REM Always run with go run to use latest code
REM Use /k to keep window open and show errors, and set working directory correctly
start "CreatorChain Backend" cmd /k "cd /d %~dp0backend && go run cmd/api/main.go"
cd ..

echo Waiting for backend to start...
REM Use ping instead of timeout to avoid conflicts with GNU timeout
ping 127.0.0.1 -n 9 >nul

echo [4/4] Starting frontend...
REM Only treat frontend as running if there is a LISTENING socket on port 3000
netstat -ano | findstr LISTENING | findstr :3000 >nul 2>&1
if %errorlevel%==0 (
  echo Frontend seems to be already running on port 3000, skip starting another one.
) else (
  cd client
  start "CreatorChain Frontend" cmd /c "npm start"
  cd ..
)

echo.
echo CreatorChain started successfully.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
pause
