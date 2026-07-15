import { Router } from 'express'
import { uploadImage } from '../lib/cloudinary.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /upload/payment-proof
// body: { data: 'data:image/...;base64,...' }
router.post('/payment-proof', requireAuth, async (req, res, next) => {
  try {
    const { data } = req.body
    if (!data) return res.status(400).json({ message: '缺少圖片資料' })

    const result = await uploadImage(data, {
      folder: 'partymatch/payment-proofs',
      resourceType: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })

    res.json(result)
  } catch (err) { next(err) }
})

// POST /upload/dispute-evidence
// body: { data: 'data:<mime>;base64,...' }（圖片或一般檔案皆可）
router.post('/dispute-evidence', requireAuth, async (req, res, next) => {
  try {
    const { data } = req.body
    if (!data) return res.status(400).json({ message: '缺少附件資料' })

    const result = await uploadImage(data, {
      folder: 'partymatch/dispute-evidence',
      resourceType: 'auto',
    })

    res.json(result)
  } catch (err) { next(err) }
})

export default router
