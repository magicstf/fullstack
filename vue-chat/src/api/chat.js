import { request } from './request.js'
import { DEFAULT_TIMEOUT } from './config.js'

/**
 * 流式对话（SSE）
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeout]
 * @param {(reader: ReadableStreamDefaultReader) => void} [options.onReader] - 暴露 reader 供外部 cancel
 * @param {(text: string) => void} [options.onText]
 * @param {() => void} [options.onDone]
 * @returns {Promise<{ receivedDone: boolean }>}
 */
export async function streamChat(messages, options = {}) {
  const {
    signal,
    timeout = DEFAULT_TIMEOUT,
    onReader,
    onText,
    onDone
  } = options

  const response = await request('/api/chat-stream', {
    method: 'POST',
    body: { messages },
    signal,
    timeout
  })

  if (!response.body) {
    throw new Error('服务未返回流式数据')
  }

  const reader = response.body.getReader()
  onReader?.(reader)

  const decoder = new TextDecoder('utf-8', { stream: true })
  let buffer = ''
  let receivedDone = false

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() || ''

      for (const chunk of chunks) {
        if (!chunk.startsWith('data: ')) continue

        try {
          const data = JSON.parse(chunk.slice(6))

          if (data.error) {
            throw new Error(data.error)
          }

          if (data.done) {
            receivedDone = true
            onDone?.()
            return { receivedDone }
          }

          if (data.text) {
            onText?.(data.text)
          }
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) continue
          throw parseErr
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return { receivedDone }
}
