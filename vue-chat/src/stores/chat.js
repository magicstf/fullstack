import { defineStore } from 'pinia'
import { streamChat, addMessage } from '../api'
import { SYSTEM_PROMPT } from '../constants/chat.js'
import { useSessionStore } from './session.js'

let abortController = null
let streamReader = null
let userAborted = false

export const useChatStore = defineStore('chat', {
  state: () => ({
    loading: false
  }),

  actions: {
    resolveErrorMessage(err) {
      if (userAborted) return null
      if (!navigator.onLine) return '网络已断开，请检查连接后重试'
      if (err?.name === 'AbortError') return '请求超时，请稍后重试'
      return err?.message || '请求出错，请稍后重试'
    },

    cleanupRequest() {
      abortController = null
      streamReader = null
      this.loading = false
    },

    stopGeneration() {
      userAborted = true
      abortController?.abort()
      streamReader?.cancel().catch(() => {})
    },

    async finalizeAssistantMessage(session, aiIndex, status) {
      const msg = session.messages[aiIndex]
      if (!msg) return

      if (status === 'error') {
        msg.status = 'error'
      } else if (status === 'stopped') {
        msg.status = 'stopped'
        if (!msg.content) {
          msg.content = '已停止生成'
        } else if (!msg.content.endsWith(' [已停止]')) {
          msg.content += ' [已停止]'
        }
      } else {
        delete msg.status
      }

      session.updatedAt = new Date().toISOString()

      const sessionStore = useSessionStore()
      try {
        await addMessage(session.id, 'assistant', msg.content)
        await sessionStore.refreshSessionList()
      } catch (err) {
        console.error('保存 AI 消息失败：', err)
      }
    },

    async send(text, onScroll) {
      const sessionStore = useSessionStore()
      const session = sessionStore.currentSession
      if (!text || this.loading || !session || !navigator.onLine) return

      this.loading = true
      userAborted = false

      sessionStore.updateSessionTitle(session, text)

      try {
        await addMessage(session.id, 'user', text)
      } catch (err) {
        console.error('保存用户消息失败：', err)
        this.loading = false
        return
      }

      session.messages.push({ role: 'user', content: text })
      session.messageCount = (session.messageCount || 0) + 1
      session.updatedAt = new Date().toISOString()
      await sessionStore.refreshSessionList()
      onScroll?.()

      const apiMessages = [
        SYSTEM_PROMPT,
        ...session.messages.map(({ role, content }) => ({ role, content }))
      ]

      session.messages.push({ role: 'assistant', content: '', status: 'loading' })
      const aiIndex = session.messages.length - 1

      abortController = new AbortController()

      try {
        const { receivedDone } = await streamChat(apiMessages, {
          signal: abortController.signal,
          onReader: (reader) => { streamReader = reader },
          onText: (chunk) => {
            const msg = session.messages[aiIndex]
            if (msg.status === 'loading') msg.status = 'streaming'
            msg.content += chunk
            onScroll?.()
          }
        })

        if (receivedDone) {
          await this.finalizeAssistantMessage(session, aiIndex, 'done')
          return
        }

        if (!userAborted) {
          const msg = session.messages[aiIndex]
          if (!msg.content) throw new Error('模型未返回有效内容')
        }

        await this.finalizeAssistantMessage(session, aiIndex, userAborted ? 'stopped' : 'done')
      } catch (err) {
        if (userAborted) {
          await this.finalizeAssistantMessage(session, aiIndex, 'stopped')
        } else {
          const msg = session.messages[aiIndex]
          msg.content = this.resolveErrorMessage(err)
          msg.status = 'error'
          session.updatedAt = new Date().toISOString()
          try {
            await addMessage(session.id, 'assistant', msg.content)
          } catch (saveErr) {
            console.error('保存错误消息失败：', saveErr)
          }
          console.error('请求异常：', err)
        }
      } finally {
        this.cleanupRequest()
      }
    }
  }
})
