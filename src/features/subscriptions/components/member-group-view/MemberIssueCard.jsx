import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../../../components/ui/collapsible'
import EvidenceLink from '../../../../components/ui/EvidenceLink'

export default function MemberIssueCard(
  { viewerName, viewerAvatarInitial, viewerAvatarColor, viewerPresenceStatus, issueNote, evidenceUrl }
) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-4 rounded-lg border border-line p-3">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center gap-3 text-left">
            <span className="relative inline-block shrink-0">
              <Avatar initial={viewerAvatarInitial} color={viewerAvatarColor} size="sm" />
              <PresenceDot status={viewerPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{viewerName}</p>
              <p className="text-xs text-danger-text">帳號問題已回報，處理中</p>
            </div>
            <ChevronDown size={16} strokeWidth={1.5} className={`shrink-0 text-ink-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 flex items-start gap-2">
            <p className="min-w-0 flex-1 whitespace-pre-line rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-2">
              {issueNote}
            </p>
            <EvidenceLink
              url={evidenceUrl}
              className="flex h-auto shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-brand hover:bg-brand-subtle"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
