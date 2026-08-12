import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

// Cloudflare R2 是 S3 相容的物件儲存服務，用 AWS SDK 的 S3 client 就能操作
const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const EXT_BY_MIME = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/gif':  'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

// 目前所有呼叫端（申訴附件、團主回報帳號問題附件、帳號資訊留言附件、聊天訊息附件，
// 見 upload.js 的 registerEvidenceUploadRoute）都是截圖/圖片佐證，只收圖片格式，
// 不開放任意文件；MAX_FILE_SIZE_BYTES 用解碼後的實際 buffer 長度判斷，不能只信任
// 前端回報的 file.size（可以被竄改），這裡才是真正擋得住的那一關
const ALLOWED_MIME_TYPES = Object.keys(EXT_BY_MIME)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// 上傳到 R2，介面刻意跟先前版本一樣（回傳 { url, publicId }），呼叫端不用改。
// data: 'data:<mime>;base64,...'
export async function uploadImage(data, { folder = '' } = {}) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(data)
  if (!match) throw new Error('附件格式錯誤')
  const [, mime, base64] = match

  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    const err = new Error('僅支援圖片格式（PNG／JPG／GIF／WEBP／HEIC）')
    err.status = 400
    throw err
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const err = new Error('附件檔案大小不能超過 5MB')
    err.status = 400
    throw err
  }

  const ext = EXT_BY_MIME[mime]
  const key = folder ? `${folder}/${randomUUID()}.${ext}` : `${randomUUID()}.${ext}`

  await r2.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME,
    Key:         key,
    Body:        buffer,
    ContentType: mime,
  }))

  return { url: `${process.env.R2_PUBLIC_URL}/${key}`, publicId: key }
}
