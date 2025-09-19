# 🚀 AI智能记事本快速部署指南

## 最简单的部署方式 (5分钟完成)

### 🎯 推荐方案：Vercel + Railway

#### 第一步：部署后端到Railway

1. **访问 [Railway](https://railway.app)**
2. **点击 "Start a New Project"**
3. **选择 "Deploy from GitHub repo"**
4. **连接您的GitHub账户并选择此仓库**
5. **选择 `backend` 文件夹**
6. **设置环境变量：**
   ```
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key (可选)
   ANTHROPIC_API_KEY=your_anthropic_api_key (可选)
   FLASK_ENV=production
   ```
7. **等待部署完成，获取后端URL**

#### 第二步：部署前端到Vercel

1. **访问 [Vercel](https://vercel.com)**
2. **点击 "New Project"**
3. **导入您的GitHub仓库**
4. **配置项目：**
   - Root Directory: `frontend/ai-notebook`
   - Framework Preset: Vue.js
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **设置环境变量：**
   ```
   VITE_API_BASE_URL=https://your-railway-backend-url.railway.app
   ```
6. **点击 Deploy**

#### 第三步：获取公开链接

部署完成后，Vercel会提供一个类似这样的公开链接：
```
https://ai-notebook-xxx.vercel.app
```

🎉 **恭喜！您的AI智能记事本现在可以通过这个链接被任何人访问了！**

---

## 🛠️ 使用部署脚本

如果您喜欢命令行操作，可以使用我们提供的一键部署脚本：

```bash
# 进入项目目录
cd /path/to/ai-notebook

# 运行一键部署脚本
./quick-deploy.sh
```

脚本会引导您完成整个部署过程。

---

## 🔧 其他部署选项

### 前端部署平台
- **Vercel** (推荐) - 最佳Vue.js支持
- **Netlify** - 简单拖拽部署
- **GitHub Pages** - 完全免费

### 后端部署平台
- **Railway** (推荐) - 现代化体验
- **Render** - 免费套餐友好
- **Heroku** - 经典选择

---

## 📋 部署检查清单

- [ ] 后端服务部署成功
- [ ] 前端应用构建成功
- [ ] API密钥配置正确
- [ ] 前端能正常访问后端API
- [ ] 所有功能测试通过

---

## 🆘 常见问题

**Q: 前端无法连接后端？**
A: 检查CORS配置和API地址是否正确

**Q: AI功能不工作？**
A: 确认API密钥设置正确且有效

**Q: 部署后页面空白？**
A: 检查构建日志，可能是路由配置问题

---

## 📞 获取帮助

如果遇到问题，请检查：
1. 浏览器开发者工具的控制台
2. 部署平台的构建日志
3. 后端服务的运行日志

**部署成功后，您就拥有了一个完全属于自己的AI智能记事本，可以分享给任何人使用！** 🎉