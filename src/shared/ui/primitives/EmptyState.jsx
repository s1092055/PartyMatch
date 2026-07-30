import { SearchX } from 'lucide-react'
import { Button } from '../../../components/ui/button'

export default function EmptyState({
  icon: Icon = SearchX,
  title = '沒有找到結果',
  description,
  actionLabel,
  onAction,
  className = 'py-16',
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-raised flex items-center justify-center mb-4">
        <Icon size={26} className="text-ink-4" />
      </div>
      <p className="font-semibold text-ink-2 mb-1">{title}</p>
      {description && <p className="text-sm text-ink-3 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
