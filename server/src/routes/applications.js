import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { maskAvatar } from '../lib/avatarVisibility.js'
import * as applicationLifecycleService from '../services/applicationLifecycle.service.js'

const router = Router()

const applySchema = z.object({
  groupId: z.string().min(1),
  message: z.string().max(300).optional(),
})

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'removed']),
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        OR: [
          {
            userId: req.user.id
          },
          {
            group: { hostId: req.user.id }
          },
        ],
      },
      include: {
        user:  { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true } },
        group: { select: { id: true, hostId: true, planName: true, serviceId: true, service: { select: { id: true, name: true } }, host: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(applications.map(app => ({ ...app, user: maskAvatar(app.user) })))
  } catch (err) { next(err) }
});

router.post('/', requireAuth, validate(applySchema), async (req, res, next) => {
  try {
    const application = await applicationLifecycleService.submitApplication({
      groupId: req.body.groupId,
      message: req.body.message,
      userId:  req.user.id,
    })
    res.status(201).json(application)
  } catch (err) { next(err) }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const updated = await applicationLifecycleService.cancelApplication({ applicationId: req.params.id, userId: req.user.id })
    res.json(updated)
  } catch (err) { next(err) }
});

router.patch('/:id', requireAuth, validate(reviewSchema), async (req, res, next) => {
  try {
    const updated = await applicationLifecycleService.reviewApplication({
      applicationId: req.params.id,
      hostId:        req.user.id,
      status:        req.body.status,
    })
    res.json(updated)
  } catch (err) { next(err) }
});

export default router
