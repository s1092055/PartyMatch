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

// multer 的 file.mimetype 是使用者端在表單欄位自行宣告的值，不可信任；
// 這裡改用檔案二進位開頭的 magic bytes 判斷真實格式，防止把惡意檔案改標成 image/png 之類的方式繞過型別限制
function detectImageMime(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg'
  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a'))
    return 'image/gif'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP')
    return 'image/webp'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp')
    return 'image/heic'
  return null
}

export async function uploadImage(buffer, mime, { folder = '' } = {}) {
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    const err = new Error('僅支援圖片格式（PNG／JPG／GIF／WEBP／HEIC）')
    err.status = 400
    throw err
  }

  const detectedMime = detectImageMime(buffer)
  if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
    const err = new Error('檔案內容與宣告的圖片格式不符，請重新選擇檔案')
    err.status = 400
    throw err
  }
  mime = detectedMime

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
