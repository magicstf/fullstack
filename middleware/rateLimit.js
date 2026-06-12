/**
 * 基于 IP 的内存滑动窗口限流（防刷）
 */

const store = new Map()

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

function cleanupExpired() {
  const now = Date.now()
  for (const [ip, record] of store) {
    if (now > record.resetAt) store.delete(ip)
  }
}

// 定期清理过期记录，避免内存泄漏
setInterval(cleanupExpired, 5 * 60 * 1000).unref()

/**
 * @param {object} options
 * @param {number} [options.windowMs=60000] - 时间窗口（毫秒）
 * @param {number} [options.max=20] - 窗口内最大请求数
 * @param {string} [options.message] - 超限提示
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60_000,
    max = 20,
    message = '请求过于频繁，请稍后再试'
  } = options

  return (req, res, next) => {
    const ip = getClientIp(req)
    const now = Date.now()

    let record = store.get(ip)
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs }
      store.set(ip, record)
    }

    record.count += 1

    const remaining = Math.max(0, max - record.count)
    const resetSec = Math.ceil((record.resetAt - now) / 1000)

    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    res.setHeader('X-RateLimit-Reset', String(resetSec))

    if (record.count > max) {
      res.setHeader('Retry-After', String(resetSec))
      console.warn(`[rate-limit] ip=${ip} exceeded ${max}/${windowMs}ms on ${req.originalUrl}`)
      return res.status(429).json({ error: message })
    }

    next()
  }
}
