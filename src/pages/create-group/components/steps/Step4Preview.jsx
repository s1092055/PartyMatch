import { CheckCircle2, Star, Users, Calendar, Banknote, ListChecks } from 'lucide-react'
import { getServiceById } from '../../../../shared/services/serviceTypes'
import { getActiveUserProfile } from '../../../../shared/stores/userStore'
import Badge from '../../../../shared/components/ui/Badge'
import ServiceLogo from '../../../../shared/components/ui/ServiceLogo'

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default function Step4Preview({ form }) {
  const service = getServiceById(form.serviceId)
  const activeUser = getActiveUserProfile()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">確認並送出</h2>
        <p className="text-sm text-slate-500">請確認以下群組資訊都正確後再送出</p>
      </div>

      {/* Group card preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4 mb-4">
          <ServiceLogo serviceId={form.serviceId} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-lg">{service?.fullName}</span>
              <CheckCircle2 size={15} className="text-blue-500" />
            </div>
            <p className="text-sm text-slate-500">{form.planName}</p>
          </div>
          <Badge variant="recruiting" />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { icon: Banknote,  label: '月費', value: `NT$${form.pricePerSeat}` },
            { icon: Users,     label: '名額', value: `${form.totalSeats} 人` },
            { icon: Calendar,  label: '扣款日', value: `每月 ${form.nextBillingDay} 日` },
            { icon: Star,      label: '加入', value: form.joinMode === 'instant' ? '立即' : '審核' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl p-2.5 text-center">
              <Icon size={14} className="text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{form.description}</p>
      </div>

      {/* Details */}
      <div className="bg-white border border-slate-200 rounded-xl px-5">
        <Row label="團主"       value={activeUser?.displayName ?? '使用者'} />
        <Row label="服務"       value={`${service?.fullName} · ${form.planName}`} />
        <Row label="每人月費"   value={`NT${form.pricePerSeat} / 月`} />
        <Row label="計費週期"   value={form.billingCycle === 'monthly' ? '月繳' : '年繳'} />
        <Row label="扣款日"     value={`每月 ${form.nextBillingDay} 日`} />
        <Row label="開放名額"   value={`${form.totalSeats} 人（含團主）`} />
        <Row label="加入方式"   value={form.joinMode === 'instant' ? '立即加入' : '需要審核'} />
      </div>

      {/* Rules */}
      {form.rules.some(r => r.trim()) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">群組規則</span>
          </div>
          <ul className="space-y-1.5">
            {form.rules.filter(r => r.trim()).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        送出後群組將立即上架並開始招募，你可以隨時在「群組管理」中修改設定。
      </div>
    </div>
  )
}
