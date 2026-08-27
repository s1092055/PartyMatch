import { Check, AlertCircle } from 'lucide-react'
import { listServiceTypes } from '../../../../shared/services/serviceTypes'
import ServiceLogo from '../../../../shared/components/ui/ServiceLogo'

export default function Step1Service({ form, onChange }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">選擇訂閱服務</h2>
      <p className="text-sm text-slate-500 mb-5">選擇你想建立群組的訂閱服務（單選）</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {listServiceTypes().map(service => {
          const active = form.serviceId === service.id
          return (
            <button
              key={service.id}
              onClick={() => onChange('serviceId', service.id)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                active
                  ? 'border-success bg-success-subtle'
                  : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
              }`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md bg-success flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </span>
              )}
              <ServiceLogo serviceId={service.id} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{service.name}</p>
                <p className="text-xs text-slate-400">{service.category}</p>
              </div>
            </button>
          )
        })}
      </div>

      {!form.serviceId && (
        <div className="flex items-center gap-2 mt-4 text-xs text-amber-600 bg-amber-50 px-3 py-2.5 rounded-lg">
          <AlertCircle size={13} />
          請選擇一個服務才能繼續
        </div>
      )}
    </div>
  )
}
