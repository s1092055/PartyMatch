import { Toaster as Sonner } from "sonner"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster(props) {
  return (
    <Sonner
      // Radix Dialog 開啟時會把 document.body 設成 pointer-events: none 來鎖住背景互動，
      // 只在 Dialog 自己的內容區塊裡覆寫回 auto；Toaster 是另外掛在 body 底下的 portal，
      // 不在 Dialog 內容區塊裡，因此會繼承到 none，導致 Modal 開著的時候 toast 上的按鈕
      // （例如「餘額不足」的「前往儲值」）看起來可以點，實際上完全點不到，這裡強制蓋回 auto
      className="pointer-events-auto"
      position="top-center"
      offset={{ top: '1.5rem' }}
      mobileOffset={{ top: '5rem' }}
      closeButton
      icons={{
        success: <CheckCircle2 size={18} className="text-success" />,
        error: <AlertCircle size={18} className="text-danger" />,
        warning: <AlertTriangle size={18} className="text-warning" />,
        info: <Info size={18} className="text-brand" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-max max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg max-[600px]:-translate-x-2',
          title: 'min-w-0 text-sm font-semibold text-ink',
          actionButton: '!bg-transparent !p-0 shrink-0 text-sm font-bold !text-brand hover:underline',
          closeButton: 'order-last shrink-0 !border-line !bg-surface text-ink-3 hover:!bg-raised hover:!text-ink',
          icon: 'shrink-0',
        },
      }}
      {...props}
    />
  )
}
