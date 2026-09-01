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
