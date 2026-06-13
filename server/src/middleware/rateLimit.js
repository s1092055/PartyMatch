import rateLimit from 'express-rate-limit'

function handler(req, res) {
  res.status(429).json({ message: '請求過於頻繁，請稍後再試' })
}

function makeLimiter(limit, skip) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
    ...(skip && { skip }),
  })
}

const skipInDevelopment = () => process.env.NODE_ENV === 'development'

export const authLimiter = makeLimiter(10, skipInDevelopment);

export const refreshLimiter = makeLimiter(60);

export const uploadLimiter = makeLimiter(30, skipInDevelopment);

export const adminAuthLimiter = makeLimiter(5, skipInDevelopment);

export const adjudicateLimiter = makeLimiter(20);

export const topupLimiter = makeLimiter(10, skipInDevelopment);

export const applicationLimiter = makeLimiter(20, skipInDevelopment);

// 全站基礎防線：其餘端點目前完全沒有任何流量控管，掛在 app.js 最外層當最後一道防線，
// 門檻刻意設得寬鬆（要涵蓋同分頁多個 5 秒輪詢＋一般操作點擊），只用來擋真的異常量體的濫用，不是取代上面幾個針對高風險端點的嚴格限流
export const globalLimiter = makeLimiter(600, skipInDevelopment);
