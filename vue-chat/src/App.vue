<template>
  <div class="chat-app" :class="themeStore.theme">
    <OfflineBanner :is-online="appStore.isOnline" />

    <div class="app-layout">
      <SessionPanel
        ref="sessionPanelRef"
        :sessions="sessionStore.sessions"
        :active-id="sessionStore.activeSessionId"
        :sessions-loading="sessionStore.sessionsLoading"
        :chat-loading="chatStore.loading"
        @create="sessionStore.createSession"
        @select="handleSelectSession"
        @delete="handleDeleteSession"
      />

      <ChatPanel
        ref="chatPanelRef"
        :title="sessionStore.currentSession?.title"
        :theme="themeStore.theme"
        :messages="sessionStore.displayMessages"
        :messages-loading="sessionStore.messagesLoading"
        :loading="chatStore.loading"
        :is-online="appStore.isOnline"
        v-model:input-text="inputText"
        @toggle-theme="themeStore.toggleTheme"
        @clear="sessionStore.clearCurrentSession"
        @send="handleSend"
        @stop="chatStore.stopGeneration"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import OfflineBanner from './components/OfflineBanner.vue'
import SessionPanel from './components/session/SessionPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'
import { useThemeStore } from './stores/theme.js'
import { useSessionStore } from './stores/session.js'
import { useChatStore } from './stores/chat.js'
import { useAppStore } from './stores/app.js'

const themeStore = useThemeStore()
const sessionStore = useSessionStore()
const chatStore = useChatStore()
const appStore = useAppStore()

const inputText = ref('')
const sessionPanelRef = ref(null)
const chatPanelRef = ref(null)

function scrollToBottom() {
  chatPanelRef.value?.scrollToBottom?.()
}

async function handleSelectSession(id) {
  if (chatStore.loading) return
  sessionPanelRef.value?.resetSwipe?.()
  const switched = await sessionStore.switchSession(id)
  if (switched) scrollToBottom()
}

async function handleDeleteSession(id) {
  if (chatStore.loading) return
  await sessionStore.removeSession(id)
  sessionPanelRef.value?.resetSwipe?.()
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await chatStore.send(text, scrollToBottom)
}

function handleOnline() {
  appStore.setOnline(true)
}

function handleOffline() {
  appStore.setOnline(false)
  if (chatStore.loading) chatStore.stopGeneration()
}

onMounted(async () => {
  themeStore.loadTheme()
  await sessionStore.initSessions()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  scrollToBottom()
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  chatStore.stopGeneration()
})
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

@media (max-width: 640px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout :deep(.session-panel) {
    width: 100%;
    max-height: 160px;
  }

  .app-layout :deep(.chat-container) {
    max-height: none;
  }
}
</style>
