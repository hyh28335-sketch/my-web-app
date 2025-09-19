# AI智能工作台 (my-web-app)

一个功能丰富的AI原生记事本应用，集成了笔记管理、AI聊天、番茄钟计时器、项目管理等多种功能。

## 🌟 主要功能

### 📝 智能笔记管理
- 创建、编辑、删除笔记
- 支持标签分类
- 全文搜索功能
- 笔记导出功能

### 🤖 AI聊天助手
- 集成多种AI模型（OpenAI、Anthropic、DeepSeek等）
- 智能对话和问答
- 上下文理解
- 知识库集成

### 🍅 番茄钟计时器
- 专注工作时间管理
- 自定义工作/休息时长
- 统计和历史记录
- 声音提醒

### 📊 项目管理
- 项目创建和管理
- 任务分配和跟踪
- 进度可视化
- 时间线视图

### 🔍 智能搜索
- 全局搜索功能
- 关键词高亮
- 快速定位内容

## 🚀 技术栈

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Hooks** - 状态管理

### 后端
- **Flask** - Python Web框架
- **SQLAlchemy** - ORM数据库操作
- **SQLite** - 轻量级数据库
- **CORS** - 跨域支持

### AI集成
- OpenAI GPT
- Anthropic Claude
- DeepSeek
- 通义千问
- OpenRouter API

## 📦 安装和运行

### 环境要求
- Node.js 18+
- Python 3.8+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/hyh28335-sketch/my-web-app.git
cd my-web-app
```

### 2. 安装前端依赖
```bash
npm install
```

### 3. 配置后端环境
```bash
cd backend
pip install -r requirements.txt
```

### 4. 环境变量配置
复制 `backend/.env.example` 到 `backend/.env` 并配置：
```bash
cp backend/.env.example backend/.env
```

编辑 `.env` 文件，添加你的API密钥：
```env
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
# ... 其他API密钥
```

### 5. 启动应用

#### 启动后端服务
```bash
cd backend
python app.py
```

#### 启动前端服务
```bash
npm run dev
```

访问 http://localhost:3000 开始使用！

## 🛠️ 项目管理工具

项目包含完整的运维脚本：

### 快速管理
```bash
# 查看项目状态
./project-manager.sh info

# 创建备份
./project-manager.sh backup

# 部署项目
./project-manager.sh deploy

# 监控系统
./project-manager.sh monitor

# 恢复项目
./project-manager.sh restore
```

### 独立脚本
- `backup-project.sh` - 项目备份
- `deploy.sh` - 自动化部署
- `restore.sh` - 项目恢复
- `monitor.sh` - 系统监控
- `create-version-tag.sh` - 版本标记

## 📁 项目结构

```
├── app/                    # Next.js应用目录
├── components/             # React组件
├── lib/                   # 工具库和服务
├── backend/               # Flask后端
├── logs/                  # 日志文件
├── docs/                  # 项目文档
├── *.sh                   # 运维脚本
└── README.md              # 项目说明
```

## 🔧 配置说明

### AI模型配置
支持多种AI服务提供商，在环境变量中配置相应的API密钥即可使用。

### 数据库配置
默认使用SQLite数据库，数据文件位于 `backend/notes.db`。

### 部署配置
支持多种部署方式：
- Vercel (前端)
- Railway/Heroku (后端)
- 本地部署
- Docker部署

## 📖 使用指南

详细使用说明请参考：
- [快速开始指南](QUICK_START.md)
- [项目文档](PROJECT_DOCUMENTATION.md)
- [备份保护指南](BACKUP_PROTECTION_GUIDE.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有开源项目和AI服务提供商的支持！
