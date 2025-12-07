@echo off
chcp 65001 >nul
echo ========================================
echo   智谱AI API 集成测试
echo ========================================
echo.

cd /d %~dp0..

echo 📋 检查Go环境...
go version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未安装Go，请先安装Go 1.19+
    pause
    exit /b 1
)

echo ✅ Go环境正常
echo.

echo 💡 提示: 
echo   - 如果已配置ZHIPU_API_KEY，将测试真实API
echo   - 如果未配置，将演示Mock模式
echo.

echo 🚀 开始测试...
echo.

go run scripts\test_zhipu_api.go

echo.
echo ========================================
echo   测试完成
echo ========================================
echo.
echo 💡 下一步:
echo   1. 如果测试成功，可以在.env中配置API Key
echo   2. 启动后端服务: start_backend.bat
echo   3. 前端将自动调用智谱AI模型
echo.

pause
