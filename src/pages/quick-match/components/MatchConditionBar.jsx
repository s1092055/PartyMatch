import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { getServiceById } from '../../../shared/services/serviceTypes'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'

const JOIN_LABEL = { any: '不限', instant: '立即加入', approval: '審核加入' }

export default function MatchConditionBar({ conditions }) {
  const navigate = useNavigate()
  const { services, maxPrice, joinMode, minRating } = conditions

  return (
    <div className="card px-5 py-4 flex flex-wrap items-center gap-4 mb-6">
      <span className="text-xs font-bold text-slate-400 mr-1">配對條件</span>

      {/* Services */}
      <div className="flex items-center gap-1.5">
        {services.map(id => {
          const s = getServiceById(id)
          if (!s) return null
          return (
            <span
              key={id}
              className="flex items-center gap-2 rounded-full border border-line bg-white px-2 py-1 text-xs font-bold text-ink"
            >
              <ServiceLogo serviceId={id} size={22} />
              {s.name}
            </span>
          )
        })}
      </div>

      <Divider />
      <Chip label={`NT$${maxPrice} 以下`} />
      <Divider />
      <Chip label={JOIN_LABEL[joinMode]} />
      <Divider />
      <Chip label={`評分 ${minRating.toFixed(1)}+`} />

      <button
        onClick={() => navigate('/quick-match')}
        className="ml-auto flex items-center gap-1 text-xs text-brand hover:underline"
      >
        <Pencil size={11} />
        修改條件
      </button>
    </div>
  )
}

function Divider() {
  return <span className="h-6 w-px bg-line" />
}

function Chip({ label }) {
  return <span className="rounded-lg bg-raised px-3 py-1 text-xs font-bold text-ink-2">{label}</span>
}
