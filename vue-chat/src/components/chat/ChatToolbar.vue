<template>
  <div class="chat-toolbar">
    <span class="current-session">{{ title || '新对话' }}</span>
    <div class="toolbar-actions">
      <button
        class="btn-theme"
        :title="theme === 'light' ? '切换深色' : '切换浅色'"
        @click="$emit('toggle-theme')"
      >
        {{ theme === 'light' ? '🌙' : '☀️' }}
      </button>
      <button
        class="btn-clear"
        :disabled="loading || !hasMessages"
        @click="$emit('clear')"
      >
        清空对话
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  theme: { type: String, default: 'light' },
  loading: { type: Boolean, default: false },
  hasMessages: { type: Boolean, default: false }
})

defineEmits(['toggle-theme', 'clear'])
</script>

<style scoped>
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

.btn-clear:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
