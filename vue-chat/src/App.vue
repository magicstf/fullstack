<template>
  <div class="chat-app" :class="theme">
    <div v-if="!isOnline" class="offline-banner">网络已断开，请检查连接后重试</div>

    <div class="app-layout">
      <aside class="session-panel">
        <div class="session-header">
          <span class="session-title">会话列表</span>
          <button class="btn-new" @click="createSession" :disabled="loading">新建</button>
        </div>
        <ul class="session-list">
          <li
            v-for="session in sessions"
            :key="session.id"
            :class="['session-item', { active: session.id === activeSessionId }]"
            @click="switchSession(session.id)"
          >
            <span class="session-name">{{ session.title }}</span>
            <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
          </li>
        </ul>
      </aside>

      <div class="chat-container">
        <div class="chat-toolbar">
          <span class="current-session">{{ currentSession?.title || '新对话' }}</span>
          <div class="toolbar-actions">
            <button class="btn-theme" @click="toggleTheme" :title="theme === 'light' ? '切换深色' : '切换浅色'">
              {{ theme === 'light' ? '🌙' : '☀️' }}
            </button>
            <button
              class="btn-clear"
              @click="clearCurrentSession"
              :disabled="loading || displayMessages.length === 0"
            >
              清空对话
            </button>
          </div>
        </div>

        <div ref="chatBox" class="chat-box">
          <div
            v-for="(msg, index) in displayMessages"
            :key="index"
            :class="['message-row', msg.role]"
          >
            <div class="avatar" :class="msg.role" aria-hidden="true">
              <span v-if="msg.role === 'user'">我</span>
              <span v-else>AI</span>
            </div>

            <div :class="['bubble', msg.role, msg.status]">
              <div
                v-if="msg.role === 'assistant' && msg.status === 'loading'"
                class="skeleton"
                aria-label="AI 正在思考"
              >
                <span class="skeleton-line w-full"></span>
                <span class="skeleton-line w-80"></span>
                <span class="skeleton-line w-60"></span>
              </div>
              <div v-else class="bubble-content">
                <span class="content">{{ msg.content }}</span>
                <span
                  v-if="msg.role === 'assistant' && msg.status === 'streaming'"
                  class="typing-cursor"
                >|</span>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-wrap">
            <textarea
              ref="inputRef"
              v-model="inputText"
              @input="handleInput"
              @paste="handlePaste"
              @keydown.enter.exact.prevent="handleSend"
              placeholder="请输入问题，Shift+Enter 换行"
              class="input"
              :disabled="loading"
              rows="2"
            />
            <div class="input-meta">
              <span :class="['char-count', { warn: isNearLimit, limit: isAtLimit }]">
                {{ inputLength }}/{{ MAX_INPUT_LENGTH }}
              </span>
            </div>
          </div>
          <div class="action-btns">
            <button v-if="loading" @click="stopGeneration" class="btn-stop">停止生成</button>
            <button
              v-else
              @click="handleSend"
              class="send-btn"
              :disabled="!inputText.trim() || !isOnline || isAtLimit"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  streamChat,
  fetchSessions,
  createSession as apiCreateSession,
  fetchMessages,
  addMessage,
  clearMessages
} from './api'

const ACTIVE_SESSION_KEY = 'fullstack-chat-active-session'
const THEME_KEY = 'fullstack-chat-theme'
const SYSTEM_PROMPT = { role: 'system', content: '你是简洁友好的AI助手' }
const MAX_INPUT_LENGTH = 2000

const inputText = ref('')
const inputRef = ref(null)
const chatBox = ref(null)
const loading = ref(false)
const isOnline = ref(navigator.onLine)
const theme = ref('light')
const sessions = ref([])
const activeSessionId = ref('')

let abortController = null
let streamReader = null
let userAborted = false

const currentSession = computed(() =>
  sessions.value.find((s) => s.id === activeSessionId.value)
)

const displayMessages = computed(() => currentSession.value?.messages ?? [])

const inputLength = computed(() => inputText.value.length)
const isNearLimit = computed(() => inputLength.value >= MAX_INPUT_LENGTH * 0.9)
const isAtLimit = computed(() => inputLength.value >= MAX_INPUT_LENGTH)

function formatTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mapApiMessages(list) {
  return list
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }))
}

async function loadSessionMessages(sessionId) {
  const list = await fetchMessages(sessionId)
  const session = sessions.value.find((s) => s.id === sessionId)
  if (session) {
    session.messages = mapApiMessages(list)
  }
}

function normalizePastedText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function clampInput(value) {
  return value.length > MAX_INPUT_LENGTH ? value.slice(0, MAX_INPUT_LENGTH) : value
}

