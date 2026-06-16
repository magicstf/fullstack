<template>
  <ul class="session-list">
    <li v-if="loading" class="session-hint">加载历史会话...</li>
    <li v-else-if="sessions.length === 0" class="session-hint">暂无会话，点击新建</li>
    <template v-else>
      <SessionItem
        v-for="session in sessions"
        :key="session.id"
        :session="session"
        :active="session.id === activeId"
        :is-open="isSessionSwipedOpen(session.id)"
        :swipe-style="getSwipeStyle(session.id)"
        @click="handleSessionClick(session.id)"
        @delete="handleDelete(session.id)"
        @swipe-start="onSwipeStart($event, session.id)"
        @swipe-move="onSwipeMove($event, session.id)"
        @swipe-end="onSwipeEnd(session.id)"
      />
    </template>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import SessionItem from './SessionItem.vue'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  swipeDisabled: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'delete'])

const disabled = computed(() => props.swipeDisabled)

const {
  isSessionSwipedOpen,
  getSwipeStyle,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  handleSessionClick,
  handleDelete,
  resetSwipe
} = useSwipeDelete({
  disabled,
  onSelect: (id) => emit('select', id),
  onDelete: (id) => emit('delete', id)
})

defineExpose({ resetSwipe })
</script>

<style scoped>
.session-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
}

.session-hint {
  padding: 16px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  cursor: default;
}
</style>
