import { Toaster as Sonner } from "sonner"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster(props) {
  return (
    <Sonner
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
          toast: 'flex w-max max-w-sm items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg',
          title: 'min-w-0 text-sm font-semibold text-ink',
          actionButton: '!bg-transparent !p-0 shrink-0 text-sm font-bold !text-brand hover:underline',
          closeButton: '!border-line !bg-white text-ink-3 hover:!bg-raised hover:!text-ink',
          icon: 'shrink-0',
        },
      }}
      {...props}
    />
  )
}
