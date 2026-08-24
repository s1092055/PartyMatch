import { Router } from 'express'
import prisma from '../lib/prisma.js'
import redis from '../lib/redis.js'

const router = Router()

const SERVICE_LIST_CACHE_KEY = 'services:list'
const SERVICE_LIST_CACHE_TTL_SECONDS = 60

router.get('/', async (req, res, next) => {
  try {
    const cached = await redis.get(SERVICE_LIST_CACHE_KEY).catch(() => null)
    if (cached) {
      res.json(JSON.parse(cached))
      return
    }

    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } })
    redis.setex(SERVICE_LIST_CACHE_KEY, SERVICE_LIST_CACHE_TTL_SECONDS, JSON.stringify(services)).catch(() => {})
    res.json(services)
  } catch (err) { next(err) }
});

router.get('/:id', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!service) return res.status(404).json({ message: '服務不存在' })
    res.json(service)
  } catch (err) { next(err) }
});

export default router
