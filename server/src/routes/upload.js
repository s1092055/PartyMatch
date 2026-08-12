import { Router } from 'express'
import { uploadImage } from '../lib/r2Storage.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimit.js'

const router = Router()

// 「附件」類上傳共用同一套邏輯（圖片或一般檔案皆可），差別只在存放的資料夾——
// 申訴附件跟團主回報帳號問題的附件本質上是同一種東西；每次上傳都會真的產生 R2
// storage/bandwidth 成本，加 uploadLimiter 擋濫用
function registerEvidenceUploadRoute(path, folder) {
  router.post(path, uploadLimiter, requireAuth, async (req, res, next) => {
    try {
      const { data } = req.body
      if (!data) return res.status(400).json({ message: '缺少附件資料' })

      const result = await uploadImage(data, { folder })
      res.json(result)
    } catch (err) { next(err) }
  })
}

// POST /upload/dispute-evidence — body: { data: 'data:<mime>;base64,...' }
registerEvidenceUploadRoute('/dispute-evidence', 'partymatch/dispute-evidence')
// POST /upload/service-issue-evidence — 團主回報成員帳號問題時的附件
registerEvidenceUploadRoute('/service-issue-evidence', 'partymatch/service-issue-evidence')
// POST /upload/credential-comment-attachment — 帳號資訊留言區的附件
registerEvidenceUploadRoute('/credential-comment-attachment', 'partymatch/credential-comment-attachments')
// POST /upload/message-attachment — 聊天室訊息的附件
registerEvidenceUploadRoute('/message-attachment', 'partymatch/message-attachments')

export default router