function insertTextAtCursor(text) {
  const el = inputRef.value
  if (!el) {
    inputText.value = clampInput(inputText.value + text)
    return
  }
  const start = el.selectionStart ?? inputText.value.length
  const end = el.selectionEnd ?? start
  const merged = inputText.value.slice(0, start) + text + inputText.value.slice(end)
  inputText.value = clampInput(merged)
  const cursor = Math.min(start + text.length, MAX_INPUT_LENGTH)
  nextTick(() => {
    el.selectionStart = cursor
    el.selectionEnd = cursor
    el.focus()
  })
}

function handleInput() {
  inputText.value = clampInput(inputText.value)
}

function handlePaste(e) {
  e.preventDefault()
  const pasted = e.clipboardData?.getData('text/plain')
  if (!pasted) return
  const normalized = normalizePastedText(pasted)
  if (!normalized) return
  insertTextAtCursor(normalized)
}

function applyTheme(value) {
  theme.value = value
  document.documentElement.setAttribute('data-theme', value)
  localStorage.setItem(THEME_KEY, value)
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved)
    return
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(prefersDark ? 'dark' : 'light')
}

function persistActiveSession() {
  localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId.value)
}

async function initSessions() {
  try {
    const list = await fetchSessions()
    if (list.length === 0) {
      await createSession()
      return
    }
    sessions.value = list.map((s) => ({ ...s, messages: [] }))
    const savedId = localStorage.getItem(ACTIVE_SESSION_KEY)
    const targetId = sessions.value.find((s) => s.id === savedId)?.id || sessions.value[0].id
    activeSessionId.value = targetId
    await loadSessionMessages(targetId)
  } catch (err) {
    console.error('加载会话失败：', err)
    await createSession()
  }
}

async function createSession() {
  const data = await apiCreateSession()
  const session = { ...data, messages: [] }
  sessions.value.unshift(session)
  activeSessionId.value = session.id
  persistActiveSession()
}

async function switchSession(id) {
  if (loading.value || id === activeSessionId.value) return
  activeSessionId.value = id
  persistActiveSession()
  await loadSessionMessages(id)
  scrollToBottom()
}

async function clearCurrentSession() {
  const session = currentSession.value
  if (!session || session.messages.length === 0) return
  if (!confirm('确定清空当前会话的所有聊天记录？')) return
  await clearMessages(session.id)
  session.messages = []
  session.title = '新对话'
  session.updatedAt = new Date().toISOString()
}

function updateSessionTitle(session, userText) {
  if (session.title === '新对话') {
    session.title = userText.length > 20 ? `${userText.slice(0, 20)}…` : userText
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight
    }
  })
}

function cleanupRequest() {
  abortController = null
  streamReader = null
  loading.value = false
}

function resolveErrorMessage(err) {
  if (userAborted) return null
  if (!navigator.onLine) return '网络已断开，请检查连接后重试'
  if (err?.name === 'AbortError') return '请求超时，请稍后重试'
  return err?.message || '请求出错，请稍后重试'
}

async function finalizeAssistantMessage(session, aiIndex, status) {
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

  try {
    await addMessage(session.id, 'assistant', msg.content)
  } catch (err) {
    console.error('保存 AI 消息失败：', err)
  }
}

function stopGeneration() {
  userAborted = true
  abortController?.abort()
  streamReader?.cancel().catch(() => {})
}

function handleOnline() {
  isOnline.value = true
}

function handleOffline() {
  isOnline.value = false
  if (loading.value) stopGeneration()
}

watch(displayMessages, scrollToBottom, { deep: true })

onMounted(async () => {
  loadTheme()
  await initSessions()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  scrollToBottom()
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  stopGeneration()
})

const handleSend = async () => {
  const text = inputText.value.trim()
  const session = currentSession.value
  if (!text || loading.value || !session || !navigator.onLine) return

  loading.value = true
  userAborted = false
  inputText.value = ''

  updateSessionTitle(session, text)

  try {
    await addMessage(session.id, 'user', text)
  } catch (err) {
    console.error('保存用户消息失败：', err)
    loading.value = false
    return
  }

  session.messages.push({ role: 'user', content: text })
  session.updatedAt = new Date().toISOString()
  scrollToBottom()

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
      onText: (text) => {
        const msg = session.messages[aiIndex]
        if (msg.status === 'loading') msg.status = 'streaming'
        msg.content += text
        scrollToBottom()
      }
    })

    if (receivedDone) {
      await finalizeAssistantMessage(session, aiIndex, 'done')
      return
    }

    if (!userAborted) {
      const msg = session.messages[aiIndex]
      if (!msg.content) throw new Error('模型未返回有效内容')
    }

    await finalizeAssistantMessage(session, aiIndex, userAborted ? 'stopped' : 'done')
  } catch (err) {
    if (userAborted) {
      await finalizeAssistantMessage(session, aiIndex, 'stopped')
    } else {
      const msg = session.messages[aiIndex]
      msg.content = resolveErrorMessage(err)
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
    cleanupRequest()
  }
}
</script>

