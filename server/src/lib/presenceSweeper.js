import prisma from './prisma.js'

const SWEEP_INTERVAL_MS = 20_000;
const OFFLINE_THRESHOLD_MS = 40_000;

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
