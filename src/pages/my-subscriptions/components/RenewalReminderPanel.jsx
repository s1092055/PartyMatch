import { ArrowRight, Bell, ClipboardList, Clock } from 'lucide-react'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { daysUntil } from '../../../shared/utils/date'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'

function SectionHeader({ icon: Icon, iconCls, title, badge }) {
  return (
    <div className="flex items-center gap-2 border-b border-line-subtle px-5 py-3">
      <Icon size={14} className={iconCls} />
      <span className="text-sm font-extrabold text-ink">{title}</span>
      {badge > 0 && (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-2xs font-medium text-white">
          {badge}
        </span>
      )}
    </div>
  )
}

export default function RenewalReminderPanel({ subs, applications, onViewUpcoming }) {
  const upcoming = subs
    .map(s => ({ ...s, days: daysUntil(s.nextBillingDate) }))
    .filter(s => s.days >= 0 && s.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4)

  const markedPaidSubs = subs.filter(s => effectiveStatus(s) === 'markedPaid')

  const pendingApps = (applications ?? []).filter(a => a.status === 'pending')
  const approvedApps = (applications ?? []).filter(a => a.status === 'approved')
  const notableApps = [...pendingApps, ...approvedApps].slice(0, 3)

  return (
    <div className="sticky top-[7rem] space-y-4">
      {/* 即將續訂提醒 */}
      <div className="panel overflow-hidden">
        <SectionHeader icon={Bell} iconCls="text-brand" title="即將續訂提醒" badge={upcoming.length} />
        <div className="p-3">
          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-3">14 天內沒有即將續訂的項目</p>
          ) : (
            <div className="space-y-1">
              {upcoming.map(sub => {
                const urgent = sub.days <= 3
                return (
                  <div key={sub.id} className="flex items-center gap-3 rounded-lg p-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${urgent ? 'bg-danger' : 'bg-success'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink-2">{sub.serviceName}</p>
                      <p className="text-xs text-ink-3">{sub.nextBillingDate}</p>
                    </div>
                    <ServiceLogo serviceId={sub.serviceId} size={24} />
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-ink-2">NT${sub.pricePerSeat}</p>
                      <p className={`text-xs font-medium ${urgent ? 'text-danger-text' : 'text-brand'}`}>
                        {sub.days === 0 ? '今天' : `${sub.days} 天後`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {upcoming.length > 0 && (
            <button
              onClick={onViewUpcoming}
              className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-brand hover:underline"
            >
              查看全部 <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 付款待確認 */}
      {markedPaidSubs.length > 0 && (
        <div className="panel overflow-hidden">
          <SectionHeader icon={Clock} iconCls="text-purple" title="付款待確認" badge={markedPaidSubs.length} />
          <div className="space-y-1 p-3">
            {markedPaidSubs.map(sub => (
              <div key={sub.id} className="flex items-center gap-2.5 rounded-lg p-2.5">
                <ServiceLogo serviceId={sub.serviceId} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-2">{sub.serviceName}</p>
                  <p className="text-xs text-ink-3">等待團主確認</p>
                </div>
                <span className="shrink-0 rounded-full bg-purple-subtle px-2 py-0.5 text-xs font-semibold text-purple-text">
                  已標記
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 申請狀態 */}
      {notableApps.length > 0 && (
        <div className="panel overflow-hidden">
          <SectionHeader icon={ClipboardList} iconCls="text-amber-500" title="申請狀態" badge={pendingApps.length} />
          <div className="space-y-1 p-3">
            {notableApps.map(app => (
              <div key={app.id} className="flex items-center gap-2.5 rounded-lg p-2.5">
                <div className={`h-2 w-2 shrink-0 rounded-full ${app.status === 'pending' ? 'bg-warning' : 'bg-success'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-2">{app.groupName}</p>
                  <p className="text-xs text-ink-3">{app.planName ?? ''}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${app.status === 'pending' ? 'text-warning-text' : 'text-success-text'}`}>
                  {app.status === 'pending' ? '審核中' : '已通過'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
