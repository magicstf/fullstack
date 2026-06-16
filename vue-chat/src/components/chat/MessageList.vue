<template>
  <div ref="containerRef" class="chat-box">
    <div v-if="loading" class="chat-loading">正在加载历史消息...</div>
    <div v-else-if="messages.length === 0" class="chat-empty">
      暂无消息，开始你的第一句对话吧
    </div>
    <MessageBubble
      v-for="(msg, index) in messages"
      v-else
      :key="index"
      :message="msg"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const containerRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

watch(() => props.messages, scrollToBottom, { deep: true })

defineExpose({ scrollToBottom })
</script>

<style scoped>
.chat-box {
  flex: 1;
  min-height: 360px;
  background: var(--bg-chat);
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.chat-loading,
.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
