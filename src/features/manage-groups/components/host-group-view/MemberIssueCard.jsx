import { useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ShieldAlert } from 'lucide-react'
import { AvatarWithPresence } from '../../../../components/ui/avatar'
import { Button } from '../../../../components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../../../components/ui/collapsible'
import CountdownText from '../../../../components/ui/primitives/CountdownText'
import EvidenceLink from '../../../../components/ui/EvidenceLink'
import DisputeResponseModal from './DisputeResponseModal'
import { getTextFields } from '../../../../common/utils/serviceInfoFields'
import { useClickOutside } from '../../../../common/utils/hooks'

function renderFilledInfoDetail(serviceInfo, sharingMethod, serviceId) {
  const textFields = getTextFields(sharingMethod, serviceId)

  if (textFields.length === 0) {
    return <p className="text-xs text-success-text">已確認取得帳號資訊</p>;
  }

  return (
    <dl className="space-y-1">
      {textFields.map(({ key, label }) => (
        <div key={key} className="flex items-baseline gap-2 text-xs">
          <dt className="shrink-0 text-ink-4">{label}</dt>
          <dd className="min-w-0 truncate text-ink-2">{serviceInfo[key] || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function MemberIssueCard(
  {
    m, filled, sharingMethod, serviceId, isSharedCredentials, canReportServiceIssue, onOpenServiceIssue,
    canResolve, onResolveDispute, onEscalateDispute,
  }
) {
  const [expanded, setExpanded] = useState(false)
  const [responseModal, setResponseModal] = useState(null)
  const cardRef = useRef(null)
  const evidenceUrl = m.disputeEvidenceUrl ?? m.serviceInfoIssueEvidenceUrl
  const hasIssue = !!m.serviceInfoIssueNote
  const showReportButton = canReportServiceIssue && filled && !hasIssue

  useClickOutside(expanded, [cardRef], () => setExpanded(false))

  async function handleSubmitResponse(note) {
    if (responseModal === 'resolve') await onResolveDispute?.(m.id, note)
    else await onEscalateDispute?.(m.id, note)
    setResponseModal(null)
  }

  return (
    <div ref={cardRef} className="relative rounded-lg border border-line p-3">
      {showReportButton && (
        <Button
          variant="ghost"
          onClick={() => onOpenServiceIssue(m)}
          className="absolute right-3 top-3 h-auto rounded-lg border border-warning/60 px-2.5 py-1 text-xs text-warning-text hover:bg-warning-subtle"
        >
          <AlertTriangle strokeWidth={1.5} size={11} /> 帳號問題
        </Button>
      )}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {hasIssue ? (
          <CollapsibleTrigger asChild>
            <button type="button" className={`flex w-full items-center gap-3 text-left ${showReportButton ? 'pr-24' : ''}`}>
              <AvatarWithPresence initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" presenceStatus={m.userPresenceStatus} dotClassName="h-2.5 w-2.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{m.userName}</p>
                <p className="text-xs text-danger-text">
                  帳號問題已回報，等待處理
                  {m.disputeDeadline && (
                    <>，剩餘 <CountdownText deadline={m.disputeDeadline} /></>
                  )}
                </p>
              </div>
              <ChevronDown size={16} strokeWidth={1.5} className={`shrink-0 text-ink-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
        ) : (
          <div className={`flex items-center gap-3 ${showReportButton ? 'pr-24' : ''}`}>
            <AvatarWithPresence initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" presenceStatus={m.userPresenceStatus} dotClassName="h-2.5 w-2.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{m.userName}</p>
              {!filled && (
                <p className="text-xs text-ink-4">{isSharedCredentials ? '尚未提取帳號' : '尚未填寫帳號'}</p>
              )}
              {filled && m.confirmedAt && (
                <p className="flex items-center gap-1 text-xs text-success-text">
                  <CheckCircle2 size={11} strokeWidth={1.5} /> 已確認服務
                </p>
              )}
              {filled && !m.confirmedAt && m.confirmDeadline && (
                <p className="text-xs text-info-text">確認期剩餘 <CountdownText deadline={m.confirmDeadline} /></p>
              )}
            </div>
          </div>
        )}
        {filled && (
          <div className="mt-2 rounded-lg bg-raised px-3 py-2">
            {renderFilledInfoDetail(m.serviceInfo, sharingMethod, serviceId)}
          </div>
        )}
        {hasIssue && (
          <CollapsibleContent>
            <div className="mt-2 flex items-start gap-2">
              <p className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-2">
                {m.serviceInfoIssueNote}
              </p>
              <EvidenceLink
                url={evidenceUrl}
                className="flex h-auto shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-brand hover:bg-brand-subtle"
              />
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
      {canResolve && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            onClick={() => setResponseModal('resolve')}
            className="rounded-lg border border-success/60 text-xs text-success-text hover:bg-success-subtle"
          >
            <Check strokeWidth={1.5} size={13} /> 處理完成
          </Button>
          <Button
            variant="ghost"
            onClick={() => setResponseModal('escalate')}
            className="rounded-lg border border-danger/60 text-xs text-danger-text hover:bg-danger-subtle"
          >
            <ShieldAlert strokeWidth={1.5} size={13} /> 不實回報
          </Button>
        </div>
      )}
      {responseModal && (
        <DisputeResponseModal
          isOpen
          mode={responseModal}
          onClose={() => setResponseModal(null)}
          onSubmit={handleSubmitResponse}
        />
      )}
    </div>
  )
}
