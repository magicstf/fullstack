import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimit } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = 3000;

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 20;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// 通义千问 兼容 OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 对话接口限流：默认每 IP 每分钟最多 20 次
const chatRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: '请求过于频繁，请稍后再试'
});

// 流式对话接口 SSE
app.post('/api/chat-stream', chatRateLimit, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 不能为空' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.chat.completions.create({
      model: 'gui-plus-2026-02-26',
      messages,
      stream: true
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }
  res.end();
});

app.listen(PORT, () => {
  console.log(`后端服务运行：http://localhost:${PORT}`);
  console.log(`限流配置：每 IP ${RATE_LIMIT_MAX} 次 / ${RATE_LIMIT_WINDOW_MS / 1000}s`);
});
