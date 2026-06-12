/**
 * 简单请求日志：记录方法、路径、状态码、耗时、客户端 IP
 */
export function requestLogger(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const time = new Date().toISOString()
    const ip = req.ip || req.socket?.remoteAddress || '-'
    console.log(
      `[${time}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ip=${ip}`
    )
  })

  next()
}
