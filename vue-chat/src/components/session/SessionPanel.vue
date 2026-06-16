<template>
  <aside class="session-panel">
    <SessionHeader :disabled="chatLoading" @create="$emit('create')" />
    <SessionList
      ref="listRef"
      :sessions="sessions"
      :active-id="activeId"
      :loading="sessionsLoading"
      :swipe-disabled="chatLoading"
      @select="$emit('select', $event)"
      @delete="$emit('delete', $event)"
    />
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import SessionHeader from './SessionHeader.vue'
import SessionList from './SessionList.vue'

defineProps({
  sessions: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
  sessionsLoading: { type: Boolean, default: false },
  chatLoading: { type: Boolean, default: false }
})

defineEmits(['create', 'select', 'delete'])

const listRef = ref(null)

function resetSwipe() {
  listRef.value?.resetSwipe?.()
}

defineExpose({ resetSwipe })
</script>

<style scoped>
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
</style>
