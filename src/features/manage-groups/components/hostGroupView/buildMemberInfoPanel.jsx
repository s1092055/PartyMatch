import { CheckCircle2, Eye, EyeOff, FileText, KeyRound } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../components/ui/group/panelLayout'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import MemberIssueCard from './MemberIssueCard'
import { hasFilledServiceInfo, isSharedCredentialsMethod } from '../../../../common/utils/serviceInfoFields'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

// 團主查看成員填寫的服務帳號資訊；跟 ActivateServiceModal 裡的成員清單同一套判斷邏輯，
// 差別是這裡不限「待啟用」階段才看得到，鎖定群組後任何時候都可以來確認填寫進度。
// 「帳號問題」回報按鈕則限縮在 canReportServiceIssue（啟用服務之前）才顯示——
// 一旦服務啟用，成員已經確認帳號能正常使用，「帳號資訊有誤」這個理由就不成立了
export function buildMemberInfoPanel({ groupId, groupStatus, members, sharingMethod, sharedCredentials, serviceId, canReportServiceIssue, onOpenServiceIssue, onResolveDispute, showPassword, onTogglePassword }) {
  const parsedCredentials = parseHostCredentials(sharedCredentials, serviceId)
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  return {
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {isSharedCredentials && (
          <div className="mb-3 rounded-lg border border-line bg-raised p-3">
            <p className="mb-2 flex items-center gap-1.5 text-base font-black text-ink"><KeyRound size={15} strokeWidth={1.5} />帳號資訊</p>
            {parsedCredentials ? (
              <dl className="space-y-1">
                {parsedCredentials.map(({ key, label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-2 text-sm">
                    <dt className="shrink-0 text-ink-4">{label}</dt>
                    {key === 'password' ? (
                      <dd className="flex min-w-0 items-center gap-1.5 text-right text-ink-2">
                        <span className="truncate">{showPassword ? value : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={onTogglePassword}
                          className="shrink-0 rounded-md p-1 text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
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
              <p className="whitespace-pre-wrap text-sm text-ink-2">{sharedCredentials}</p>
            ) : (
              <p className="text-sm text-ink-4">尚未提供</p>
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
                      filled={hasFilledServiceInfo(m.serviceInfo, sharingMethod)}
                      sharingMethod={sharingMethod}
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
                      <CheckCircle2 size={13} />
                      處理完成
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {isSharedCredentials && <CredentialCommentsSection groupId={groupId} />}
      </div>
    ),
  }
}
