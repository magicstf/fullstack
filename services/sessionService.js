import crypto from 'crypto'
import pool from '../db/pool.js'
import { AppError } from '../middleware/errorHandler.js'

function mapSession(row) {
  const title = row.first_user_content
    ? row.first_user_content.length > 20
      ? `${row.first_user_content.slice(0, 20)}…`
      : row.first_user_content
    : '新对话'

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    title
  }
}

/** 查询所有会话（按最近消息时间倒序） */
export async function listSessions() {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.created_at,
       (SELECT m.content FROM message m
        WHERE m.session_id = s.id AND m.role = 'user'
        ORDER BY m.created_at ASC LIMIT 1) AS first_user_content,
       (SELECT MAX(m.created_at) FROM message m WHERE m.session_id = s.id) AS updated_at
     FROM session s
     ORDER BY COALESCE(updated_at, s.created_at) DESC`
  )
  return rows.map(mapSession)
}

/** 创建会话 */
export async function createSession(id = crypto.randomUUID()) {
  await pool.query('INSERT INTO session (id) VALUES (?)', [id])
  const [rows] = await pool.query(
    'SELECT id, created_at FROM session WHERE id = ?',
    [id]
  )
  const row = rows[0]
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.created_at,
    title: '新对话'
  }
}

/** 获取单个会话 */
export async function getSession(sessionId) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.created_at,
       (SELECT m.content FROM message m
        WHERE m.session_id = s.id AND m.role = 'user'
        ORDER BY m.created_at ASC LIMIT 1) AS first_user_content,
       (SELECT MAX(m.created_at) FROM message m WHERE m.session_id = s.id) AS updated_at
     FROM session s
     WHERE s.id = ?`,
    [sessionId]
  )
  if (rows.length === 0) {
    throw new AppError('会话不存在', 404)
  }
  return mapSession(rows[0])
}

/** 删除会话（级联删除消息） */
export async function deleteSession(sessionId) {
  const [result] = await pool.query('DELETE FROM session WHERE id = ?', [sessionId])
  if (result.affectedRows === 0) {
    throw new AppError('会话不存在', 404)
  }
}

/** 确认会话存在 */
export async function ensureSession(sessionId) {
  const [rows] = await pool.query('SELECT id FROM session WHERE id = ?', [sessionId])
  if (rows.length === 0) {
    throw new AppError('会话不存在', 404)
  }
}
