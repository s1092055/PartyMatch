import crypto from 'crypto'

// Group.sharedCredentials（團主提供的共用帳密，見 groupPrivacy.js）在資料庫內以
// AES-256-GCM 加密儲存，避免資料庫外洩時帳密以明文外流。金鑰放在環境變數
// CREDENTIAL_ENCRYPTION_KEY（64 字元 hex，對應 32 bytes），不使用外部 KMS。
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey() {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!keyHex) throw new Error('CREDENTIAL_ENCRYPTION_KEY 未設定')
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) throw new Error('CREDENTIAL_ENCRYPTION_KEY 必須是 64 字元的 hex 字串（32 bytes）')
  return key
}

// 回傳格式：base64(iv || authTag || ciphertext)，單一字串方便直接存進 sharedCredentials 這個既有欄位
export function encryptCredential(plaintext) {
  if (plaintext == null) return plaintext
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
}

export function decryptCredential(encoded) {
  if (encoded == null) return encoded
  const data = Buffer.from(encoded, 'base64')
  const iv         = data.subarray(0, IV_LENGTH)
  const authTag    = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
