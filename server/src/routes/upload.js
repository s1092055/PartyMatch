import { Router } from 'express'
import cloudinary from '../lib/cloudinary.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /upload/payment-proof
// body: { data: 'data:image/...;base64,...' }
router.post('/payment-proof', requireAuth, async (req, res, next) => {
  try {
    const { data } = req.body
    if (!data) return res.status(400).json({ message: '缺少圖片資料' })

    const result = await cloudinary.uploader.upload(data, {
      folder: 'partymatch/payment-proofs',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })

    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err) { next(err) }
})

export default router
