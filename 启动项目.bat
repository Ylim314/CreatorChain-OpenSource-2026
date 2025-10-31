@echo off
title CreatorChain 项目启动器
color 0A

echo.
echo ==========================================
echo        CreatorChain 区块链项目
echo              启动脚本
echo ==========================================
echo.

echo [1/4] 检查环境依赖...
echo.

rem 检查MySQL
mysqladmin ping -u root -p720720 >nul 2>&1
if %errorlevel% == 0 (
    echo     ✅ MySQL数据库服务正常
) else (
    echo     ❌ MySQL数据库未启动，请先启动MySQL服务
    echo        - 可以通过服务管理器启动MySQL80服务
    echo        - 或运行 net start mysql80
    pause
    exit /b 1
)

rem 检查Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo     ✅ Node.js环境正常
) else (
    echo     ❌ 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

rem 检查Go
go version >nul 2>&1
if %errorlevel% == 0 (
    echo     ✅ Go环境正常
) else (
    echo     ❌ 未找到Go，请先安装Go语言环境
    pause
    exit /b 1
)

echo.
echo [2/4] 准备数据库...
mysql -u root -p720720 -e "CREATE DATABASE IF NOT EXISTS creatorchain_final CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
echo     ✅ 数据库准备完成

echo.
echo [3/4] 启动后端服务...
cd backend
echo DATABASE_URL=root:720720@tcp(localhost:3306)/creatorchain_final?charset=utf8mb4^&parseTime=True^&loc=Local > .env.tmp
echo PORT=8080 >> .env.tmp
echo GIN_MODE=release >> .env.tmp
echo CORS_ORIGINS=http://localhost:3000 >> .env.tmp
move .env.tmp .env >nul
start "CreatorChain 后端服务" /min cmd /c "simple_backend.exe"
echo     ✅ 后端服务启动中... (端口 8080)
cd ..

echo     等待后端服务完全启动...
timeout /t 8 /nobreak >nul

echo.
echo [4/4] 启动前端应用...
cd client
start "CreatorChain 前端应用" cmd /c "npm start"
cd ..

echo     ✅ 前端应用启动中... (端口 3000)

echo.
echo ==========================================
echo            🎉 启动完成！
echo ==========================================
echo.
echo 📱 前端应用: http://localhost:3000
echo 🔧 后端API: http://localhost:8080
echo 💚 健康检查: http://localhost:8080/health
echo.
echo 🦊 MetaMask钱包连接:
echo    1. 确保已安装MetaMask浏览器插件
echo    2. 在前端页面点击右上角"开始体验"
echo    3. 授权MetaMask连接请求
echo.
echo 正在打开浏览器...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo 按任意键关闭启动器...
pause >nul
