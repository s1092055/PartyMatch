import { BarChart2, CheckCircle2, CreditCard, Mail, ShieldCheck, Smartphone, TrendingUp, XCircle } from 'lucide-react'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'

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

export default function AccountSidebar({ user, activeSubs = [], totalSubs = 0 }) {
  const monthly = activeSubs.reduce((sum, s) => sum + s.pricePerSeat, 0)

  const VERIFICATIONS = [
    { icon: Smartphone, label: '手機號碼', verified: true },
    { icon: Mail,       label: '電子信箱', verified: true },
    { icon: ShieldCheck,label: '身分驗證', verified: false },
  ]

  return (
    <div className="sticky top-20 space-y-4">
      
      <Panel title="信用分數" icon={TrendingUp} iconCls="text-brand">
        <div className="flex items-center justify-between mb-4">
          <CreditScoreBadge score={user.creditScore} size="lg" />
          <div className="text-right text-xs text-slate-400 space-y-1">
            <p>90–100 優良</p>
            <p>70–89 良好</p>
            <p>50–69 普通</p>
            <p>&lt;50 待改善</p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <p className="flex justify-between"><span>付款確認</span><span className="text-emerald-600 font-semibold">+2 分</span></p>
          <p className="flex justify-between"><span>被移除出群組</span><span className="text-red-500 font-semibold">−10 分</span></p>
          <p className="flex justify-between"><span>成功啟用群組</span><span className="text-blue-600 font-semibold">+5 分</span></p>
        </div>
      </Panel>

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

<Panel title="訂閱統計" icon={BarChart2} iconCls="text-indigo-500">
        <div className="space-y-2.5">
          {[
            { icon: CreditCard,  label: '活躍訂閱', value: `${activeSubs.length} 個` },
            { icon: TrendingUp,  label: '本月支出',  value: `NT$${monthly}` },
            { icon: CheckCircle2,label: '加入群組',  value: `${totalSubs} 個` },
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
