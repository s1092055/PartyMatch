import { Router } from 'express'
import multer from 'multer'
import { uploadImage, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/r2Storage.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimit.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error('僅支援圖片格式（PNG／JPG／GIF／WEBP／HEIC）')
      err.status = 400
      return cb(err)
    }
    cb(null, true)
  },
})

function registerEvidenceUploadRoute(path, folder) {
  router.post(path, uploadLimiter, requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: '缺少附件資料' })

      const result = await uploadImage(req.file.buffer, req.file.mimetype, { folder })
      res.json(result)
    } catch (err) { next(err) }
  })
}

registerEvidenceUploadRoute('/dispute-evidence', 'partymatch/dispute-evidence');
registerEvidenceUploadRoute('/service-issue-evidence', 'partymatch/service-issue-evidence');
registerEvidenceUploadRoute('/credential-comment-attachment', 'partymatch/credential-comment-attachments');
registerEvidenceUploadRoute('/message-attachment', 'partymatch/message-attachments');
registerEvidenceUploadRoute('/platform-report-evidence', 'partymatch/platform-report-evidence');

export default router
