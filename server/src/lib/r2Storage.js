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
  'application/pdf': 'pdf',
}

// 上傳到 R2，介面刻意跟先前版本一樣（回傳 { url, publicId }），呼叫端不用改。
// data: 'data:<mime>;base64,...'
export async function uploadImage(data, { folder = '' } = {}) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(data)
  if (!match) throw new Error('附件格式錯誤')
  const [, mime, base64] = match

  const ext = EXT_BY_MIME[mime] ?? 'bin'
  const key = folder ? `${folder}/${randomUUID()}.${ext}` : `${randomUUID()}.${ext}`

  await r2.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME,
    Key:         key,
    Body:        Buffer.from(base64, 'base64'),
    ContentType: mime,
  }))

  return { url: `${process.env.R2_PUBLIC_URL}/${key}`, publicId: key }
}
