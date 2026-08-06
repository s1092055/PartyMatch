import { Eye, EyeOff, Paperclip } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import CredentialWatermark from '../../../../components/ui/primitives/CredentialWatermark'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

// 團主提供帳密的服務（shared_credentials），成員第一次提取後改用這個常駐分頁查看，
// 不用每次都重新走一次「提取帳號資訊」sub-modal；密碼欄位預設遮罩，跟團主端
// buildMemberInfoPanel.jsx 的做法一致，眼睛 icon 切換顯示
export function buildCredentialsPanel({ group, viewerName, viewerAvatarInitial, viewerAvatarColor, viewerPresenceStatus, showPassword, onTogglePassword, issueNote, evidenceUrl }) {
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)

  return {
    content: (
      <div className="p-5">
        {parsedCredentials ? (
          <CredentialWatermark viewerName={viewerName}>
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
                        className="shrink-0 rounded-md p-1 text-ink-4 transition-colors hover:bg-surface hover:text-ink-2"
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
          </CredentialWatermark>
        ) : group.sharedCredentials ? (
          <CredentialWatermark viewerName={viewerName}>
            <p className="whitespace-pre-wrap rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-ink-2">
              {group.sharedCredentials}
            </p>
          </CredentialWatermark>
        ) : (
          <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-ink-4">
            團主尚未提供帳號資訊，請先在群組聊天室詢問團主
          </p>
        )}
        {(parsedCredentials || group.sharedCredentials) && (
          <p className="mt-1.5 text-xs text-ink-4">請勿將帳號資訊截圖、轉傳或提供給群組以外的任何人，違反約定將影響你的信用分數。</p>
        )}
        {issueNote && (
          <div className="relative mt-4 rounded-lg border border-line p-3">
            <div className="flex items-center gap-3">
              <span className="relative inline-block shrink-0">
                <Avatar initial={viewerAvatarInitial} color={viewerAvatarColor} size="sm" />
                <PresenceDot status={viewerPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{viewerName}</p>
                <p className="text-xs text-danger-text">帳號問題已回報，處理中</p>
              </div>
            </div>
            <div className="mt-2 flex items-start gap-2">
              <p className="min-w-0 flex-1 whitespace-pre-line rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink-2">
                {issueNote}
              </p>
              {evidenceUrl && (
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-auto shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-brand hover:bg-brand-subtle"
                >
                  <Paperclip size={11} strokeWidth={1.5} /> 查看附件
                </a>
              )}
            </div>
          </div>
        )}
        <CredentialCommentsSection groupId={group.id} />
      </div>
    ),
  }
}
