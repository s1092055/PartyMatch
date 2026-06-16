let _listener = null
const _queue = []

// options: { duration?: number, action?: { label: string, onClick: () => void } }
// action 用於「復原」之類可回應的提示；duration 覆寫預設 4 秒的自動消失時間。
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
