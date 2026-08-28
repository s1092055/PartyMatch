import { useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { Button } from '../../../../components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../../../components/ui/collapsible'
import EvidenceLink from '../../../../components/ui/EvidenceLink'
import { PresenceDot } from '../../../../common/layout/components/navShared'
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
  { m, filled, sharingMethod, serviceId, isSharedCredentials, canReportServiceIssue, onOpenServiceIssue }
) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef(null)
  const evidenceUrl = m.disputeEvidenceUrl ?? m.serviceInfoIssueEvidenceUrl
  const hasIssue = !!m.serviceInfoIssueNote
  const showReportButton = canReportServiceIssue && filled && !hasIssue

  useClickOutside(expanded, [cardRef], () => setExpanded(false))

  return (
    <div ref={cardRef} className="relative h-full rounded-lg border border-line p-3">
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
              <span className="relative inline-block shrink-0">
                <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{m.userName}</p>
                <p className="text-xs text-danger-text">帳號問題已回報，等待處理</p>
              </div>
              <ChevronDown size={16} strokeWidth={1.5} className={`shrink-0 text-ink-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
        ) : (
          <div className={`flex items-center gap-3 ${showReportButton ? 'pr-24' : ''}`}>
            <span className="relative inline-block shrink-0">
              <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
              <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{m.userName}</p>
              {!filled && (
                <p className="text-xs text-ink-4">{isSharedCredentials ? '尚未提取帳號' : '尚未填寫帳號'}</p>
              )}
            </div>
          </div>
        )}
        {!hasIssue && filled && (
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
    </div>
  )
}
