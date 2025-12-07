# PowerShell script to test CORS headers
Write-Host "Testing CORS preflight request..." -ForegroundColor Green

$headers = @{
    "Origin" = "http://localhost:3000"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "message-encoding,user-address,signature,message,timestamp"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/users/login" -Method OPTIONS -Headers $headers
    
    Write-Host "`nResponse Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse Headers:" -ForegroundColor Yellow
    $response.Headers | Format-Table
    
    Write-Host "`nAccess-Control-Allow-Headers:" -ForegroundColor Cyan
    if ($response.Headers["Access-Control-Allow-Headers"]) {
        Write-Host $response.Headers["Access-Control-Allow-Headers"] -ForegroundColor White
        if ($response.Headers["Access-Control-Allow-Headers"] -match "message-encoding") {
            Write-Host "`n✅ message-encoding is in the allowed headers!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ message-encoding is NOT in the allowed headers!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Access-Control-Allow-Headers header is missing!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

