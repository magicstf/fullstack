<template>
  <div :class="['message-row', message.role]">
    <div class="avatar" :class="message.role" aria-hidden="true">
      <span>{{ message.role === 'user' ? '我' : 'AI' }}</span>
    </div>

    <div :class="['bubble', message.role, message.status]">
      <div
        v-if="message.role === 'assistant' && message.status === 'loading'"
        class="skeleton"
        aria-label="AI 正在思考"
      >
        <span class="skeleton-line w-full"></span>
        <span class="skeleton-line w-80"></span>
        <span class="skeleton-line w-60"></span>
      </div>
      <div v-else class="bubble-content">
        <span class="content">{{ message.content }}</span>
        <span
          v-if="message.role === 'assistant' && message.status === 'streaming'"
          class="typing-cursor"
        >|</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: { type: Object, required: true }
})
</script>

<style scoped>
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
</style>
