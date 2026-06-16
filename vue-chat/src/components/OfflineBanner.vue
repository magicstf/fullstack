<template>
  <div v-if="!isOnline" class="offline-banner">网络已断开，请检查连接后重试</div>
</template>

<script setup>
defineProps({
  isOnline: { type: Boolean, default: true }
})
</script>

<style scoped>
.offline-banner {
  padding: 8px 14px;
  background: var(--offline-bg);
  color: var(--offline-text);
  border-bottom: 1px solid var(--offline-border);
  font-size: 13px;
  text-align: center;
}
</style>
