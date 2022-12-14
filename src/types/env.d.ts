/**
 * 环境process下全局类型定义
 */

declare namespace NodeJS {
    interface ProcessEnv {
        readonly MODE: "production" | 'development'
        readonly APP_PORT?: string
        readonly REDIS_HOST?: string
        readonly REDIS_PORT?: string
    }
}