<style scoped>
.chat-app {
  --bg-page: #f0f2f5;
  --bg-panel: #ffffff;
  --bg-chat: #f7f8fa;
  --bg-input: #ffffff;
  --border: #e4e7ed;
  --text-primary: #303133;
  --text-secondary: #909399;
  --bubble-user: #409eff;
  --bubble-user-text: #ffffff;
  --bubble-ai: #ffffff;
  --bubble-ai-text: #303133;
  --bubble-error-bg: #fef0f0;
  --bubble-error-text: #f56c6c;
  --bubble-stopped-text: #909399;
  --avatar-user: #409eff;
  --avatar-ai: #67c23a;
  --accent: #409eff;
  --accent-hover: #337ecc;
  --shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  --skeleton-base: #e8e8e8;
  --skeleton-shine: #f5f5f5;
  --offline-bg: #fff3e0;
  --offline-text: #e65100;
  --offline-border: #ffcc80;

  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.chat-app.dark {
  --bg-page: #1a1a1e;
  --bg-panel: #252529;
  --bg-chat: #1e1e22;
  --bg-input: #2c2c30;
  --border: #3a3a40;
  --text-primary: #e5e5e7;
  --text-secondary: #8e8e93;
  --bubble-user: #0a84ff;
  --bubble-user-text: #ffffff;
  --bubble-ai: #2c2c30;
  --bubble-ai-text: #e5e5e7;
  --bubble-error-bg: #3b2020;
  --bubble-error-text: #ff6b6b;
  --bubble-stopped-text: #8e8e93;
  --avatar-user: #0a84ff;
  --avatar-ai: #30d158;
  --accent: #0a84ff;
  --accent-hover: #409cff;
  --shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  --skeleton-base: #3a3a40;
  --skeleton-shine: #4a4a50;
  --offline-bg: #3b2f1a;
  --offline-text: #ffb74d;
  --offline-border: #6d4c1a;
}

.app-layout {
  display: flex;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 16px;
}

.offline-banner {
  padding: 8px 14px;
  background: var(--offline-bg);
  color: var(--offline-text);
  border-bottom: 1px solid var(--offline-border);
  font-size: 13px;
  text-align: center;
}

.session-panel {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  box-shadow: var(--shadow);
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.session-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-new {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.btn-new:hover:not(:disabled) {
  background: var(--accent-hover);
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  flex: 1;
}

.session-item {
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.session-item:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.session-item.active {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.session-name {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.chat-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  max-height: calc(100vh - 40px);
}

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.current-session {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-theme {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-theme:hover {
  background: color-mix(in srgb, var(--accent) 12%, var(--bg-input));
}

.btn-clear {
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: #f56c6c;
  border-radius: 8px;
  cursor: pointer;
}

.btn-clear:hover:not(:disabled) {
  background: color-mix(in srgb, #f56c6c 10%, var(--bg-input));
}

.chat-box {
  flex: 1;
  min-height: 360px;
  background: var(--bg-chat);
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.avatar.user {
  background: var(--avatar-user);
}

.avatar.assistant {
  background: var(--avatar-ai);
}

.bubble {
  max-width: min(75%, 520px);
  padding: 10px 14px;
  border-radius: 16px;
  box-shadow: var(--shadow);
  word-break: break-word;
  overflow-wrap: anywhere;
}

.message-row.user .bubble {
  background: var(--bubble-user);
  color: var(--bubble-user-text);
  border-bottom-right-radius: 4px;
}

.message-row.assistant .bubble {
  background: var(--bubble-ai);
  color: var(--bubble-ai-text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border);
}

.bubble.error {
  background: var(--bubble-error-bg) !important;
  color: var(--bubble-error-text) !important;
  border-color: color-mix(in srgb, var(--bubble-error-text) 30%, transparent) !important;
}

.bubble.stopped {
  color: var(--bubble-stopped-text) !important;
  font-style: italic;
}

.bubble-content {
  display: inline;
  line-height: 1.6;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  margin-left: 1px;
}

@keyframes blink {
  50% { opacity: 0; }
}

.skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 180px;
}

.skeleton-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-line.w-full { width: 100%; }
.skeleton-line.w-80 { width: 80%; }
.skeleton-line.w-60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.input-wrap {
  flex: 1;
  min-width: 0;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
  background: var(--bg-input);
  color: var(--text-primary);
}

.input:focus {
  border-color: var(--accent);
}

.input-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.char-count.warn {
  color: #e6a23c;
}

.char-count.limit {
  color: #f56c6c;
}

.action-btns {
  flex-shrink: 0;
}

.send-btn {
  padding: 10px 22px;
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-stop {
  padding: 10px 16px;
  border: 1px solid #e6a23c;
  background: var(--bg-input);
  color: #e6a23c;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.btn-stop:hover {
  background: color-mix(in srgb, #e6a23c 12%, var(--bg-input));
}

button:disabled,
textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .app-layout {
    flex-direction: column;
  }

  .session-panel {
    width: 100%;
    max-height: 160px;
  }

  .chat-container {
    max-height: none;
  }

  .bubble {
    max-width: 85%;
  }
}
</style>
