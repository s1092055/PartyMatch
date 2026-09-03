import prisma from './prisma.js'

const SWEEP_INTERVAL_MS = 20_000
// 前端心跳每 15 秒送一次，抓 40 秒門檻是允許漏掉一次心跳（網路延遲、分頁被
// 瀏覽器節流等）還不會被誤判離線，真的斷線/被強制關閉才會在下一輪掃描時翻成離線
const OFFLINE_THRESHOLD_MS = 40_000

export function startPresenceSweep() {
  setInterval(async () => {
    try {
      await prisma.user.updateMany({
        where: {
          presenceStatus: 'online',
          lastActiveAt:   { lt: new Date(Date.now() - OFFLINE_THRESHOLD_MS) },
        },
        data: { presenceStatus: 'offline' },
      })
    } catch (err) {
      console.error('[Presence] 自動離線掃描失敗', err)
    }
  }, SWEEP_INTERVAL_MS)
}
