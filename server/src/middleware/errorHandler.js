export function errorHandler(err, req, res, _next) {
  console.error(`[${req.method}] ${req.path}`, err.message)

  if (err.code === 'P2034') {
    return res.status(409).json({ message: '這個操作剛好跟別人的動作衝突了，請重新整理頁面再試一次' })
  }

  const status  = err.status  ?? err.statusCode ?? 500
  const message = err.message ?? '伺服器發生錯誤，請稍後再試'

  res.status(status).json({ message, ...(err.responsePayload ?? {}) })
}
