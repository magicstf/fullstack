import { defineStore } from 'pinia'
import {
  fetchSessions,
  fetchSessionDetail,
  createSession as apiCreateSession,
  clearMessages,
  deleteSession
} from '../api'
import { ACTIVE_SESSION_KEY } from '../constants/chat.js'
import { mapApiMessages } from '../utils/messages.js'

export const useSessionStore = defineStore('session', {
  state: () => ({
    sessions: [],
    activeSessionId: '',
    sessionsLoading: false,
    messagesLoading: false
  }),

  getters: {
    currentSession(state) {
      return state.sessions.find((s) => s.id === state.activeSessionId) ?? null
    },

    displayMessages(state) {
      const session = state.sessions.find((s) => s.id === state.activeSessionId)
      return session?.messages ?? []
    }
  },

  actions: {
    persistActiveSession() {
      localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId)
    },

    updateSessionTitle(session, userText) {
      if (session.title === '新对话') {
        session.title = userText.length > 20 ? `${userText.slice(0, 20)}…` : userText
      }
    },

    async refreshSessionList() {
      const list = await fetchSessions()
      const cachedMessages = new Map(this.sessions.map((s) => [s.id, s.messages]))
      this.sessions = list.map((s) => ({
        ...s,
        messages: cachedMessages.get(s.id) ?? []
      }))
    },

    async loadSessionDetail(sessionId) {
      this.messagesLoading = true
      try {
        const detail = await fetchSessionDetail(sessionId)
        const session = this.sessions.find((s) => s.id === sessionId)
        if (session) {
          session.title = detail.title
          session.updatedAt = detail.updatedAt
          session.messageCount = detail.messageCount
          session.messages = mapApiMessages(detail.messages)
        }
      } finally {
        this.messagesLoading = false
      }
    },

    async createSession() {
      const data = await apiCreateSession()
      const session = { ...data, messages: [] }
      this.sessions.unshift(session)
      this.activeSessionId = session.id
      this.persistActiveSession()
    },

    async switchSession(id) {
      if (id === this.activeSessionId || this.messagesLoading) return false
      this.activeSessionId = id
      this.persistActiveSession()
      await this.loadSessionDetail(id)
      return true
    },

    async initSessions() {
      this.sessionsLoading = true
      try {
        const list = await fetchSessions()
        if (list.length === 0) {
          await this.createSession()
          return
        }
        this.sessions = list.map((s) => ({ ...s, messages: [] }))
        const savedId = localStorage.getItem(ACTIVE_SESSION_KEY)
        const targetId = this.sessions.find((s) => s.id === savedId)?.id || this.sessions[0].id
        this.activeSessionId = targetId
        await this.loadSessionDetail(targetId)
      } catch (err) {
        console.error('加载会话失败：', err)
        await this.createSession()
      } finally {
        this.sessionsLoading = false
      }
    },

    async removeSession(sessionId) {
      const session = this.sessions.find((s) => s.id === sessionId)
      if (!session) return

      if (!confirm(`确定删除会话「${session.title}」？`)) return false

      try {
        await deleteSession(sessionId)
        this.sessions = this.sessions.filter((s) => s.id !== sessionId)

        if (this.activeSessionId === sessionId) {
          if (this.sessions.length > 0) {
            await this.switchSession(this.sessions[0].id)
          } else {
            await this.createSession()
          }
        }
        return true
      } catch (err) {
        console.error('删除会话失败：', err)
        return false
      }
    },

    async clearCurrentSession() {
      const session = this.currentSession
      if (!session || session.messages.length === 0) return
      if (!confirm('确定清空当前会话的所有聊天记录？')) return

      await clearMessages(session.id)
      session.messages = []
      session.title = '新对话'
      session.messageCount = 0
      session.updatedAt = new Date().toISOString()
      await this.refreshSessionList()
    }
  }
})
