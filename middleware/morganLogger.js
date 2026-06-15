import morgan from 'morgan'

/** 自定义格式：IP | 方法 | 接口 | 状态码 | 耗时 */
const format =
  ':remote-addr :method :url :status :response-time ms'

export const morganLogger = morgan(format)
