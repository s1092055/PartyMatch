import { Eye, EyeOff, KeyRound } from 'lucide-react'
import CredentialWatermark from '../../../../components/ui/primitives/CredentialWatermark'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import MemberIssueCard from './MemberIssueCard'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

// 團主提供帳密的服務（shared_credentials），這個分頁鎖定後就會出現在側邊欄，但不會直接把帳密
// 顯示出來——真正的內容一開始就渲染在背後，只是套模糊＋半透明遮罩，讓人感覺得到「後面有東西」；
// 要先按下正中間的「提取帳號資訊」按鈕（呼叫跟成員自行填寫服務帳號同一套 fillServiceInfo，
// 只是 payload 是固定的 { acknowledged: true }）遮罩才會消失、露出清楚內容，之後每次回來看都會
// 直接顯示，不用重新提取；密碼欄位另外還有預設遮罩，跟團主端 buildMemberInfoPanel.jsx 的做法
// 一致，眼睛 icon 切換顯示
export function buildCredentialsPanel({ group, viewerName, viewerAvatarInitial, viewerAvatarColor, viewerPresenceStatus, showPassword, onTogglePassword, issueNote, evidenceUrl, hasServiceInfo, onExtract, extractLoading }) {
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)

  const credentialsBody = (
    <div className="p-5">
      <p className="mb-2 flex items-center gap-1.5 text-base font-black text-ink"><KeyRound size={15} strokeWidth={1.5} />帳號資訊</p>
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
        <MemberIssueCard
          viewerName={viewerName}
          viewerAvatarInitial={viewerAvatarInitial}
          viewerAvatarColor={viewerAvatarColor}
          viewerPresenceStatus={viewerPresenceStatus}
          issueNote={issueNote}
          evidenceUrl={evidenceUrl}
        />
      )}
      <CredentialCommentsSection groupId={group.id} hostId={group.hostId} />
    </div>
  )

  if (!hasServiceInfo) {
    return {
      content: (
        <div className="relative min-h-full overflow-hidden">
          <div aria-hidden className="pointer-events-none select-none blur-md">
            {credentialsBody}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-[2px]">
            <EmptyState
              icon={KeyRound}
              title="尚未提取帳號資訊"
              description="團主已提供這個服務的帳號密碼，點擊下方按鈕確認取得後即可查看。"
              actionLabel={extractLoading ? '提取中…' : '提取帳號資訊'}
              onAction={extractLoading ? undefined : onExtract}
              actionVariant="ink"
              className="py-0"
            />
          </div>
        </div>
      ),
    }
  }

  return { content: credentialsBody }
}
