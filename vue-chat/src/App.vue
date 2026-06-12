<template>
  <div class="chat-container">
    <!-- 对话容器，使用 ref 直接操作原生 DOM -->
    <div ref="chatBox" class="chat-box"></div>

    <div class="input-area">
      <input
        v-model="inputText"
        @keyup.enter="handleSend"
        placeholder="请输入问题..."
        class="input"
        :disabled="loading"
      />
      <button @click="handleSend" class="send-btn" :disabled="loading">
        {{ loading ? "请求中..." : "发送" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const inputText = ref('')
const chatBox = ref(null)
const loading = ref(false)
let buffer = ''
// 全局保存对话上下文（用于传给后端）
let messages = [
  { role: 'system', content: '你是简洁友好的AI助手' }
]

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  loading.value = true
  buffer = ''
  inputText.value = ''

  // 1. 渲染用户消息（原生DOM）
  const userDom = document.createElement('div')
  userDom.className = 'chat-item user'
  userDom.innerHTML = `<span class="label">你：</span><span class="content">${text}</span>`
  chatBox.value.appendChild(userDom)
  chatBox.value.scrollTop = chatBox.value.scrollHeight

  // 记录上下文
  messages.push({ role: 'user', content: text })

  // 2. 创建AI消息容器（流式追加内容）
  const aiDom = document.createElement('div')
  aiDom.className = 'chat-item assistant'
  aiDom.innerHTML = `<span class="label">AI：</span><span class="content"></span>`
  chatBox.value.appendChild(aiDom)
  const aiContent = aiDom.querySelector('.content')

  try {
    const response = await fetch('http://localhost:3000/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { stream: true })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value)
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() || ''

      for (const chunk of chunks) {
        if (!chunk.startsWith('data: ')) continue
        const jsonStr = chunk.slice(6)
        try {
          const data = JSON.parse(jsonStr)
          if (data.done) {
            loading.value = false
            // 结束后把完整回答存入上下文
            messages.push({ role: 'assistant', content: aiContent.innerText })
            return
          }
          if (data.text) {
            // 🔴 直接操作原生DOM，不受Vue任何更新策略影响
            aiContent.innerText += data.text
            // 自动滚动
            chatBox.value.scrollTop = chatBox.value.scrollHeight
          }
        } catch (parseErr) {
          continue
        }
      }
    }
  } catch (err) {
    aiContent.innerText = '请求出错，请稍后重试'
    loading.value = false
    console.error('请求异常：', err)
  }
}
</script>

<style scoped>
.chat-container {
  width: 620px;
  margin: 30px auto;
  font-family: sans-serif;
}
.chat-box {
  height: 420px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto;
  margin-bottom: 15px;
  border-radius: 6px;
}
.chat-item {
  margin: 8px 0;
  line-height: 1.6;
}
.user {
  color: #1976d2;
}
.assistant {
  color: #388e3c;
}
.label {
  font-weight: bold;
}
.input-area {
  display: flex;
  gap: 8px;
}
.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
}
.send-btn {
  padding: 8px 20px;
  border: none;
  background: #1976d2;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.send-btn:hover {
  background: #1565c0;
}
button:disabled, input:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>