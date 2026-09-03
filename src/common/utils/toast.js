import { toast as sonnerToast } from 'sonner'

export function toast(message, type = 'success', options = {}) {
  const { persistent, duration, ...rest } = options
  const emit = sonnerToast[type] ?? sonnerToast.success
  emit(message, { duration: persistent ? Infinity : duration, ...rest })
}

export function notifyError(err, fallback = '操作失敗，請稍後再試') {
  console.error(err)
  toast(err?.message ?? fallback, 'error')
}

export function dismissToast(id) {
  // 不帶 id 時 sonner 會把畫面上所有 toast 一次清空，用在登出這種
  // 需要清掉殘留通知 toast 的場景
  sonnerToast.dismiss(id)
}
