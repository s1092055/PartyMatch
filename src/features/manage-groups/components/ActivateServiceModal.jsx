import { PlayCircle, UserCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { Button } from '../../../components/ui/button'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import GroupOverviewContent from '../../../components/ui/group/GroupOverviewContent'
import { advanceByCycle, toISODate } from '../../../common/utils/date'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { hasFilledServiceInfo, getServiceInfoSummary, isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'

export default function ActivateServiceModal({
  isOpen,
  onClose,
  onConfirm,
  group,
  members,
  memberChecks,
  setMemberChecks,
  finalConfirmed,
  setFinalConfirmed,
  allMembersChecked,
  loading = false,
}) {
  const nextDate = isOpen ? toISODate(advanceByCycle(new Date(), group.billingCycle)) : ''
  const service  = getServiceById(group.serviceId)
  const plan     = service?.plans.find(p => p.name === group.planName)
  const sharingMethod = service?.sharingMethod

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" height="36rem" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <PlayCircle strokeWidth={1.5} size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">啟用服務</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>啟用服務</DialogDescription>
        <DialogBody>
      <div className="animate-step-slide-up flex-1 min-h-0 overflow-y-auto">

        <div className="flex items-center gap-3 border-b border-line-subtle px-5 py-4">
          <ServiceLogo serviceId={group.serviceId} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{group.serviceName}</p>
            <p className="text-xs text-ink-3">{group.planName}</p>
          </div>
          <div className="rounded-lg bg-success-subtle px-3 py-1.5 text-right">
            <p className="text-xs text-success-text">撥款金額</p>
            <p className="text-base font-extrabold text-success-text"><TokenAmount amount={group.escrowTokens} /></p>
          </div>
        </div>

        <div className="px-5 pt-5">
          <GroupOverviewContent
            group={group}
            service={service}
            plan={plan}
            extraRows={[{ label: '下次扣款日', value: nextDate }]}
            reviewsSection={
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-lg font-black text-brand"><UserCheck strokeWidth={1.5} size={16} />確認成員已啟用外部服務</p>
                  <p className="text-xs text-ink-3">
                    {members.filter(m => memberChecks[m.id] && !m.serviceInfoIssueNote).length} / {members.length} 已確認
                  </p>
                </div>
                <p className="text-sm text-ink-2">請在外部平台（{group.serviceName}）確認每位成員的帳號已完成設定，再逐一勾選。</p>
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <p className="py-2 text-center text-sm text-ink-3">尚無成員</p>
                  ) : members.map(m => (
                    <div
                      key={m.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        m.serviceInfoIssueNote ? 'border-warning/40 bg-warning-subtle' :
                        memberChecks[m.id] ? 'border-brand/40 bg-brand-subtle' :
                        'border-line'
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!memberChecks[m.id]}
                          onChange={e => {
                            const checked = e.target.checked
                            setMemberChecks(prev => ({ ...prev, [m.id]: checked }))
                            if (!checked) setFinalConfirmed(false)
                          }}
                          className="h-4 w-4 shrink-0 accent-brand"
                        />
                        <span className="relative inline-block shrink-0">
                          <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                          <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{m.userName}</p>
                          {m.serviceInfoIssueNote ? (
                            <p className="text-xs text-warning-text">帳號問題已回報，等待修正</p>
                          ) : hasFilledServiceInfo(m.serviceInfo, sharingMethod) ? (
                            <p className="text-xs text-ink-3">{getServiceInfoSummary(m.serviceInfo, sharingMethod)}</p>
                          ) : (
                            <p className="text-xs text-ink-4">{isSharedCredentialsMethod(sharingMethod) ? '尚未提取帳號資訊' : '尚未填寫帳號'}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </div>

        <div className="space-y-3 p-5">
          <label className={`flex cursor-pointer items-start gap-3 ${allMembersChecked ? '' : 'pointer-events-none opacity-40'}`}>
            <input
              type="checkbox"
              checked={finalConfirmed}
              onChange={e => setFinalConfirmed(e.target.checked)}
              disabled={!allMembersChecked}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span className="text-sm font-medium leading-relaxed text-ink">
              我確認所有成員皆已完成外部服務設定，同意平台進行撥款
            </span>
          </label>
        </div>
      </div>
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={onConfirm}
            disabled={!allMembersChecked || !finalConfirmed}
            loading={loading}
            className="flex-1 rounded-lg"
          >確認啟用</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
