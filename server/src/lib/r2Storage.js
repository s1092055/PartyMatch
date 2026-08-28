import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const SIGNED_URL_EXPIRES_SECONDS = 15 * 60

const EXT_BY_MIME = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/gif':  'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

export const ALLOWED_MIME_TYPES = Object.keys(EXT_BY_MIME);
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadImage(buffer, mime, { folder = '' } = {}) {
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    const err = new Error('僅支援圖片格式（PNG／JPG／GIF／WEBP／HEIC）')
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

  return { key, url: await getSignedDownloadUrl(key) }
}

export async function getSignedDownloadUrl(key, { expiresInSeconds = SIGNED_URL_EXPIRES_SECONDS } = {}) {
  if (!key) return null
  if (/^https?:\/\//.test(key)) return key
  const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}
