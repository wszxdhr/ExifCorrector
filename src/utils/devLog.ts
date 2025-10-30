// 开发用日志
export function devLog(...args: any[]) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[devLog]', ...args);
    }
}
export function devError(...args: any[]) {
    if (process.env.NODE_ENV !== 'production') {
        console.error('[devError]', ...args);
    }
}
