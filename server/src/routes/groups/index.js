import { Router } from 'express'
import crudRoutes from './crud.js'
import lifecycleRoutes from './lifecycle.js'

const router = Router()

router.use('/', crudRoutes)
router.use('/', lifecycleRoutes)

export default router
