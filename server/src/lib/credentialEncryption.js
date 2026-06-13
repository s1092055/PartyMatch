import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey() {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!keyHex) throw new Error('CREDENTIAL_ENCRYPTION_KEY 未設定')
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== 32) throw new Error('CREDENTIAL_ENCRYPTION_KEY 必須是 64 字元的 hex 字串（32 bytes）')
  return key
}

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
