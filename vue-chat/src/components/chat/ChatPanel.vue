<template>
  <div class="chat-container">
    <ChatToolbar
      :title="title"
      :theme="theme"
      :loading="loading"
      :has-messages="messages.length > 0"
      @toggle-theme="$emit('toggle-theme')"
      @clear="$emit('clear')"
    />
    <MessageList
      ref="messageListRef"
      :messages="messages"
      :loading="messagesLoading"
    />
    <ChatInput
      :model-value="inputText"
      :loading="loading"
      :is-online="isOnline"
      @update:model-value="$emit('update:inputText', $event)"
      @send="$emit('send')"
      @stop="$emit('stop')"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatToolbar from './ChatToolbar.vue'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

defineProps({
  title: { type: String, default: '' },
  theme: { type: String, default: 'light' },
  messages: { type: Array, default: () => [] },
  messagesLoading: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true },
  inputText: { type: String, default: '' }
})

defineEmits(['toggle-theme', 'clear', 'send', 'stop', 'update:inputText'])

const messageListRef = ref(null)

function scrollToBottom() {
  messageListRef.value?.scrollToBottom?.()
}

defineExpose({ scrollToBottom })
</script>

<style scoped>
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
</style>
