#!/bin/bash

# AI智能记事本后端部署脚本
echo "🚀 开始部署AI智能记事本后端..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 检查pip
if ! command -v pip &> /dev/null; then
    echo "❌ pip未安装，请先安装pip"
    exit 1
fi

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装成功"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，创建示例配置..."
    cp .env.example .env
    echo "请编辑.env文件并设置您的API密钥"
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
python create_indexes.py

echo "📋 后端部署选项："
echo "1. Railway (推荐)"
echo "2. Heroku"
echo "3. Render"
echo "4. 本地测试"

read -p "请选择部署平台 (1-4): " choice

case $choice in
    1)
        echo "🚂 准备Railway部署..."
        echo "1. 访问 https://railway.app"
        echo "2. 连接您的GitHub仓库"
        echo "3. 选择backend文件夹"
        echo "4. 设置环境变量："
        echo "   - OPENAI_API_KEY=your_openai_key"
        echo "   - GEMINI_API_KEY=your_gemini_key"
        echo "   - ANTHROPIC_API_KEY=your_anthropic_key"
        echo "   - FLASK_ENV=production"
        ;;
    2)
        echo "🟣 准备Heroku部署..."
        if ! command -v heroku &> /dev/null; then
            echo "请先安装Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        else
            echo "运行以下命令："
            echo "heroku create ai-notebook-backend"
            echo "heroku config:set OPENAI_API_KEY=your_key"
            echo "git push heroku main"
        fi
        ;;
    3)
        echo "🎨 准备Render部署..."
        echo "1. 访问 https://render.com"
        echo "2. 连接您的GitHub仓库"
        echo "3. 选择Web Service"
        echo "4. 设置构建命令: pip install -r requirements.txt"
        echo "5. 设置启动命令: python app.py"
        echo "6. 添加环境变量"
        ;;
    4)
        echo "🖥️  启动本地测试服务器..."
        export FLASK_ENV=development
        python app.py
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo "🎉 后端部署准备完成！"
echo "📝 重要提醒："
echo "- 确保设置了所有必要的环境变量"
echo "- 检查API密钥是否有效"
echo "- 记录后端服务的URL地址"
echo "- 更新前端配置中的API地址"