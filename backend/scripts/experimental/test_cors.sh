#!/bin/bash
# 测试 CORS 配置

echo "Testing CORS preflight request..."
curl -X OPTIONS http://localhost:8080/api/v1/marketplace/buy \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: message-encoding,user-address,signature,message,timestamp" \
  -v 2>&1 | grep -i "access-control"

