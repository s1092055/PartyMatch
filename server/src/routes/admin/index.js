import { Router } from 'express'
import statsRoutes from './stats.js'
import disputeRoutes from './disputes.js'
import platformReportRoutes from './platformReports.js'

const router = Router()

router.use('/', statsRoutes)
router.use('/disputes', disputeRoutes)
router.use('/platform-reports', platformReportRoutes)

export default router
