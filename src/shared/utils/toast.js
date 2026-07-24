let _listener = null
const _queue = []

// options: { duration?: number, action?: { label: string, onClick: () => void }, icon?: ReactNode }
// action 用於「復原」之類可回應的提示；duration 覆寫預設 4 秒的自動消失時間；
// icon 用於覆寫預設的 type 圖示（例如PM幣不足要顯示 PM幣徽章而非通用錯誤圖示）。
export function toast(message, type = 'success', options = {}) {
  const item = { id: Date.now() + Math.random(), message, type, ...options }
  if (_listener) {
    _listener(item)
  } else {
    _queue.push(item)
  }
}

export function subscribeToast(fn) {
  _listener = fn
  _queue.splice(0).forEach(fn)
  return () => { if (_listener === fn) _listener = null }
}

// 給 store 內樂觀更新失敗（fire-and-forget 的背景 API 呼叫）用：記錄錯誤並跳 Toast 告知使用者，
// 避免畫面狀態已經改變、但操作其實沒有真的同步到後端，使用者卻毫無所覺。
export function notifyError(err, fallback = '操作失敗，請稍後再試') {
  console.error(err)
  toast(err?.message ?? fallback, 'error')
}
