import { AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react'
import Modal from '../../../shared/ui/Modal'
import Avatar from '../../../shared/ui/Avatar'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../shared/ui/TokenAmount'
import { toISODate } from '../../../shared/utils/date'

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
  onOpenServiceIssue,
}) {
  const nextDate = (() => {
    if (!isOpen) return ''
    const d = new Date()
    if (group.billingCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
    else d.setMonth(d.getMonth() + 1)
    return toISODate(d)
  })()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="啟用服務"
      icon={<PlayCircle size={18} className="text-success" />}
      maxWidth="max-w-lg"
      sub
      footer={
        <button
          onClick={onConfirm}
          disabled={!allMembersChecked || !finalConfirmed}
          className="flex-1 rounded-xl bg-success py-2.5 text-sm font-bold text-white transition-colors hover:bg-success-text disabled:cursor-not-allowed disabled:opacity-40"
        >確認啟用</button>
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 服務摘要 */}
        <div className="flex items-center gap-3 border-b border-line-subtle px-5 py-4">
          <ServiceLogo serviceId={group.serviceId} size={40} className="rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{group.serviceName}</p>
            <p className="text-xs text-ink-3">{group.planName} · <TokenAmount amount={group.pricePerSeat} cycle={group.billingCycle === 'yearly' ? 'yearly' : 'monthly'} /> /席</p>
          </div>
          <div className="rounded-xl bg-success-subtle px-3 py-1.5 text-right">
            <p className="text-xs text-success-text">撥款金額</p>
            <p className="text-base font-extrabold text-success-text"><TokenAmount amount={group.pricePerSeat * members.length} /></p>
          </div>
        </div>

        {/* 下次扣款日 */}
        <div className="mx-5 mt-5 flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-ink-2">下次扣款日</p>
            <p className="mt-0.5 text-xs text-ink-4">啟用後自動設定，不可修改</p>
          </div>
          <p className="text-base font-extrabold text-ink">{nextDate}</p>
        </div>

        {/* 逐一確認成員 */}
        <div className="px-5 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-2">確認成員已加入外部服務</p>
            <p className="text-xs text-ink-3">
              {Object.values(memberChecks).filter(Boolean).length} / {members.length} 已確認
            </p>
          </div>
          <p className="mb-3 text-xs text-ink-3">請在外部訂閱平台（{group.serviceName}）確認每位成員的帳號已完成設定，再逐一打勾。</p>
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="py-2 text-center text-sm text-ink-3">尚無成員</p>
            ) : members.map(m => (
              <div
                key={m.id}
                className={`rounded-xl border p-3 transition-colors ${
                  memberChecks[m.id] ? 'border-success/40 bg-success-subtle' :
                  m.serviceInfoIssueNote ? 'border-warning/40 bg-warning-subtle' :
                  'border-line'
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!memberChecks[m.id]}
                    onChange={e => setMemberChecks(prev => ({ ...prev, [m.id]: e.target.checked }))}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    {m.serviceInfoIssueNote ? (
                      <p className="text-xs text-warning-text">帳號問題已回報，等待修正</p>
                    ) : m.serviceInfo?.email ? (
                      <p className="text-xs text-ink-3">{m.serviceInfo.email}</p>
                    ) : (
                      <p className="text-xs text-ink-4">尚未填寫帳號</p>
                    )}
                  </div>
                  {memberChecks[m.id] && <CheckCircle2 size={16} className="shrink-0 text-success" />}
                </label>
                {m.serviceInfo?.email && !memberChecks[m.id] && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => onOpenServiceIssue(m)}
                      className="flex items-center gap-1 rounded-lg border border-warning/60 px-2.5 py-1 text-xs font-semibold text-warning-text transition-colors hover:bg-warning-subtle"
                    >
                      <AlertTriangle size={11} /> 帳號問題
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 最終確認 */}
        <div className="space-y-3 p-5">
          {!allMembersChecked && (
            <p className="rounded-xl bg-warning-subtle px-4 py-2.5 text-xs font-semibold text-warning-text">
              請先逐一確認所有成員已在外部服務完成設定
            </p>
          )}
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${allMembersChecked ? 'border-line hover:bg-raised' : 'pointer-events-none border-line opacity-40'}`}>
            <input
              type="checkbox"
              checked={finalConfirmed}
              onChange={e => setFinalConfirmed(e.target.checked)}
              disabled={!allMembersChecked}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span className="text-sm font-medium leading-relaxed text-ink">
              我確認所有成員皆已完成外部服務設定，同意平台依此結果進行撥款
            </span>
          </label>
        </div>
      </div>
    </Modal>
  )
}
