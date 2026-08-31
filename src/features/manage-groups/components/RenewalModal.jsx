import { useState } from 'react'
import { Calendar, RefreshCw, Users, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import { daysUntil, toISODate } from '../../../common/utils/date'
import { calcDisplayPrice } from '../../../common/utils/pricingUtils'

export default function RenewalModal({ isOpen, onClose, group, members = [], onStartRenewal, onEndGroup }) {
  const [renewChecks, setRenewChecks] = useState(() => Object.fromEntries(members.map(m => [m.id, true])))

  if (!group) return null

  const days = daysUntil(group.nextBillingDate)
  const isOverdue = days < 0
  const currentBillingDate = toISODate(group.nextBillingDate)
  const renewingCount = members.filter(m => renewChecks[m.id]).length
  const canRenew = renewingCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-sm" height="min(88dvh, 640px)">
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <RefreshCw strokeWidth={1.5} size={16} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">續訂服務</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>續訂服務</DialogDescription>
        <DialogBody>
      <div className="p-5">

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-raised p-3">
          <ServiceLogo serviceId={group.serviceId} size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">{group.serviceName}</p>
            <p className="text-xs text-ink-3">{group.planName}</p>
          </div>
          <TokenAmount
            amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
            cycle={group.billingCycle}
            className="shrink-0"
          />
        </div>

<div className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 ${
          isOverdue ? 'border-danger/30 bg-danger-subtle/60' : 'border-warning/30 bg-amber-50/60'
        }`}>
          <Calendar strokeWidth={1.5} size={15} className={isOverdue ? 'shrink-0 text-danger' : 'shrink-0 text-warning-text'} />
          <div>
            <p className={`text-sm font-bold ${isOverdue ? 'text-danger' : 'text-warning-text'}`}>
              {isOverdue ? `帳單日已過 ${Math.abs(days)} 天` : `續訂服務還有 ${days} 天`}
            </p>
            <p className="text-xs text-ink-3">本期帳單日：{currentBillingDate}</p>
          </div>
        </div>

        {members.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink"><Users strokeWidth={1.5} size={15} />選擇續訂成員</p>
              <p className="text-xs text-ink-3">{renewingCount} / {members.length} 續訂</p>
            </div>
            <p className="mb-3 text-xs text-ink-3">取消勾選代表這位成員本期不續訂，確認後會直接移出群組並釋出名額。</p>
            <div className="space-y-2">
              {members.map(m => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    renewChecks[m.id] ? 'border-brand/40 bg-brand-subtle' : 'border-line'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!renewChecks[m.id]}
                    onChange={e => setRenewChecks(prev => ({ ...prev, [m.id]: e.target.checked }))}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className="relative inline-block shrink-0">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{m.userName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="mb-4 text-xs text-ink-3">
          若有成員本期不續訂，確認後群組會先回到「招募中」讓你補齊名額，補滿後再重新鎖定群組即可進入下一期收款。
        </p>

      </div>
        </DialogBody>
        <DialogFooter>
          <button
            onClick={() => onStartRenewal?.(members.filter(m => renewChecks[m.id]).map(m => m.userId))}
            disabled={!canRenew}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-brand bg-brand-subtle p-4 transition-all hover:-translate-y-0.5 hover:bg-brand/10 disabled:pointer-events-none disabled:opacity-40"
          >
            <RefreshCw strokeWidth={1.5} size={16} className="shrink-0 text-brand" />
            <p className="font-bold text-brand">確認續訂</p>
          </button>

          <button
            onClick={onEndGroup}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-line p-4 transition-all hover:-translate-y-0.5 hover:border-danger/40 hover:bg-danger-subtle/50"
          >
            <XCircle strokeWidth={1.5} size={16} className="shrink-0 text-danger" />
            <p className="font-bold text-danger">結束服務</p>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
