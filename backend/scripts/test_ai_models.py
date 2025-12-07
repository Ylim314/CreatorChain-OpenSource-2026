#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CreatorChain AI模型配置测试脚本
测试通义千问和豆包的最新模型配置
"""

import os
import requests
import json
from datetime import datetime

# 配置信息
BACKEND_URL = "http://localhost:8080"
TEST_RESULTS = []

# 测试用例
TEST_CASES = [
    {
        "name": "通义千问3-Max 文本生成",
        "model": "qwen3-max",
        "task": "text",
        "prompt": "用一句话介绍区块链技术",
        "expected_provider": "阿里云"
    },
    {
        "name": "通义千问-Plus 文本生成",
        "model": "qwen-plus",
        "task": "text",
        "prompt": "什么是NFT?",
        "expected_provider": "阿里云"
    },
    {
        "name": "通义千问-Flash 文本生成",
        "model": "qwen-flash",
        "task": "text",
        "prompt": "AI能做什么?",
        "expected_provider": "阿里云"
    },
    {
        "name": "通义千问图像生成-Plus",
        "model": "qwen-image-plus",
        "task": "image",
        "prompt": "一只可爱的卡通猫咪,赛博朋克风格,霓虹灯背景",
        "expected_provider": "阿里云"
    },
    {
        "name": "通义万相2.5图像生成",
        "model": "wan2.5-t2i-preview",
        "task": "image",
        "prompt": "未来科技城市,高清,4K,赛博朋克",
        "expected_provider": "阿里云"
    },
    {
        "name": "豆包-Pro文本生成",
        "model": "doubao-pro-32k",
        "task": "text",
        "prompt": "介绍一下AI艺术创作",
        "expected_provider": "字节跳动"
    },
    {
        "name": "豆包-Lite文本生成",
        "model": "doubao-lite-32k",
        "task": "text",
        "prompt": "什么是数字藏品?",
        "expected_provider": "字节跳动"
    },
]


def print_header():
    """打印测试标题"""
    print("=" * 70)
    print("CreatorChain AI模型配置测试")
    print("=" * 70)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"后端地址: {BACKEND_URL}")
    print("=" * 70)
    print()


def test_model(test_case):
    """测试单个模型"""
    print(f"\n📝 测试: {test_case['name']}")
    print(f"   模型: {test_case['model']}")
    print(f"   任务: {test_case['task']}")
    print(f"   提示词: {test_case['prompt']}")
    
    try:
        # 发送请求
        response = requests.post(
            f"{BACKEND_URL}/api/ai/generate",
            json={
                "prompt": test_case["prompt"],
                "model": test_case["model"],
                "task": test_case["task"],
                "style": "modern",
                "complexity": 5,
                "creativity": 7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            result = {
                "name": test_case["name"],
                "model": test_case["model"],
                "status": "✅ 成功",
                "response_time": data.get("processing_time", "N/A"),
                "content_preview": data.get("content", "")[:100] if data.get("content") else "N/A",
                "image_url": data.get("image_url", "N/A") if test_case["task"] == "image" else "N/A",
                "model_info": data.get("model", "N/A")
            }
            
            print(f"   状态: ✅ 成功")
            print(f"   响应时间: {result['response_time']}")
            print(f"   模型信息: {result['model_info']}")
            
            if test_case["task"] == "text" and data.get("content"):
                print(f"   生成内容: {data['content'][:100]}...")
            elif test_case["task"] == "image" and data.get("image_url"):
                print(f"   图片URL: {data['image_url']}")
            
        else:
            result = {
                "name": test_case["name"],
                "model": test_case["model"],
                "status": f"❌ 失败 (HTTP {response.status_code})",
                "error": response.text
            }
            print(f"   状态: ❌ 失败")
            print(f"   错误: {response.text}")
        
        TEST_RESULTS.append(result)
        
    except requests.exceptions.ConnectionError:
        result = {
            "name": test_case["name"],
            "model": test_case["model"],
            "status": "❌ 连接失败",
            "error": "无法连接到后端服务"
        }
        print(f"   状态: ❌ 连接失败 - 请确保后端服务正在运行")
        TEST_RESULTS.append(result)
        
    except Exception as e:
        result = {
            "name": test_case["name"],
            "model": test_case["model"],
            "status": "❌ 异常",
            "error": str(e)
        }
        print(f"   状态: ❌ 异常: {str(e)}")
        TEST_RESULTS.append(result)


def print_summary():
    """打印测试总结"""
    print("\n" + "=" * 70)
    print("测试总结")
    print("=" * 70)
    
    success_count = sum(1 for r in TEST_RESULTS if "✅" in r["status"])
    fail_count = len(TEST_RESULTS) - success_count
    
    print(f"\n总测试数: {len(TEST_RESULTS)}")
    print(f"成功: {success_count} ✅")
    print(f"失败: {fail_count} ❌")
    print(f"成功率: {success_count/len(TEST_RESULTS)*100:.1f}%")
    
    print("\n详细结果:")
    print("-" * 70)
    for result in TEST_RESULTS:
        print(f"{result['name']}: {result['status']}")
        if "error" in result:
            print(f"  错误: {result['error']}")
    
    print("\n" + "=" * 70)


def save_results():
    """保存测试结果到文件"""
    filename = f"ai_model_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({
            "test_time": datetime.now().isoformat(),
            "backend_url": BACKEND_URL,
            "total_tests": len(TEST_RESULTS),
            "success_count": sum(1 for r in TEST_RESULTS if "✅" in r["status"]),
            "results": TEST_RESULTS
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n测试结果已保存到: {filepath}")


def main():
    """主函数"""
    print_header()
    
    print("⚠️  注意事项:")
    print("1. 请确保后端服务已启动 (默认端口8080)")
    print("2. 请确保已配置正确的API密钥 (通义千问/豆包)")
    print("3. 图像生成测试可能需要较长时间")
    print()
    input("按Enter键开始测试...")
    
    # 运行所有测试
    for test_case in TEST_CASES:
        test_model(test_case)
    
    # 打印总结
    print_summary()
    
    # 保存结果
    save_results()


if __name__ == "__main__":
    main()
