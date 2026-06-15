import { Router } from 'express'
import config from '../config/index.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { AppError, asyncHandler } from '../middleware/errorHandler.js'
import { streamChat } from '../services/qwen.js'

const router = Router()

const chatRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message
})

/** POST /api/chat-stream - SSE 流式对话 */
router.post(
  '/chat-stream',
  chatRateLimit,
  asyncHandler(async (req, res) => {
    const { messages } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new AppError('messages 不能为空', 400)
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    try {
      for await (const text of streamChat(messages)) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    } catch (err) {
      // SSE 已写入响应头，通过流式格式返回错误
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    }

    res.end()
  })
)

export default router
