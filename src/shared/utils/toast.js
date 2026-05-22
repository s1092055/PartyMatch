let _listener = null
const _queue = []

export function toast(message, type = 'success') {
  const item = { id: Date.now() + Math.random(), message, type }
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
