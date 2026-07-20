// 共用輪詢器：立即執行一次 + 每隔 intervalMs 執行一次，回傳 stop() 函式。
// pollOnce 收到 isActive()，用來在 await 之後（stop() 可能已在這段期間被呼叫）
// 判斷這次結果是否還該套用，避免已停止的輪詢仍寫回過期資料。
export function startPolling(pollOnce, intervalMs) {
  let active = true
  const isActive = () => active

  async function tick() {
    if (!isActive()) return
    await pollOnce(isActive)
  }

  tick()
  const timer = setInterval(tick, intervalMs)

  return () => {
    active = false
    clearInterval(timer)
  }
}
