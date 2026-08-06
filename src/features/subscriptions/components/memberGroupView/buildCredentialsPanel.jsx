import { Eye, EyeOff } from 'lucide-react'
import CredentialWatermark from '../../../../components/ui/primitives/CredentialWatermark'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

// 團主提供帳密的服務（shared_credentials），成員第一次提取後改用這個常駐分頁查看，
// 不用每次都重新走一次「提取帳號資訊」sub-modal；密碼欄位預設遮罩，跟團主端
// buildMemberInfoPanel.jsx 的做法一致，眼睛 icon 切換顯示
export function buildCredentialsPanel({ group, viewerName, showPassword, onTogglePassword }) {
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
        <CredentialCommentsSection groupId={group.id} />
      </div>
    ),
  }
}
