import { ArrowRight, Banknote, Bell, Check, ClipboardList, PlusCircle, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../../shared/components/ui/Avatar'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import EmptyState from '../../../shared/components/ui/EmptyState'
import { daysUntil } from '../../../shared/utils/date'
import { createNotification } from '../../../shared/stores/notificationStore'
import { getGroups } from '../../../shared/stores/groupStore'

function resolveServiceId(app) {
  if (app.serviceId) return app.serviceId
  const map = new Map(getGroups().map(g => [g.id, g.serviceId]))
  return map.get(app.groupId) ?? 'spotify'
}

function MiniApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const name    = app.applicantName ?? app.userName ?? '申請者'
  const initial = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color   = app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8'

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-2.5 flex items-center gap-2.5">
        <Avatar initial={initial} color={color} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{name}</p>
          <div className="flex items-center gap-1">
            <ServiceLogo serviceId={resolveServiceId(app)} size={14} />
            <p className="truncate text-xs text-ink-3">{app.groupName ?? app.serviceName}</p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-ink-4">{app.createdAt}</span>
      </div>
      {error && <p className="mb-1.5 text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(app.id)}
          disabled={groupFull}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-40"
        >
          <Check size={11} strokeWidth={3} />
          {groupFull ? '已額滿' : '核准'}
        </button>
        <button
          onClick={() => onReject(app.id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <X size={11} strokeWidth={3} /> 拒絕
        </button>
      </div>
    </div>
  )
}

export default function ManageRightRail({ applications, seatMap, hostedGroups, members, errors, onApprove, onReject, onViewAllApps, onRenewal }) {
  const navigate = useNavigate()
  const pending = applications.filter(a => a.status === 'pending').slice(0, 3)

  const unpaidGroups = (hostedGroups ?? [])
    .map(g => ({
      group: g,
      unpaidCount: (members ?? []).filter(m => m.groupId === g.id && m.paymentStatus !== 'paid').length,
    }))
    .filter(({ unpaidCount }) => unpaidCount > 0)

  const upcomingRenewals = (hostedGroups ?? [])
    .filter(g => g.status === 'active' && g.nextBillingDate)
    .map(g => ({ group: g, days: daysUntil(g.nextBillingDate) }))
    .filter(({ days }) => days <= 7)
    .sort((a, b) => a.days - b.days)

  function sendRenewalReminder(group) {
    const groupMembers = (members ?? []).filter(m => m.groupId === group.id)
    groupMembers.forEach(m => {
      createNotification({
        userId:  m.userId,
        type:    'payment_reminder',
        title:   '續訂提醒',
        message: `「${group.serviceName}」群組將於 ${group.nextBillingDate} 續訂，請確認付款方式。`,
      })
    })
  }

  return (
    <div className="sticky top-[5rem] space-y-4">
      {/* Latest applications */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-amber-500" />
            <span className="text-sm font-extrabold text-ink">最新申請</span>
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                {pending.length}
              </span>
            )}
          </div>
          {applications.filter(a => a.status === 'pending').length > 0 && (
            <button
              onClick={onViewAllApps}
              className="flex items-center gap-0.5 text-xs font-bold text-brand transition-colors hover:text-brand-hover"
            >
              全部 <ArrowRight size={12} />
            </button>
          )}
        </div>

        <div className="space-y-2.5 p-3">
          {pending.length === 0 ? (
            <EmptyState icon={ClipboardList} title="目前沒有待審申請" className="py-6" />
          ) : (
            pending.map(app => (
              <MiniApplicationCard
                key={app.id}
                app={app}
                groupFull={(seatMap?.[app.groupId]?.openSeats ?? 1) <= 0}
                error={errors?.[app.id]}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))
          )}
        </div>
      </div>

      {/* Upcoming renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-line-subtle px-4 py-3">
            <RefreshCw size={14} className="text-brand" />
            <span className="text-sm font-extrabold text-ink">即將到期</span>
            <span className="rounded-full bg-brand-subtle px-1.5 py-0.5 text-[11px] font-bold text-brand">
              {upcomingRenewals.length}
            </span>
          </div>
          <div className="space-y-1 p-3">
            {upcomingRenewals.map(({ group, days }) => (
              <div key={group.id} className="rounded-xl p-2.5 transition-colors hover:bg-raised">
                <div className="flex items-center gap-2.5">
                  <ServiceLogo serviceId={group.serviceId} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-2">{group.serviceName}</p>
                    <p className={`text-[11px] font-semibold ${days <= 0 ? 'text-danger' : 'text-warning-text'}`}>
                      {days <= 0 ? `已逾期 ${Math.abs(days)} 天` : `${days} 天後到期`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => sendRenewalReminder(group)}
                      className="flex items-center gap-1 rounded-lg bg-raised px-2 py-1 text-[11px] font-semibold text-ink-2 transition-colors hover:bg-brand-subtle hover:text-brand"
                    >
                      <Bell size={10} /> 提醒
                    </button>
                    <button
                      onClick={() => onRenewal?.(group.id)}
                      className="flex items-center gap-1 rounded-lg bg-brand px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-hover"
                    >
                      <RefreshCw size={10} /> 續訂
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment reminders */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-line-subtle px-4 py-3">
          <Banknote size={14} className="text-rose-500" />
          <span className="text-sm font-extrabold text-ink">收款提醒</span>
          {unpaidGroups.length > 0 && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
              {unpaidGroups.reduce((sum, { unpaidCount }) => sum + unpaidCount, 0)}
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          {unpaidGroups.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-3">全部成員均已付款</p>
          ) : (
            unpaidGroups.map(({ group, unpaidCount }) => (
              <div key={group.id} className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-raised">
                <ServiceLogo serviceId={group.serviceId} size={28} />
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink-2">{group.serviceName}</p>
                <span className="shrink-0 text-xs font-bold text-amber-600">{unpaidCount} 位待付款</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card space-y-1 p-4">
        <p className="mb-2 text-sm font-extrabold text-ink">快速操作</p>
        <button
          onClick={() => navigate('/create-group')}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
        >
          <PlusCircle size={15} className="text-brand" /> 建立新群組
        </button>
        <button
          onClick={onViewAllApps}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised"
        >
          <ClipboardList size={15} className="text-amber-500" /> 查看所有申請
        </button>
      </div>
    </div>
  )
}
