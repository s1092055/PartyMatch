import { CheckCircle2, Eye, EyeOff, FileText, KeyRound } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../components/ui/group/panelLayout'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import MemberIssueCard from './MemberIssueCard'
import { hasFilledServiceInfo, isSharedCredentialsMethod } from '../../../../common/utils/serviceInfoFields'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

export function buildMemberInfoPanel(
  { groupId, hostId, groupStatus, members, sharingMethod, sharedCredentials, serviceId, canReportServiceIssue, onOpenServiceIssue, onResolveDispute, showPassword, onTogglePassword }
) {
  const parsedCredentials = parseHostCredentials(sharedCredentials, serviceId)
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  return {
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {isSharedCredentials && (
          <div className="mb-3 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-base font-black text-ink"><KeyRound size={15} strokeWidth={1.5} />帳號資訊</p>
            {parsedCredentials ? (
              <dl className="space-y-1 rounded-lg border border-line bg-raised px-3 py-2.5">
                {parsedCredentials.map(({ key, label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-2 text-sm">
                    <dt className="shrink-0 text-ink-4">{label}</dt>
                    {key === 'password' ? (
                      <dd className="flex min-w-0 items-center gap-1.5 text-right text-ink-2">
                        <span className="truncate">{showPassword ? value : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={onTogglePassword}
                          className="shrink-0 rounded-control p-1 text-ink-4 transition-colors hover:bg-surface hover:text-ink-2"
                        >
                          {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                        </button>
                      </dd>
                    ) : (
                      <dd className="min-w-0 truncate text-right text-ink-2">{value}</dd>
                    )}
                  </div>
                ))}
              </dl>
            ) : sharedCredentials ? (
              <p className="whitespace-pre-wrap rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-ink-2">{sharedCredentials}</p>
            ) : (
              <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-ink-4">尚未提供</p>
            )}
          </div>
        )}
        {members.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={FileText} title="目前尚無成員" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => {
              const canResolve = groupStatus === 'disputed' && !!m.serviceInfoIssueNote
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <MemberIssueCard
                      m={m}
                      filled={hasFilledServiceInfo(m.serviceInfo, sharingMethod, serviceId)}
                      sharingMethod={sharingMethod}
                      serviceId={serviceId}
                      isSharedCredentials={isSharedCredentials}
                      canReportServiceIssue={canReportServiceIssue}
                      onOpenServiceIssue={onOpenServiceIssue}
                    />
                  </div>
                  {canResolve && (
                    <Button
                      onClick={() => onResolveDispute(m)}
                      className="flex h-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-success/60 bg-transparent px-3 text-xs text-success-text hover:bg-success-subtle"
                    >
                      <CheckCircle2 strokeWidth={1.5} size={13} />
                      處理完成
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {isSharedCredentials && <CredentialCommentsSection groupId={groupId} hostId={hostId} />}
      </div>
    ),
  }
}
