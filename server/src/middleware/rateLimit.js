import rateLimit from 'express-rate-limit'

function handler(req, res) {
  res.status(429).json({ message: '請求過於頻繁，請稍後再試' })
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    60,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});

export const adjudicateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit:    20,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});
