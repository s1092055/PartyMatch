import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../shared/ui/TokenAmount'

export default function MatchConditionBar({ conditions, showEdit = true }) {
  const navigate = useNavigate()
  const { services, maxPrice, minRating } = conditions

  return (
    <div className="card px-5 py-4 flex flex-wrap items-center gap-4 mb-6">
      <span className="text-xs font-bold text-ink-4 mr-1">配對條件</span>

      <div className="flex items-center gap-1.5">
        {services.map(id => {
          const s = getServiceById(id)
          if (!s) return null
          return (
            <span
              key={id}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1 text-xs font-bold text-ink"
            >
              <ServiceLogo serviceId={id} size={22} />
              {s.name}
            </span>
          )
        })}
      </div>

      <Divider />
      <Chip label={<><TokenAmount amount={maxPrice} badgeSize="!h-3.5 !w-3.5" /> 以下</>} />
      <Divider />
      <Chip label={`信用分數 ${minRating}+`} />

      {showEdit && (
        <button
          onClick={() => navigate('/quick-match')}
          className="ml-auto flex items-center gap-1 text-xs text-brand hover:underline"
        >
          <Pencil size={11} />
          修改條件
        </button>
      )}
    </div>
  )
}

function Divider() {
  return <span className="h-6 w-px bg-line" />
}

function Chip({ label }) {
  return <span className="rounded-lg bg-raised px-3 py-1 text-xs font-bold text-ink-2">{label}</span>
}
