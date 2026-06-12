import { BASE_URL, DEFAULT_TIMEOUT } from './config.js'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function mergeSignals(signals) {
  const list = signals.filter(Boolean)
  if (list.length === 0) return undefined
  if (list.length === 1) return list[0]
  if (typeof AbortSignal !== 'undefined' && AbortSignal.any) {
    return AbortSignal.any(list)
  }

  const controller = new AbortController()
  for (const signal of list) {
    if (signal.aborted) {
      controller.abort()
      break
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

function buildURL(path) {
  if (/^https?:\/\//i.test(path)) return path
  const base = BASE_URL.replace(/\/$/, '')
  const url = path.startsWith('/') ? path : `/${path}`
  return `${base}${url}`
}

/**
 * 统一 fetch 封装，支持超时与外部 AbortSignal
 * @param {string} path - 接口路径或完整 URL
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object} [options.headers]
 * @param {object|string} [options.body] - 对象会自动 JSON 序列化
 * @param {number} [options.timeout=DEFAULT_TIMEOUT] - 超时毫秒，0 表示不超时
 * @param {AbortSignal} [options.signal] - 外部中止信号
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    signal,
    ...rest
  } = options

  const timeoutController = new AbortController()
  let timer = null

  if (timeout > 0) {
    timer = setTimeout(() => timeoutController.abort(), timeout)
  }

  const mergedSignal = mergeSignals(
    timeout > 0 ? [signal, timeoutController.signal] : [signal]
  )

  const finalHeaders = { ...headers }
  let finalBody = body

  if (body != null && typeof body === 'object' && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] ??= 'application/json'
    finalBody = JSON.stringify(body)
  }

  try {
    const response = await fetch(buildURL(path), {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: mergedSignal,
      ...rest
    })

    if (!response.ok) {
      throw new ApiError(`服务异常 (${response.status})`, response.status)
    }

    return response
  } finally {
    clearTimeout(timer)
  }
}
