import dotenv from 'dotenv'

dotenv.config()

const config = {
  /** 服务端口 */
  port: Number(process.env.PORT) || 3000,

  /** MySQL */
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'fullstack_chat'
  },

  /** 通义千问 / DashScope */
  qwen: {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    baseURL:
      process.env.DASHSCOPE_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.QWEN_MODEL || 'qwen3.6-plus',
    timeout: Number(process.env.QWEN_TIMEOUT_MS) || 60_000,
    enableThinking: process.env.QWEN_ENABLE_THINKING !== 'false'
  },

  /** 接口限流 */
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20,
    message: '请求过于频繁，请稍后再试'
  }
}

export default config
