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
