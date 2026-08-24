import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { computeSeatCost } from '../utils/pricing.js'
import { admitMemberIntoGroup } from '../utils/membership.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import { maskMemberSensitiveFields, resolveMemberEvidenceUrls, resolveMembersEvidenceUrls } from '../lib/groupPrivacy.js'
import { notify, claimGroupStatus } from './groups/shared.js'
import * as membershipService from '../services/membership.service.js'

const router = Router()

const addMemberSchema = z.object({
  groupId: z.string().min(1),
  userId:  z.string().min(1),
})

const patchMemberSchema = z.object({
  serviceInfo:                 z.any().optional(),
  serviceInfoIssueNote:        z.string().nullable().optional(),
  serviceInfoIssueEvidenceUrl: z.string().nullable().optional(),
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.query
    let where
    if (groupId) {
      const isMember = await prisma.member.findFirst({ where: { groupId, userId: req.user.id } });
      const isHost   = isMember ? null : await prisma.group.findFirst({ where: { id: groupId, hostId: req.user.id } })
      if (!isMember && !isHost) return res.status(403).json({ message: '無權限查看此群組成員' })
      where = { groupId }
    } else {
      where = {
        OR: [
          {
            group: { members: { some: { userId: req.user.id } } }
          },
          {
            group: { hostId: req.user.id }
          },
        ],
      }
    }
    const members = await prisma.member.findMany({
      where,
      include: {
        user:  { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, bio: true } },
        group: { select: { hostId: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
    const masked = members.map(({ group, ...m }) => ({
      ...maskMemberSensitiveFields(m, { isHost: group.hostId === req.user.id, isSelf: m.userId === req.user.id }),
      user: maskAvatar(m.user),
    }));
    res.json(await resolveMembersEvidenceUrls(masked));
  } catch (err) { next(err) }
});

router.post('/', requireAuth, validate(addMemberSchema), async (req, res, next) => {
  try {
    const { groupId, userId } = req.body
    const [group, targetUser] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ])
    if (!group) return res.status(404).json({ message: '群組不存在' })
    if (group.hostId !== req.user.id) return res.status(403).json({ message: '僅團主可操作' })
    if (group.status !== 'recruiting') return res.status(400).json({ message: '群組非招募中，無法手動加入成員' })
    if (!targetUser) return res.status(404).json({ message: '使用者不存在' })

    const seatCost = computeSeatCost(group)

    const member = await prisma.$transaction(tx => admitMemberIntoGroup(tx, {
      groupId,
      userId,
      seatCost,
      maxMembers: group.maxMembers,
      note:       `團主手動加入群組，代管 ${seatCost} PM`,
    }))

    res.status(201).json(member)
  } catch (err) { next(err) }
});

router.patch('/:id', requireAuth, validate(patchMemberSchema), async (req, res, next) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        group: { select: { hostId: true, planName: true, sharedCredentials: true, service: { select: { name: true } } } },
        user:  { select: { name: true } },
      },
    })
    if (!existing) return res.status(404).json({ message: '成員不存在' })

    const isOwner = existing.userId === req.user.id
    const isHost  = existing.group.hostId === req.user.id
    if (!isOwner && !isHost) return res.status(403).json({ message: '無操作權限' })

    const member = await prisma.member.update({
      where: { id: req.params.id },
      data:  req.body,
    })

    const groupLabel = existing.group.planName ?? existing.group.service?.name ?? ''

    let groupAdvancedStatus = null;
    if (req.body.serviceInfo !== undefined) {
      const isSharedCredentials = !!existing.group.sharedCredentials;
      notify({
        userId:  existing.group.hostId,
        type:    'service_info_filled',
        title:   isSharedCredentials ? '成員已提取帳號資訊' : '成員已填寫服務帳號',
        message: isSharedCredentials
          ? `${existing.user?.name ?? '成員'} 已確認取得「${groupLabel}」群組的帳號資訊。`
          : `${existing.user?.name ?? '成員'} 已填寫「${groupLabel}」群組的服務帳號資訊。`,
        meta:    { groupId: existing.groupId },
      })

      if (isSharedCredentials) {
        prisma.credentialComment.create({
          data: {
            groupId:  existing.groupId,
            authorId: existing.userId,
            content:  '已成功提取帳號資訊',
          },
        }).catch(console.error)
      }

      const allMembers = await prisma.member.findMany({ where: { groupId: existing.groupId } })
      const allFilled  = allMembers.every(m => m.serviceInfo != null)
      if (allFilled) {
        try {
          await prisma.$transaction(tx => claimGroupStatus(tx, existing.groupId, {
            fromStatus: 'pending_confirmation',
            data:       { status: 'pending_activation' },
          }))
          groupAdvancedStatus = 'pending_activation'

          notify({
            userId:  existing.group.hostId,
            type:    'all_service_info_filled',
            title:   isSharedCredentials ? '成員已全部完成提取' : '成員已全部完成填寫',
            message: `「${groupLabel}」群組所有成員都已${isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'}，可以前往啟用服務了。`,
            meta:    { groupId: existing.groupId },
          });
        } catch (err) {
          // 幾乎同時送出的最後兩位成員都可能讀到「全員已填」，另一個請求已經搶先推進過狀態，這裡略過即可
          if (err.statusCode !== 409) throw err
        }
      }
    }

    if (isHost && req.body.serviceInfoIssueNote) {
      notify({
        userId:  existing.userId,
        type:    'service_info_issue',
        title:   '服務帳號需要修正',
        message: `團主在「${groupLabel}」發現服務帳號問題，請前往修正。`,
        meta:    { groupId: existing.groupId },
      })
    }

    const resolvedMember = await resolveMemberEvidenceUrls(member);
    res.json(groupAdvancedStatus ? { ...resolvedMember, _groupAdvanced: groupAdvancedStatus } : resolvedMember)
  } catch (err) { next(err) }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await membershipService.removeMember({ memberId: req.params.id, actorId: req.user.id })
    res.status(200).json(result)
  } catch (err) { next(err) }
});

export default router
