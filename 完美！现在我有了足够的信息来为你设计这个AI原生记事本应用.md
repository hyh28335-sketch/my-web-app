## 🤖 Assistant


完美！现在我有了足够的信息来为你设计这个AI原生记事本应用。以下是完整的技术需求文档：

# AI原生记事本应用 - 技术需求文档

## 1. 项目概述 (Overview)
开发一个个人使用的AI原生记事本web应用，支持markdown编辑、AI润色改写、自动标签生成和语义搜索功能，采用经典三栏布局设计。

## 2. 核心功能点 (Core Features)
- ✅ Markdown笔记编辑与渲染
- ✅ AI文本润色改写（选中文本 + 整篇文章）
- ✅ 自动AI标签生成（保存时触发）
- ✅ 语义搜索功能
- ✅ 笔记的增删改查
- ✅ 持久化数据存储
- ✅ 三栏响应式布局

## 3. 技术规格 (Technical Specifications)

### 前端 (Frontend)

#### 页面/组件 (Pages/Components)
- **主应用容器 (App.vue)**
- **左侧栏 - 笔记列表组件 (NoteList.vue)**
- **中间栏 - Markdown编辑器组件 (MarkdownEditor.vue)**
- **右侧栏 - AI功能面板组件 (AIPanel.vue)**
- **搜索组件 (SearchBox.vue)**
- **标签显示组件 (TagDisplay.vue)**

#### 用户流程 (User Flow)
1. **创建笔记：** 点击"新建笔记" → 在编辑器中输入内容 → 自动保存并生成标签
2. **编辑笔记：** 左侧选择笔记 → 中间编辑器显示内容 → 实时预览markdown渲染效果
3. **AI润色：** 选中文本点击"润色选中" 或 点击"润色全文" → AI处理后替换原文
4. **语义搜索：** 右侧搜索框输入查询 → 显示相关笔记列表 → 点击跳转到对应笔记

#### 数据交互 (Data Interaction)
- **获取笔记列表：** `GET /api/notes`
- **获取单个笔记：** `GET /api/notes/:id`
- **保存笔记：** `POST/PUT /api/notes` (触发自动标签生成)
- **AI润色：** `POST /api/ai/polish` (发送选中文本或全文)
- **语义搜索：** `POST /api/ai/search` (发送搜索查询)

### 后端 (Backend)

#### API 接口 (API Endpoints)
```
GET    /api/notes           - 获取所有笔记列表
GET    /api/notes/:id       - 获取特定笔记详情
POST   /api/notes           - 创建新笔记
PUT    /api/notes/:id       - 更新笔记内容
DELETE /api/notes/:id       - 删除笔记
POST   /api/ai/polish       - AI润色文本 {text: string, type: 'selected'|'full'}
POST   /api/ai/search       - 语义搜索 {query: string}
POST   /api/ai/tags         - 生成标签 {content: string}
```

#### 数据模型 (Data Models)
```sql
-- 笔记表
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,              -- JSON数组存储标签
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    embedding TEXT          -- 存储向量嵌入用于语义搜索
);
```

## 4. 技术栈建议 (Tech Stack Suggestion)

### 前端
- **Vue.js 3** (组合式API，适合初学者)
- **Vite** (快速开发构建工具)
- **Element Plus** (UI组件库，提供基础样式)
- **@vueuse/core** (Vue工具函数库)
- **marked.js** (Markdown解析器)
- **highlight.js** (代码高亮)

### 后端
- **Python Flask** (轻量级，适合个人项目)
- **SQLite** (轻量级本地数据库)
- **SQLAlchemy** (数据库ORM)
- **OpenAI Python SDK** (AI服务集成)
- **sentence-transformers** (文本向量化，用于语义搜索)

## 5. 开发步骤建议 (Development Steps)

### 第一阶段：基础框架搭建
1. **初始化前端项目：** 使用Vite创建Vue项目，安装必要依赖
2. **搭建三栏布局：** 创建基础组件和CSS布局
3. **初始化后端：** 创建Flask应用，设置基础路由结构
4. **数据库设计：** 创建SQLite数据库和notes表

### 第二阶段：核心功能开发
5. **笔记CRUD功能：** 实现笔记的增删改查API和前端交互
6. **Markdown编辑器：** 集成markdown编辑和预览功能
7. **数据持久化：** 确保笔记能正确保存和读取

### 第三阶段：AI功能集成
8. **配置AI服务：** 安全地集成OpenAI API（密钥后台管理）
9. **AI润色功能：** 实现选中文本和全文润色
10. **自动标签生成：** 在笔记保存时自动调用AI生成标签
11. **语义搜索：** 实现文本向量化和相似度搜索

### 第四阶段：优化完善
12. **响应式优化：** 确保在不同屏幕尺寸下正常使用
13. **性能优化：** 实现笔记列表的懒加载
14. **错误处理：** 添加友好的错误提示和异常处理

### 安全注意事项
- ✅ API密钥存储在服务器环境变量中，绝不暴露到前端
- ✅ 实现请求频率限制，避免API滥用
- ✅ 添加输入验证和XSS防护

这个设计方案将你的想法转化为了具体可执行的开发任务。你觉得这个技术方案如何？有需要调整的地方吗？
