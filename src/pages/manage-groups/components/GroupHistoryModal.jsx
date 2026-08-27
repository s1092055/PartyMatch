import { Ban, Calendar, CheckCircle2, Clock, History, PauseCircle, Users } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Avatar from '../../../shared/components/ui/Avatar'
import Badge from '../../../shared/components/ui/Badge'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import EmptyState from '../../../shared/components/ui/EmptyState'

const STATUS_TIMELINE = {
  cancelled: [
    { label: '群組建立', icon: CheckCircle2, color: 'text-brand',   bg: 'bg-brand-subtle',   key: 'createdAt' },
    { label: '群組解散', icon: Ban,          color: 'text-danger',  bg: 'bg-red-50',         key: 'updatedAt' },
  ],
  paused: [
    { label: '群組建立',   icon: CheckCircle2, color: 'text-brand',        bg: 'bg-brand-subtle',  key: 'createdAt' },
    { label: '服務啟用',   icon: CheckCircle2, color: 'text-success-text', bg: 'bg-success-subtle', key: 'activatedAt' },
    { label: '服務停止',   icon: PauseCircle,  color: 'text-ink-3',       bg: 'bg-raised',        key: 'updatedAt' },
  ],
  ended: [
    { label: '群組建立',   icon: CheckCircle2, color: 'text-brand',        bg: 'bg-brand-subtle',  key: 'createdAt' },
    { label: '服務啟用',   icon: CheckCircle2, color: 'text-success-text', bg: 'bg-success-subtle', key: 'activatedAt' },
    { label: '服務結束',   icon: Clock,        color: 'text-ink-3',       bg: 'bg-raised',        key: 'updatedAt' },
  ],
}

export default function GroupHistoryModal({ isOpen, onClose, group, members }) {
  if (!group) return null

  const timeline = STATUS_TIMELINE[group.status] ?? STATUS_TIMELINE.ended
  const paidCount = members.filter(m => m.paymentStatus === 'paid').length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="群組紀錄"
      titleIcon={<History size={16} className="text-ink-3" />}
      maxWidth="max-w-lg"
    >
      <div className="max-h-[75vh] overflow-y-auto p-5">
        {/* Group header */}
        <div className="flex items-center gap-3 rounded-2xl bg-raised p-4">
          <ServiceLogo serviceId={group.serviceId} size={42} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-ink">{group.serviceName}</p>
              <Badge variant={group.status} />
            </div>
            <p className="mt-1 text-sm text-ink-3">{group.planName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line-subtle p-3 text-center">
            <p className="text-lg font-extrabold text-ink">{members.length}</p>
            <p className="text-xs text-ink-3">總成員數</p>
          </div>
          <div className="rounded-2xl border border-line-subtle p-3 text-center">
            <p className="text-lg font-extrabold text-success-text">{paidCount}</p>
            <p className="text-xs text-ink-3">已付款</p>
          </div>
          <div className="rounded-2xl border border-line-subtle p-3 text-center">
            <p className="text-lg font-extrabold text-ink">{`NT$${group.pricePerSeat}`}</p>
            <p className="text-xs text-ink-3">每人費用</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5">
          <p className="mb-3 text-sm font-extrabold text-ink">群組時間軸</p>
          <div className="space-y-1">
            {timeline.map((item, idx) => {
              const date = group[item.key]
              if (!date) return null
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.bg}`}>
                    <Icon size={13} className={item.color} />
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="absolute ml-3 mt-7 h-5 w-px bg-line-subtle" />
                  )}
                  <div className="flex flex-1 items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-ink-3">{date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Member list */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Users size={14} className="text-ink-3" />
            <p className="text-sm font-extrabold text-ink">成員名單</p>
          </div>
          {members.length === 0 ? (
            <EmptyState icon={Users} title="此群組沒有成員紀錄" className="py-6" />
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">加入於 {m.joinedAt}</p>
                  </div>
                  {m.paymentStatus === 'paid' ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={10} /> 已付款
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-3">
                      <Clock size={10} /> 未付款
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing info */}
        {(group.activatedAt || group.nextBillingDate) && (
          <div className="mt-5 space-y-2 rounded-2xl border border-line-subtle p-4">
            <p className="text-sm font-extrabold text-ink">帳單資訊</p>
            {group.activatedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Calendar size={13} /> 啟用日期
                </span>
                <span className="font-semibold text-ink">{group.activatedAt}</span>
              </div>
            )}
            {group.nextBillingDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Calendar size={13} /> 最後服務日
                </span>
                <span className="font-semibold text-ink">{group.nextBillingDate}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-3">計費週期</span>
              <span className="font-semibold text-ink">{group.billingCycle === 'yearly' ? '年付' : '月付'}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
