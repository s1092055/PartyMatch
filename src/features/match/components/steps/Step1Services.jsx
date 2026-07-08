import { AlertCircle } from 'lucide-react'
import ServiceSelectionGrid from '../ServiceSelectionGrid'

export default function Step1Services({ conditions, onToggle }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-4">選擇你想搜尋的服務（複選）</h3>
      <ServiceSelectionGrid selected={conditions.services} onToggle={onToggle} />
      {conditions.services.length === 0 && (
        <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle size={13} />
          請至少選擇一個服務
        </div>
      )}
    </div>
  )
}
