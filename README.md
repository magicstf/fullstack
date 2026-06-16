# Fullstack AI Chat

基于 **Express + Vue 3 + MySQL** 的全栈流式 AI 对话应用。后端通过阿里云通义千问（DashScope 兼容 OpenAI 接口）提供 SSE 流式回复；前端支持多会话管理、历史记录持久化、深浅色主题与左滑删除等功能。

## 功能特性

- 流式对话（SSE），支持停止生成
- 多会话：新建、切换、左滑删除、清空对话
- MySQL 持久化会话与消息，刷新页面不丢失
- 请求限流、Morgan 日志、全局异常处理
- 气泡聊天 UI、深浅色主题、断网提示、输入字数限制

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js、Express、mysql2、OpenAI SDK（DashScope 兼容模式）、morgan |
| 前端 | Vue 3、Vite、Pinia |
| 数据库 | MySQL 8+ |
| AI | 阿里云 DashScope / 通义千问 |

## 项目结构

```
fullstack/
├── server.js                 # 入口：挂载中间件与路由
├── config/index.js           # 统一配置（端口、数据库、千问、限流）
├── db/
│   ├── pool.js               # mysql2 连接池
│   ├── schema.sql            # 建表 SQL
│   └── init.js               # 启动时自动建库建表
├── middleware/
│   ├── morganLogger.js       # 请求日志
│   ├── rateLimit.js          # IP 限流
│   └── errorHandler.js       # 全局异常处理
├── routes/
│   ├── chat.js               # 流式对话接口
│   └── session.js            # 会话 / 消息 CRUD
├── services/
│   ├── qwen.js               # 千问流式调用
│   ├── sessionService.js
│   └── messageService.js
├── .env                      # 环境变量（勿提交）
└── vue-chat/                 # Vue 3 前端
    └── src/
        ├── App.vue           # 编排层
        ├── api/              # fetch 封装与接口
        ├── stores/           # Pinia（theme / session / chat / app）
        ├── components/         # 会话侧栏、聊天气泡、输入框等
        ├── composables/      # 左滑删除等
        ├── constants/
        └── utils/
```

## 环境要求

- Node.js 18+
- MySQL 8+
- [阿里云 DashScope API Key](https://help.aliyun.com/zh/model-studio/get-api-key)

## 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env`：

```env
# 通义千问
DASHSCOPE_API_KEY=你的_API_Key

# 可选：千问配置
# DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# QWEN_MODEL=qwen3.6-plus
# QWEN_TIMEOUT_MS=60000
# QWEN_ENABLE_THINKING=true

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=fullstack_chat

# 可选：服务与限流
# PORT=3000
# RATE_LIMIT_WINDOW_MS=60000
# RATE_LIMIT_MAX=20
```

前端可选配置（`vue-chat/.env`）：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. 安装依赖

```bash
# 后端
npm install

# 前端
cd vue-chat
npm install
```

### 3. 启动服务

```bash
# 终端 1：后端（自动建库建表，默认 http://localhost:3000）
node server.js

# 终端 2：前端
cd vue-chat
npm run dev
```

浏览器访问 Vite 输出的地址（通常为 `http://localhost:5173`）。

## 数据库

启动后端时会自动创建数据库和表结构，也可手动执行 `db/schema.sql`。

| 表 | 说明 |
|----|------|
| `session` | 会话 ID、创建时间 |
| `message` | 关联会话、角色、内容、时间（级联删除） |

## API

### 流式对话

**`POST /api/chat-stream`**

SSE 流式返回，`Content-Type: text/event-stream`。

```json
{
  "messages": [
    { "role": "system", "content": "你是简洁友好的AI助手" },
    { "role": "user", "content": "你好" }
  ]
}
```

响应：`data: {"text":"..."}` 逐块输出，结束 `data: {"done":true}`，错误 `data: {"error":"..."}`。

### 会话与消息

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sessions` | 会话列表 |
| POST | `/api/sessions` | 创建会话 |
| GET | `/api/sessions/:id` | 会话详情 |
| GET | `/api/sessions/:id/detail` | 会话详情 + 历史消息 |
| DELETE | `/api/sessions/:id` | 删除会话 |
| GET | `/api/sessions/:id/messages` | 消息列表 |
| POST | `/api/sessions/:id/messages` | 新增消息 |
| DELETE | `/api/sessions/:id/messages` | 清空消息 |

## 前端架构

- **Pinia**：`theme`（主题）、`session`（会话）、`chat`（流式发送）、`app`（网络状态）
- **组件**：`SessionPanel`、`ChatPanel`、`MessageBubble`、`ChatInput` 等
- **API 层**：`src/api/request.js` 统一 fetch、超时与错误处理

## 说明

- `.env` 已加入 `.gitignore`，请勿提交 API Key 与数据库密码。
- 对话接口默认限流：每 IP 60 秒内最多 20 次（可通过环境变量调整）。
- 模型名称在 `config/index.js` 中配置，默认 `qwen3.6-plus`。
- 若 Vite 启动报 `axios` 相关缓存错误，删除 `vue-chat/node_modules/.vite` 后重启即可。

## License

MIT
