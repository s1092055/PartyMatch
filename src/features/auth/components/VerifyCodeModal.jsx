import { useEffect, useState } from 'react'
import { CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

// 後端目前還沒接信箱/簡訊發送服務，先用固定驗證碼模擬完整流程；之後接上真的
// 發送服務時，只要把「驗證碼固定是 DEMO_CODE」換成呼叫後端寄送/驗證 API，
// 這個 Modal 的互動流程（倒數重新發送、輸入框、錯誤訊息）不用改
const DEMO_CODE = '123456'
const RESEND_SECONDS = 60

// AuthInput／PhoneInput 的 trailing 插槽用：未驗證顯示可點擊的「驗證」文字按鈕，
// 已驗證顯示綠色勾勾徽章（不可點擊，不能重複驗證）
export function VerifyTrailingButton({ verified, disabled, onClick }) {
  if (verified) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-success-text">
        <CheckCircle2 size={14} /> 已驗證
      </span>
    )
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 text-sm font-bold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-ink-4"
    >
      驗證
    </button>
  )
}

export default function VerifyCodeModal({ open, onOpenChange, type, target, onVerified }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(RESEND_SECONDS)
  const [prevOpen, setPrevOpen] = useState(open)

  const label = type === 'email' ? '信箱' : '手機號碼'
  const HeaderIcon = type === 'phone' ? Smartphone : ShieldCheck

  // Modal 每次開啟都視為重新發送一次，倒數重新起算——在 render 期間比對前一次的
  // open 值做調整，而不是另外開一個 effect 裡 setState，避免多一次不必要的重渲染
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setRemaining(RESEND_SECONDS)
  }

  useEffect(() => {
    if (!open || remaining <= 0) return
    const timer = setTimeout(() => setRemaining(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [open, remaining])

  const ready = remaining <= 0

  function handleResend() {
    setCode('')
    setError('')
    setRemaining(RESEND_SECONDS)
  }

  function handleChange(value) {
    setCode(value.replace(/\D/g, '').slice(0, 6))
    setError('')
  }

  function handleVerify() {
    if (code !== DEMO_CODE) {
      setError('驗證碼錯誤，請重新輸入')
      return
    }
    onVerified()
    onOpenChange(false)
    setCode('')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) { setCode(''); setError('') } }}>
      <DialogContent variant="panel" maxWidth="max-w-sm" instant>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HeaderIcon size={18} strokeWidth={1.5} className="text-brand" />
            <DialogTitle>驗證{label}</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>驗證{label}</DialogDescription>
        <DialogBody>
          <div className="flex flex-col gap-4 p-5">
            <p className="text-sm text-ink-3">
              驗證碼已發送至 <span className="font-bold text-ink">{target || `（尚未輸入${label}）`}</span>，請輸入 6 碼驗證碼完成驗證。
            </p>
            <p className="rounded-inner border border-brand-subtle bg-brand-subtle px-3 py-2 text-xs font-medium text-brand">
              測試模式：驗證碼固定為 {DEMO_CODE}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="請輸入 6 碼驗證碼"
              value={code}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
              className="text-center text-lg font-bold tracking-[0.3em]"
            />
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <div className="flex items-center justify-between text-xs text-ink-3">
              <span>{ready ? '沒收到驗證碼？' : `${remaining} 秒後可重新發送`}</span>
              <button
                type="button"
                disabled={!ready}
                onClick={handleResend}
                className="font-bold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-ink-4"
              >
                重新發送
              </button>
            </div>
            <Button type="button" size="lg" className="h-12 w-full" disabled={code.length !== 6} onClick={handleVerify}>
              確認驗證
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
