<template>
  <div class="input-area">
    <div class="input-wrap">
      <textarea
        ref="inputRef"
        :value="modelValue"
        placeholder="请输入问题，Shift+Enter 换行"
        class="input"
        :disabled="loading"
        rows="2"
        @input="onInput"
        @paste="onPaste"
        @keydown.enter.exact.prevent="$emit('send')"
      />
      <div class="input-meta">
        <span :class="['char-count', { warn: isNearLimit, limit: isAtLimit }]">
          {{ inputLength }}/{{ maxLength }}
        </span>
      </div>
    </div>
    <div class="action-btns">
      <button v-if="loading" class="btn-stop" @click="$emit('stop')">停止生成</button>
      <button
        v-else
        class="send-btn"
        :disabled="!modelValue.trim() || !isOnline || isAtLimit"
        @click="$emit('send')"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { MAX_INPUT_LENGTH } from '../../constants/chat.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true },
  maxLength: { type: Number, default: MAX_INPUT_LENGTH }
})

const emit = defineEmits(['update:modelValue', 'send', 'stop'])

const inputRef = ref(null)

const inputLength = computed(() => props.modelValue.length)
const isNearLimit = computed(() => inputLength.value >= props.maxLength * 0.9)
const isAtLimit = computed(() => inputLength.value >= props.maxLength)

function clampInput(value) {
  return value.length > props.maxLength ? value.slice(0, props.maxLength) : value
}

function normalizePastedText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function onInput(e) {
  emit('update:modelValue', clampInput(e.target.value))
}

function insertTextAtCursor(text) {
  const el = inputRef.value
  const current = props.modelValue
  if (!el) {
    emit('update:modelValue', clampInput(current + text))
    return
  }
  const start = el.selectionStart ?? current.length
  const end = el.selectionEnd ?? start
  const merged = current.slice(0, start) + text + current.slice(end)
  emit('update:modelValue', clampInput(merged))
  const cursor = Math.min(start + text.length, props.maxLength)
  nextTick(() => {
    el.selectionStart = cursor
    el.selectionEnd = cursor
    el.focus()
  })
}

function onPaste(e) {
  e.preventDefault()
  const pasted = e.clipboardData?.getData('text/plain')
  if (!pasted) return
  const normalized = normalizePastedText(pasted)
  if (!normalized) return
  insertTextAtCursor(normalized)
}
</script>

<style scoped>
.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.input-wrap {
  flex: 1;
  min-width: 0;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
  background: var(--bg-input);
  color: var(--text-primary);
}

.input:focus {
  border-color: var(--accent);
}

.input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.input-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.char-count.warn {
  color: #e6a23c;
}

.char-count.limit {
  color: #f56c6c;
}

.action-btns {
  flex-shrink: 0;
}

.send-btn {
  padding: 10px 22px;
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-stop {
  padding: 10px 16px;
  border: 1px solid #e6a23c;
  background: var(--bg-input);
  color: #e6a23c;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.btn-stop:hover {
  background: color-mix(in srgb, #e6a23c 12%, var(--bg-input));
}

.send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
