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
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const todayStart = startOfToday()

    const [
      totalUsers,
      newUsersToday,
      hostIds,
      groupsByStatus,
      newGroupsToday,
      overdueDisputes,
      escrowAgg,
      newApplicationsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.group.findMany({ distinct: ['hostId'], select: { hostId: true } }),
      prisma.group.groupBy({ by: ['status'], _count: true }),
      prisma.group.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.group.count({ where: { status: 'disputed', disputeDeadline: { lte: new Date() } } }),
      prisma.group.aggregate({ _sum: { escrowTokens: true } }),
      prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
    ])

    const groupStatusCounts = Object.fromEntries(groupsByStatus.map(g => [g.status, g._count]))
    const totalGroups = groupsByStatus.reduce((sum, g) => sum + g._count, 0)
    const pendingDisputes = groupStatusCounts.disputed ?? 0

    res.json({
      totalUsers,
      newUsersToday,
      totalHosts: hostIds.length,
      totalGroups,
      groupStatusCounts,
      newGroupsToday,
      pendingDisputes,
      overdueDisputes,
      totalEscrowTokens: escrowAgg._sum.escrowTokens ?? 0,
      newApplicationsToday,
    })
  } catch (err) { next(err) }
})

export default router
