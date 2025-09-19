#!/bin/bash

# AI智能记事本一键部署脚本
echo "🚀 AI智能记事本一键部署向导"
echo "================================"

# 检查必要工具
echo "🔍 检查部署环境..."

if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 选择部署方案
echo ""
echo "📋 请选择部署方案："
echo "1. 完整部署 (前端 + 后端)"
echo "2. 仅部署前端 (使用现有后端)"
echo "3. 仅部署后端"
echo "4. 本地测试部署"

read -p "请选择 (1-4): " deploy_option

case $deploy_option in
    1)
        echo "🌐 完整部署模式"
        DEPLOY_FRONTEND=true
        DEPLOY_BACKEND=true
        ;;
    2)
        echo "🎨 仅前端部署模式"
        DEPLOY_FRONTEND=true
        DEPLOY_BACKEND=false
        ;;
    3)
        echo "⚙️  仅后端部署模式"
        DEPLOY_FRONTEND=false
        DEPLOY_BACKEND=true
        ;;
    4)
        echo "🖥️  本地测试模式"
        DEPLOY_FRONTEND=false
        DEPLOY_BACKEND=false
        LOCAL_TEST=true
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 本地测试模式
if [ "$LOCAL_TEST" = true ]; then
    echo "🖥️  启动本地测试环境..."
    
    # 启动后端
    echo "启动后端服务..."
    cd backend
    python app.py &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    # 启动前端
    echo "启动前端服务..."
    cd frontend/ai-notebook
    npm run dev &
    FRONTEND_PID=$!
    cd ../..
    
    echo "🎉 本地测试环境已启动！"
    echo "前端地址: http://localhost:5173"
    echo "后端地址: http://localhost:5001"
    echo "按 Ctrl+C 停止服务"
    
    # 等待用户中断
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
    exit 0
fi

# 后端部署
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "🔧 开始后端部署..."
    
    echo "选择后端部署平台："
    echo "1. Railway (推荐)"
    echo "2. Render"
    echo "3. Heroku"
    
    read -p "请选择后端平台 (1-3): " backend_platform
    
    case $backend_platform in
        1)
            echo "🚂 Railway部署说明："
            echo "1. 访问 https://railway.app"
            echo "2. 连接GitHub仓库"
            echo "3. 选择backend文件夹"
            echo "4. 设置环境变量"
            BACKEND_PLATFORM="Railway"
            ;;
        2)
            echo "🎨 Render部署说明："
            echo "1. 访问 https://render.com"
            echo "2. 创建Web Service"
            echo "3. 连接仓库并选择backend文件夹"
            BACKEND_PLATFORM="Render"
            ;;
        3)
            echo "🟣 Heroku部署说明："
            echo "1. 安装Heroku CLI"
            echo "2. 运行: heroku create your-app-name"
            echo "3. 推送代码: git push heroku main"
            BACKEND_PLATFORM="Heroku"
            ;;
        *)
            echo "❌ 无效选择，使用Railway"
            BACKEND_PLATFORM="Railway"
            ;;
    esac
    
    read -p "请输入后端部署后的URL (例: https://your-backend.railway.app): " BACKEND_URL
fi

# 前端部署
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "🎨 开始前端部署..."
    
    # 构建前端
    echo "📦 构建前端应用..."
    cd frontend/ai-notebook
    
    # 如果有后端URL，更新配置
    if [ ! -z "$BACKEND_URL" ]; then
        echo "🔧 配置后端API地址: $BACKEND_URL"
        # 这里可以添加更新API配置的逻辑
    fi
    
    npm install
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ 前端构建失败"
        exit 1
    fi
    
    echo "✅ 前端构建成功"
    
    echo "选择前端部署平台："
    echo "1. Vercel (推荐)"
    echo "2. Netlify"
    echo "3. GitHub Pages"
    
    read -p "请选择前端平台 (1-3): " frontend_platform
    
    case $frontend_platform in
        1)
            echo "▲ Vercel部署说明："
            echo "1. 访问 https://vercel.com"
            echo "2. 连接GitHub仓库"
            echo "3. 选择frontend/ai-notebook文件夹"
            echo "4. Vercel会自动检测并部署"
            FRONTEND_PLATFORM="Vercel"
            ;;
        2)
            echo "🌐 Netlify部署说明："
            echo "1. 访问 https://netlify.com"
            echo "2. 拖拽dist文件夹到部署区域"
            echo "3. 或连接GitHub仓库自动部署"
            FRONTEND_PLATFORM="Netlify"
            ;;
        3)
            echo "📄 GitHub Pages部署说明："
            echo "1. 推送代码到GitHub"
            echo "2. 在仓库设置中启用GitHub Pages"
            echo "3. 选择dist文件夹作为源"
            FRONTEND_PLATFORM="GitHub Pages"
            ;;
        *)
            echo "❌ 无效选择，使用Vercel"
            FRONTEND_PLATFORM="Vercel"
            ;;
    esac
    
    cd ../..
fi

# 生成部署报告
echo ""
echo "📊 部署配置总结"
echo "================================"
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "后端平台: $BACKEND_PLATFORM"
    echo "后端URL: $BACKEND_URL"
fi
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "前端平台: $FRONTEND_PLATFORM"
fi
echo ""
echo "📝 下一步操作："
echo "1. 按照上述说明完成实际部署"
echo "2. 设置必要的环境变量和API密钥"
echo "3. 测试应用功能是否正常"
echo "4. 记录最终的访问URL"
echo ""
echo "🎉 部署配置完成！"
echo "📖 详细部署文档请查看: DEPLOYMENT.md"