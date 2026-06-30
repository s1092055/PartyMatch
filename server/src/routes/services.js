import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// GET /services
router.get('/', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } })
    res.json(services)
  } catch (err) { next(err) }
})

// GET /services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!service) return res.status(404).json({ message: '服務不存在' })
    res.json(service)
  } catch (err) { next(err) }
})

export default router
