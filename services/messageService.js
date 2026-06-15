import pool from '../db/pool.js'
import { AppError } from '../middleware/errorHandler.js'
import { ensureSession } from './sessionService.js'

const ALLOWED_ROLES = new Set(['user', 'assistant', 'system'])

function mapMessage(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }
}

/** 查询会话下所有消息 */
export async function listMessages(sessionId) {
  await ensureSession(sessionId)
  const [rows] = await pool.query(
    `SELECT id, session_id, role, content, created_at
     FROM message
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [sessionId]
  )
  return rows.map(mapMessage)
}

/** 新增消息 */
export async function addMessage(sessionId, role, content) {
  if (!ALLOWED_ROLES.has(role)) {
    throw new AppError(`无效角色: ${role}`, 400)
  }
  if (!content?.trim()) {
    throw new AppError('消息内容不能为空', 400)
  }

  await ensureSession(sessionId)
  const [result] = await pool.query(
    'INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)',
    [sessionId, role, content.trim()]
  )

  const [rows] = await pool.query(
    'SELECT id, session_id, role, content, created_at FROM message WHERE id = ?',
    [result.insertId]
  )
  return mapMessage(rows[0])
}

/** 清空会话消息 */
export async function clearMessages(sessionId) {
  await ensureSession(sessionId)
  await pool.query('DELETE FROM message WHERE session_id = ?', [sessionId])
}
