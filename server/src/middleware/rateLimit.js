import rateLimit from 'express-rate-limit'

// 統一的限流回應格式，跟其餘 4xx 錯誤（{ message }）保持一致，前端不用另外處理
function handler(req, res) {
  res.status(429).json({ message: '請求過於頻繁，請稍後再試' })
}

// 登入／註冊：brute force、大量灌帳號的防護，同一 IP 短時間內嘗試次數上限比其他端點嚴格許多
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

// /auth/refresh：正常使用下每個裝置每 15 分鐘 access token 過期前就會主動換新一次，
// 頻率遠低於登入，但共用辦公室/校園網路的多個使用者可能共用同一個公開 IP，門檻放寬一些
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    60,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

// 上傳端點：每次上傳都會真的產生 R2 storage + bandwidth 成本，濫用風險比其他端點更需要擋
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})
