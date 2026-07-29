import { AlertTriangle, FileText, Paperclip } from 'lucide-react'
import Avatar from '../../../../shared/ui/primitives/Avatar'
import EmptyState from '../../../../shared/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../shared/ui/group/panelLayout'
import { getTextFields, hasFilledServiceInfo } from '../../../../shared/utils/serviceInfoFields'
import { parseHostCredentials } from '../../../../shared/utils/hostCredentialFields'

// 團主查看成員填寫的服務帳號資訊；跟 ActivateServiceModal 裡的成員清單同一套判斷邏輯，
// 差別是這裡不限「待啟用」階段才看得到，鎖定群組後任何時候都可以來確認填寫進度。
// 內容直接把每個欄位拆開列出（不是壓縮成一行摘要），團主要核對帳號資訊時看得更清楚。
// 「帳號問題」回報按鈕則限縮在 canReportServiceIssue（啟用服務之前）才顯示——
// 一旦服務啟用，成員已經確認帳號能正常使用，「帳號資訊有誤」這個理由就不成立了
function renderFilledInfoDetail(serviceInfo, sharingMethod) {
  const textFields = getTextFields(sharingMethod)

  if (textFields.length === 0) {
    // 只有 checkbox 欄位（例如 shared_credentials）沒有實際內容可列，回報已確認
    return <p className="text-xs text-success-text">已確認取得帳號資訊</p>
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

export function buildMemberInfoPanel({ members, sharingMethod, sharedCredentials, serviceId, canReportServiceIssue, onOpenServiceIssue }) {
  const parsedCredentials = parseHostCredentials(sharedCredentials, serviceId)
  return {
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {sharingMethod === 'shared_credentials' && (
          <div className="mb-3 rounded-xl border border-line bg-raised p-3">
            <p className="mb-1 text-xs font-semibold text-ink-3">你提供給成員的帳號資訊</p>
            {parsedCredentials ? (
              <dl className="space-y-1">
                {parsedCredentials.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-2 text-sm">
                    <dt className="shrink-0 text-ink-4">{label}</dt>
                    <dd className="min-w-0 truncate text-ink-2">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : sharedCredentials ? (
              <p className="whitespace-pre-wrap text-sm text-ink-2">{sharedCredentials}</p>
            ) : (
              <p className="text-sm text-ink-4">尚未提供，鎖定群組時可以填寫</p>
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
              const filled = hasFilledServiceInfo(m.serviceInfo, sharingMethod)
              return (
                <div
                  key={m.id}
                  className={`relative rounded-xl border p-3 ${
                    m.serviceInfoIssueNote ? 'border-warning/40 bg-warning-subtle' : 'border-line'
                  }`}
                >
                  {canReportServiceIssue && filled && !m.serviceInfoIssueNote && (
                    <button
                      onClick={() => onOpenServiceIssue(m)}
                      className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-warning/60 px-2.5 py-1 text-xs font-semibold text-warning-text transition-all hover:-translate-y-0.5 hover:bg-warning-subtle"
                    >
                      <AlertTriangle size={11} /> 帳號問題
                    </button>
                  )}
                  <div className={`flex items-center gap-3 ${canReportServiceIssue ? 'pr-24' : ''}`}>
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>
                      {m.serviceInfoIssueNote ? (
                        <p className="text-xs text-warning-text">帳號問題已回報，等待修正</p>
                      ) : !filled ? (
                        <p className="text-xs text-ink-4">尚未填寫帳號</p>
                      ) : null}
                    </div>
                  </div>
                  {!m.serviceInfoIssueNote && filled && (
                    <div className="mt-2 rounded-lg bg-raised px-3 py-2">
                      {renderFilledInfoDetail(m.serviceInfo, sharingMethod)}
                    </div>
                  )}
                  {m.serviceInfoIssueNote && (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-raised px-3 py-2">
                      <p className="text-xs text-ink-2">{m.serviceInfoIssueNote}</p>
                      {m.serviceInfoIssueEvidenceUrl && (
                        <a
                          href={m.serviceInfoIssueEvidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          <Paperclip size={11} /> 查看附件
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    ),
  }
}
