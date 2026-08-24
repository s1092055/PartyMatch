import { Router } from 'express'
import statsRoutes from './stats.js'
import disputeRoutes from './disputes.js'

const router = Router()

router.use('/', statsRoutes)
router.use('/disputes', disputeRoutes)

export default router
