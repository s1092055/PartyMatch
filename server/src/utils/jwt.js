import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXP     = process.env.JWT_ACCESS_EXPIRES  ?? '15m'
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES ?? '7d'

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP, algorithm: 'HS256' })
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXP, algorithm: 'HS256' })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] })
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] })
}

// 管理員帳號跟一般使用者完全不共用簽章金鑰：就算其中一組 secret 外流，
// 也只會影響對應那一側的 token，不會讓一般使用者的 token 被拿來冒充管理員（反之亦然）
const ADMIN_ACCESS_SECRET  = process.env.JWT_ADMIN_ACCESS_SECRET
const ADMIN_REFRESH_SECRET = process.env.JWT_ADMIN_REFRESH_SECRET
const ADMIN_ACCESS_EXP     = process.env.JWT_ADMIN_ACCESS_EXPIRES  ?? '10m'
const ADMIN_REFRESH_EXP    = process.env.JWT_ADMIN_REFRESH_EXPIRES ?? '1d'

export function signAdminAccessToken(payload) {
  return jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ADMIN_ACCESS_EXP, algorithm: 'HS256' })
}

export function signAdminRefreshToken(payload) {
  return jwt.sign(payload, ADMIN_REFRESH_SECRET, { expiresIn: ADMIN_REFRESH_EXP, algorithm: 'HS256' })
}

export function verifyAdminAccessToken(token) {
  return jwt.verify(token, ADMIN_ACCESS_SECRET, { algorithms: ['HS256'] })
}

export function verifyAdminRefreshToken(token) {
  return jwt.verify(token, ADMIN_REFRESH_SECRET, { algorithms: ['HS256'] })
}
