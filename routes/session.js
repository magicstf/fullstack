import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as sessionService from '../services/sessionService.js'
import * as messageService from '../services/messageService.js'

const router = Router()

/** GET /api/sessions - 会话列表 */
router.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const sessions = await sessionService.listSessions()
    res.json({ sessions })
  })
)

/** POST /api/sessions - 创建会话 */
router.post(
  '/sessions',
  asyncHandler(async (req, res) => {
    const session = await sessionService.createSession()
    res.status(201).json(session)
  })
)

/** GET /api/sessions/:sessionId - 会话详情 */
router.get(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const session = await sessionService.getSession(req.params.sessionId)
    res.json(session)
  })
)

/** DELETE /api/sessions/:sessionId - 删除会话 */
router.delete(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    await sessionService.deleteSession(req.params.sessionId)
    res.json({ ok: true })
  })
)

/** GET /api/sessions/:sessionId/messages - 消息列表 */
router.get(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    const messages = await messageService.listMessages(req.params.sessionId)
    res.json({ messages })
  })
)

/** POST /api/sessions/:sessionId/messages - 新增消息 */
router.post(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    const { role, content } = req.body
    const message = await messageService.addMessage(
      req.params.sessionId,
      role,
      content
    )
    res.status(201).json(message)
  })
)

/** DELETE /api/sessions/:sessionId/messages - 清空消息 */
router.delete(
  '/sessions/:sessionId/messages',
  asyncHandler(async (req, res) => {
    await messageService.clearMessages(req.params.sessionId)
    res.json({ ok: true })
  })
)

export default router
