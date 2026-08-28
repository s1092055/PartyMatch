import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { requireAdmin } from '../../middleware/auth.js'

const router = Router()

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const todayStart = startOfToday()
    const now = new Date()

    const [totalUsers, newUsersToday, groups, newApplicationsToday, overdueDisputes] = await Promise.all([
      prisma.user.count({ where: { isSystem: false } }),
      prisma.user.count({ where: { isSystem: false, createdAt: { gte: todayStart } } }),
      prisma.group.findMany({ select: { hostId: true, status: true, createdAt: true, escrowTokens: true } }),
      prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
      // 每位成員的申訴各自獨立、各有自己的期限，逾期與否要看單筆 Dispute 而不是整個群組
      prisma.dispute.count({ where: { status: 'pending', deadline: { lte: now } } }),
    ])

    const groupStatusCounts = {}
    let newGroupsToday = 0
    let totalEscrowTokens = 0
    const hostIds = new Set()
    for (const g of groups) {
      groupStatusCounts[g.status] = (groupStatusCounts[g.status] ?? 0) + 1
      if (g.createdAt >= todayStart) newGroupsToday += 1
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
});

export default router
