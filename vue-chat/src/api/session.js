import { request } from './request.js'

/** 获取会话列表 */
export function fetchSessions() {
  return request('/api/sessions').then((res) => res.json()).then((data) => data.sessions)
}

/** 创建会话 */
export function createSession() {
  return request('/api/sessions', { method: 'POST' }).then((res) => res.json())
}

/** 获取会话消息 */
export function fetchMessages(sessionId) {
  return request(`/api/sessions/${sessionId}/messages`)
    .then((res) => res.json())
    .then((data) => data.messages)
}

/** 新增消息 */
export function addMessage(sessionId, role, content) {
  return request(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: { role, content }
  }).then((res) => res.json())
}

/** 清空会话消息 */
export function clearMessages(sessionId) {
  return request(`/api/sessions/${sessionId}/messages`, { method: 'DELETE' })
}

/** 删除会话 */
export function deleteSession(sessionId) {
  return request(`/api/sessions/${sessionId}`, { method: 'DELETE' })
}
