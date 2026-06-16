<template>
  <div class="session-header">
    <span class="session-title">会话列表</span>
    <button class="btn-new" :disabled="disabled" @click="$emit('create')">新建</button>
  </div>
</template>

<script setup>
defineProps({
  disabled: { type: Boolean, default: false }
})

defineEmits(['create'])
</script>

<style scoped>
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

.btn-new:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
