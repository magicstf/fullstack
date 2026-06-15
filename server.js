import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import { morganLogger } from './middleware/morganLogger.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { initDatabase } from './db/init.js'
import chatRoutes from './routes/chat.js'
import sessionRoutes from './routes/session.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morganLogger)
app.use('/api', chatRoutes)
app.use('/api', sessionRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})

async function start() {
  try {
    await initDatabase()
  } catch (err) {
    console.error('数据库初始化失败：', err.message)
    process.exit(1)
  }

  app.listen(config.port, () => {
    console.log(`后端服务运行：http://localhost:${config.port}`)
    console.log(`数据库：${config.db.host}:${config.db.port}/${config.db.database}`)
    console.log(`千问模型：${config.qwen.model} | 超时：${config.qwen.timeout}ms`)
    console.log(
      `限流配置：每 IP ${config.rateLimit.max} 次 / ${config.rateLimit.windowMs / 1000}s`
    )
    if (!config.qwen.apiKey) {
      console.warn('警告：未配置 DASHSCOPE_API_KEY，对话接口将无法调用')
    }
  })
}

start()
