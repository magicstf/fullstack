<template>
  <li :class="['session-swipe-item', { 'is-open': isOpen }]">
    <button
      class="session-delete-btn"
      type="button"
      aria-label="删除会话"
      @click.stop="$emit('delete')"
    >
      删除
    </button>
    <div
      :class="['session-item', { active }]"
      :style="swipeStyle"
      @click="$emit('click')"
      @touchstart.passive="$emit('swipe-start', $event)"
      @touchmove="$emit('swipe-move', $event)"
      @touchend="$emit('swipe-end')"
      @mousedown="$emit('swipe-start', $event)"
    >
      <span class="session-name">{{ session.title }}</span>
      <span class="session-meta">
        <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
        <span v-if="session.messageCount" class="session-count">{{ session.messageCount }}条</span>
      </span>
    </div>
  </li>
</template>

<script setup>
import { formatTime } from '../../utils/formatTime.js'

defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false },
  swipeStyle: { type: Object, default: () => ({}) }
})

defineEmits(['click', 'delete', 'swipe-start', 'swipe-move', 'swipe-end'])
</script>

<style scoped>
.session-swipe-item {
  position: relative;
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.session-delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 72px;
  border: none;
  background: #f56c6c;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.session-swipe-item.is-open .session-delete-btn {
  opacity: 1;
  pointer-events: auto;
}

.session-delete-btn:hover {
  background: #e53935;
}

.session-item {
  position: relative;
  z-index: 1;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: var(--bg-panel);
  touch-action: pan-y;
  user-select: none;
}

.session-item:hover {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-panel));
}

.session-item.active {
  background: color-mix(in srgb, var(--accent) 18%, var(--bg-panel));
}

.session-name {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 2px;
}

.session-time,
.session-count {
  font-size: 11px;
  color: var(--text-secondary);
}

.session-count {
  flex-shrink: 0;
}
</style>
