import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// GET /admin/stats — 管理員 Dashboard 的平台概覽數據
// 群組相關的統計（狀態分佈、團主數、今日新增、逾期申訴、代管總額）全部從同一次 findMany
// 在記憶體裡算出來，不用為每個指標各打一次 DB；只有跨資料表的 User／Application 才需要另外查
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const todayStart = startOfToday()
    const now = new Date()

    const [totalUsers, newUsersToday, groups, newApplicationsToday] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.group.findMany({ select: { hostId: true, status: true, createdAt: true, disputeDeadline: true, escrowTokens: true } }),
      prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
    ])

    const groupStatusCounts = {}
    let newGroupsToday = 0
    let overdueDisputes = 0
    let totalEscrowTokens = 0
    const hostIds = new Set()
    for (const g of groups) {
      groupStatusCounts[g.status] = (groupStatusCounts[g.status] ?? 0) + 1
      if (g.createdAt >= todayStart) newGroupsToday += 1
      if (g.status === 'disputed' && g.disputeDeadline && g.disputeDeadline <= now) overdueDisputes += 1
      totalEscrowTokens += g.escrowTokens
      hostIds.add(g.hostId)
    }

    res.json({
      totalUsers,
      newUsersToday,
      totalHosts: hostIds.size,
      totalGroups: groups.length,
      groupStatusCounts,
      newGroupsToday,
      pendingDisputes: groupStatusCounts.disputed ?? 0,
      overdueDisputes,
      totalEscrowTokens,
      newApplicationsToday,
    })
  } catch (err) { next(err) }
})

export default router
