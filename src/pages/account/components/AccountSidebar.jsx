import { Star, CheckCircle2, XCircle, ShieldCheck, Smartphone, Mail, CreditCard, TrendingUp, BarChart2 } from 'lucide-react'
import { getSubscriptionsByUserId } from '../../../shared/stores/subscriptionStore'

function Panel({ title, icon: Icon, iconCls = 'text-blue-500', children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Icon size={14} className={iconCls} />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function StarBar({ value }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={12}
            className={i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-slate-700">{value}</span>
      <span className="text-xs text-slate-400">/ 5.0</span>
    </div>
  )
}

export default function AccountSidebar({ user }) {
  const subs   = getSubscriptionsByUserId(user.id).filter(s => s.status === 'active')
  const monthly = subs.reduce((sum, s) => sum + s.pricePerSeat, 0)

  const VERIFICATIONS = [
    { icon: Smartphone, label: '手機號碼', verified: true },
    { icon: Mail,       label: '電子信箱', verified: true },
    { icon: ShieldCheck,label: '身分驗證', verified: false },
  ]

  return (
    <div className="sticky top-20 space-y-4">
      {/* Credit Score */}
      <Panel title="信用評分" icon={Star} iconCls="text-amber-500">
        <StarBar value={user.creditScore} />
        <div className="mt-3 space-y-2.5">
          {[
            { label: '準時付款', value: '100%',  color: 'bg-emerald-500' },
            { label: '群組完成率', value: '94%', color: 'bg-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: value }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-400">收到評價</span>
            <span className="font-semibold text-slate-700">{Math.floor(user.creditScore * 10)} 則</span>
          </div>
        </div>
      </Panel>

      {/* Verification */}
      <Panel title="驗證狀態" icon={ShieldCheck} iconCls="text-emerald-500">
        <div className="space-y-2.5">
          {VERIFICATIONS.map(({ icon: Icon, label, verified }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Icon size={14} className="text-slate-400" />
                {label}
              </div>
              {verified ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 size={13} /> 已驗證
                </span>
              ) : (
                <button className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                  <XCircle size={13} /> 立即驗證
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Subscription Stats */}
      <Panel title="訂閱統計" icon={BarChart2} iconCls="text-indigo-500">
        <div className="space-y-2.5">
          {[
            { icon: CreditCard,  label: '活躍訂閱', value: `${subs.length} 個` },
            { icon: TrendingUp,  label: '本月支出',  value: `NT$${monthly}` },
            { icon: CheckCircle2,label: '加入群組',  value: `${user.joinedGroups.length} 個` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Icon size={13} className="text-slate-400" />
                {label}
              </div>
              <span className="text-sm font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
