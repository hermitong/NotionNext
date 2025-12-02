/**
 * Notion API 错误处理和重试逻辑
 * 用于防止 5xx 错误和 API 调用失败
 */

/**
 * 带重试的 Notion API 调用包装器
 * @param {Function} apiCall - API 调用函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} retryDelay - 重试延迟（毫秒）
 * @returns {Promise} API 响应或降级数据
 */
export async function withRetry(apiCall, maxRetries = 3, retryDelay = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall()
      return result
    } catch (error) {
      lastError = error
      const errorMessage = error?.message ||error?.toString() || '未知错误'
      
      console.error(
        `[Notion API] 尝试 ${attempt}/${maxRetries} 失败:`,
        errorMessage
      )

      // 检查是否是速率限制错误
      if (
        error?.code === 'rate_limited' ||
        error?.status === 429 ||
        errorMessage.includes('rate_limited')
      ) {
        console.log(`[Notion API] 遇到速率限制，等待 ${retryDelay * attempt}ms 后重试...`)
        await sleep(retryDelay * attempt) // 指数退避
        continue
      }

      // 检查是否是超时错误
      if (
        error?.code === 'ETIMEDOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT')
      ) {
        console.log(`[Notion API] 请求超时，等待 ${retryDelay}ms 后重试...`)
        await sleep(retryDelay)
        continue
      }

      // 检查是否是网络错误
      if (
        error?.code === 'ECONNRESET' ||
        error?.code === 'ENOTFOUND' ||
        errorMessage.includes('network') ||
        errorMessage.includes('connect')
      ) {
        console.log(`[Notion API] 网络错误，等待 ${retryDelay}ms 后重试...`)
        await sleep(retryDelay)
        continue
      }

      // 检查是否是服务器错误 (5xx)
      if (error?.status >= 500 && error?.status < 600) {
        console.log(`[Notion API] 服务器错误 ${error.status}，等待 ${retryDelay * attempt}ms 后重试...`)
        await sleep(retryDelay * attempt)
        continue
      }

      // 其他错误不重试
      console.error(`[Notion API] 不可重试的错误:`, errorMessage)
      break
    }
  }

  // 所有重试都失败，返回降级数据或抛出错误
  console.error(
    `[Notion API] 在 ${maxRetries} 次尝试后仍然失败，返回降级数据`
  )
  
  // 不抛出错误，而是返回 null 让调用者处理
  return null
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 安全的 Notion 数据获取
 * 如果 API 调用失败，返回降级数据而不是抛出错误
 * @param {Function} fetchFunction - 数据获取函数
 * @param {Object} fallbackData - 降级数据
 * @returns {Promise} 数据或降级数据
 */
export async function safeNotionFetch(fetchFunction, fallbackData = null) {
  try {
    const data = await withRetry(fetchFunction)
    
    if (data === null) {
      console.warn('[Notion API] 使用降级数据')
      return fallbackData
    }
    
    return data
  } catch (error) {
    console.error('[Notion API] 捕获到未处理的错误:', error)
    return fallbackData
  }
}

/**
 * 带超时的 Promise 包装器
 * @param {Promise} promise - 需要包装的 Promise
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise}
 */
export async function withTimeout(promise, timeout = 10000) {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`操作超时 (${timeout}ms)`))
    }, timeout)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * 批量请求限流器
 * 防止同时发起过多 Notion API 请求导致速率限制
 */
export class RateLimiter {
  constructor(maxConcurrent = 3, minInterval = 100) {
    this.maxConcurrent = maxConcurrent
    this.minInterval = minInterval
    this.queue = []
    this.running = 0
    this.lastRequestTime = 0
  }

  async execute(fn) {
    // 等待队列中的前置任务
    while (this.running >= this.maxConcurrent) {
      await sleep(50)
    }

    // 确保请求间隔
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minInterval) {
      await sleep(this.minInterval - timeSinceLastRequest)
    }

    this.running++
    this.lastRequestTime = Date.now()

    try {
      const result = await fn()
      return result
    } finally {
      this.running--
    }
  }
}

// 创建全局限流器实例
export const notionRateLimiter = new RateLimiter(3, 100)

/**
 * 错误日志记录
 * 用于追踪和调试 Notion API 问题
 */
export function logNotionError(context, error, additionalInfo = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error?.message || error?.toString(),
      code: error?.code,
      status: error?.status,
      stack: error?.stack
    },
    ...additionalInfo
  }

  // 在开发环境输出详细日志
  if (process.env.NODE_ENV === 'development') {
    console.error('[Notion Error]', JSON.stringify(errorLog, null, 2))
  } else {
    // 在生产环境只输出关键信息
    console.error(
      `[Notion Error] ${context}:`,
      error?.message || error?.toString()
    )
  }

  // 可以在这里添加错误监控服务集成
  // 例如 Sentry, LogRocket 等
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: errorLog })
  // }

  return errorLog
}
