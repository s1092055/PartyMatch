export function errorHandler(err, req, res, _next) {
  console.error(`[${req.method}] ${req.path}`, err.message)

  const status  = err.status  ?? err.statusCode ?? 500
  const message = err.message ?? '伺服器發生錯誤，請稍後再試'

  res.status(status).json({ message })
}
