# AI智能记事本部署指南

本指南将帮助您将AI智能记事本部署为公开可访问的Web应用。

## 🚀 快速部署

### 方案一：Vercel部署（推荐）

1. **准备工作**
   ```bash
   cd frontend/ai-notebook
   npm run build
   ```

2. **部署到Vercel**
   - 访问 [Vercel](https://vercel.com)
   - 连接您的GitHub账户
   - 导入项目仓库
   - Vercel会自动检测并部署

3. **配置环境变量**
   - 在Vercel项目设置中添加环境变量
   - 设置后端API地址

### 方案二：Netlify部署

1. **构建应用**
   ```bash
   cd frontend/ai-notebook
   npm run build
   ```

2. **部署到Netlify**
   - 访问 [Netlify](https://netlify.com)
   - 拖拽 `dist` 文件夹到部署区域
   - 或使用Netlify CLI：`npx netlify deploy --prod --dir=dist`

### 方案三：使用部署脚本

```bash
cd frontend/ai-notebook
./deploy.sh
```

## 🔧 后端部署

### Railway部署（推荐）

1. **准备后端代码**
   ```bash
   cd backend
   ```

2. **创建Railway项目**
   - 访问 [Railway](https://railway.app)
   - 连接GitHub仓库
   - 选择backend文件夹

3. **配置环境变量**
   - 设置AI模型API密钥
   - 配置数据库连接

### Heroku部署

1. **安装Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **部署到Heroku**
   ```bash
   cd backend
   heroku create ai-notebook-backend
   git push heroku main
   ```

## 🌐 完整部署流程

### 1. 后端部署
- 选择云平台（Railway/Heroku/Render）
- 部署Python后端服务
- 获取后端API地址

### 2. 前端配置
- 更新前端API配置
- 构建生产版本

### 3. 前端部署
- 选择静态网站托管平台
- 部署前端应用
- 获取公开访问链接

## 📋 部署检查清单

- [ ] 后端服务正常运行
- [ ] 前端构建成功
- [ ] API地址配置正确
- [ ] 环境变量设置完成
- [ ] CORS配置正确
- [ ] 数据库连接正常
- [ ] AI模型API密钥有效

## 🔗 推荐的免费部署平台

### 前端托管
- **Vercel** - 最佳Vue.js支持
- **Netlify** - 简单易用
- **GitHub Pages** - 免费且稳定

### 后端托管
- **Railway** - 现代化部署体验
- **Render** - 免费套餐友好
- **Heroku** - 经典选择

## 🛠️ 故障排除

### 常见问题

1. **CORS错误**
   - 检查后端CORS配置
   - 确保前端域名在允许列表中

2. **API连接失败**
   - 验证后端服务是否运行
   - 检查API地址配置

3. **路由404错误**
   - 确保SPA路由重定向配置正确
   - 检查服务器配置

## 📞 获取帮助

如果遇到部署问题，请检查：
1. 浏览器开发者工具的控制台错误
2. 后端服务日志
3. 网络连接状态

---

部署完成后，您将获得一个公开的Web链接，任何人都可以访问您的AI智能记事本应用！