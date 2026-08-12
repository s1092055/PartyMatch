import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import { getSignedDownloadUrl } from '../lib/r2Storage.js'

const router = Router()

const createCommentSchema = z.object({
  groupId: z.string().min(1),
  content: z.string().trim().max(500).default(''),
  // 存的其實是 R2 物件 key（見 r2Storage.js），不是完整網址，讀取時才即時簽短效網址
  attachmentUrl: z.string().min(1).optional(),
}).refine(data => data.content.length > 0 || !!data.attachmentUrl, {
  message: '留言內容或附件至少需要一項',
})

async function assertGroupAccess(groupId, userId) {
  const [isMember, isHost] = await Promise.all([
    prisma.member.findFirst({ where: { groupId, userId } }),
    prisma.group.findFirst({ where: { id: groupId, hostId: userId } }),
  ])
  return !!isMember || !!isHost
}

// GET /credential-comments/:groupId — 「帳號資訊」分頁底下的留言串，團主與該群組所有成員都看得到
router.get('/:groupId', requireAuth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    if (!(await assertGroupAccess(groupId, req.user.id))) {
      return res.status(403).json({ message: '無權限查看此群組的留言' })
    }
    const comments = await prisma.credentialComment.findMany({
      where:   { groupId },
      include: { author: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true } } },
      orderBy: { createdAt: 'asc' },
    })
    // attachmentUrl 存的是 R2 key（見 r2Storage.js），這裡即時簽一個短效網址給前端顯示
    const resolved = await Promise.all(comments.map(async c => ({
      ...c,
      author: maskAvatar(c.author),
      ...(c.attachmentUrl && { attachmentUrl: await getSignedDownloadUrl(c.attachmentUrl) }),
    })))
    res.json(resolved)
  } catch (err) { next(err) }
})

// POST /credential-comments — 留言，僅團主或該群組成員可操作
router.post('/', requireAuth, validate(createCommentSchema), async (req, res, next) => {
  try {
    const { groupId, content, attachmentUrl } = req.body
    if (!(await assertGroupAccess(groupId, req.user.id))) {
      return res.status(403).json({ message: '無權限在此群組留言' })
    }
    const comment = await prisma.credentialComment.create({
      data:    { groupId, authorId: req.user.id, content, ...(attachmentUrl && { attachmentUrl }) },
      include: { author: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true } } },
    })
    res.status(201).json({
      ...comment,
      author: maskAvatar(comment.author),
      ...(comment.attachmentUrl && { attachmentUrl: await getSignedDownloadUrl(comment.attachmentUrl) }),
    })
  } catch (err) { next(err) }
})

export default router
