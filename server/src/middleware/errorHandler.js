export function errorHandler(err, req, res, _next) {
  console.error(`[${req.method}] ${req.path}`, err.message)

  // P2034：Prisma interactive transaction 偵測到真正的併發寫入衝突（例如兩筆申請幾乎同時被核准，
  // 都在同一筆 transaction 裡更新同一個群組的 currentMembers）。這不是程式邏輯錯誤，是資料庫層
  // 主動擋下衝突要求重試，沒有特別處理的話會被下面的預設 500 蓋掉，讓使用者看到誤導的伺服器錯誤——
  // 改成跟其他「狀態剛好被別人搶先變動」的情境一樣回 409，前端可以照現有邏輯提示重新整理再試一次
  if (err.code === 'P2034') {
    return res.status(409).json({ message: '這個操作剛好跟別人的動作衝突了，請重新整理頁面再試一次' })
  }

  const status  = err.status  ?? err.statusCode ?? 500
  const message = err.message ?? '伺服器發生錯誤，請稍後再試'

  res.status(status).json({ message })
}
