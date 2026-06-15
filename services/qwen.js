import OpenAI from 'openai'
import config from '../config/index.js'
import { AppError } from '../middleware/errorHandler.js'

let client = null

function getClient() {
  if (!client) {
    if (!config.qwen.apiKey) {
      throw new AppError('未配置 DASHSCOPE_API_KEY', 500)
    }
    client = new OpenAI({
      apiKey: config.qwen.apiKey,
      baseURL: config.qwen.baseURL,
      timeout: config.qwen.timeout
    })
  }
  return client
}

/**
 * 流式对话，逐块产出文本
 * @param {Array<{role: string, content: string}>} messages
 * @returns {AsyncGenerator<string>}
 */
export async function* streamChat(messages) {
  const stream = await getClient().chat.completions.create({
    model: config.qwen.model,
    messages,
    stream: true,
    enable_thinking: config.qwen.enableThinking
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || ''
    if (text) yield text
  }
}
