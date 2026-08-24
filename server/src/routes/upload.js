import { Router } from 'express'
import { uploadImage } from '../lib/r2Storage.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimit.js'

const router = Router()

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

registerEvidenceUploadRoute('/dispute-evidence', 'partymatch/dispute-evidence');
registerEvidenceUploadRoute('/service-issue-evidence', 'partymatch/service-issue-evidence');
registerEvidenceUploadRoute('/credential-comment-attachment', 'partymatch/credential-comment-attachments');
registerEvidenceUploadRoute('/message-attachment', 'partymatch/message-attachments');

export default router
