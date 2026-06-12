# Fullstack AI Chat

基于 **Express** 与 **Vue 3** 的全栈流式对话应用，后端通过阿里云通义千问（DashScope 兼容 OpenAI 接口）提供 SSE 流式回复，前端实时展示 AI 回答。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js、Express、OpenAI SDK（兼容模式） |
| 前端 | Vue 3、Vite |
| AI | 阿里云 DashScope / 通义千问 |

## 项目结构

```
fullstack/
├── server.js          # Express 后端，提供流式对话 API
├── package.json
├── .env               # 环境变量（需自行创建，勿提交）
└── vue-chat/          # Vue 3 前端
    ├── src/App.vue    # 聊天界面
    └── vite.config.js
```

## 环境要求

- Node.js 18+
- [阿里云 DashScope API Key](https://help.aliyun.com/zh/model-studio/get-api-key)

## 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
DASHSCOPE_API_KEY=你的_API_Key
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

分别开启两个终端：

```bash
# 终端 1：启动后端（默认 http://localhost:3000）
node server.js

# 终端 2：启动前端
cd vue-chat
npm run dev
```

浏览器访问 Vite 输出的本地地址（通常为 `http://localhost:5173`）即可使用聊天界面。

## API

### `POST /api/chat-stream`

流式对话接口，使用 Server-Sent Events（SSE）返回。

**请求体：**

```json
{
  "messages": [
    { "role": "system", "content": "你是简洁友好的AI助手" },
    { "role": "user", "content": "你好" }
  ]
}
```

**响应：** `text/event-stream`，每行格式为 `data: {"text":"..."}`，结束时发送 `data: {"done":true}`。

## 说明

- `.env` 已加入 `.gitignore`，请勿将 API Key 提交到版本库。
- 前端默认请求 `http://localhost:3000/api/chat-stream`，请确保后端已启动。
- 当前使用的模型为 `gui-plus-2026-02-26`，可在 `server.js` 中修改。

## License

MIT
