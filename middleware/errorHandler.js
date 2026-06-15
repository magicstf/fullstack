/**
 * 业务异常，携带 HTTP 状态码
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

/**
 * 包装异步路由，将异常转发给全局 errorHandler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/** 404 - 未匹配路由 */
export function notFoundHandler(req, res, next) {
  next(new AppError(`接口不存在: ${req.method} ${req.originalUrl}`, 404))
}

/**
 * 全局异常处理（须注册在所有路由之后）
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.statusCode || err.status || 500
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message || '服务器内部错误'

  console.error(
    `[error] ${req.method} ${req.originalUrl} ${statusCode} - ${err.message}`
  )
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
}
