import { Eye, EyeOff, Info, KeyRound } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import CredentialWatermark from '../../../../components/ui/primitives/CredentialWatermark'
import CredentialCommentsSection from '../../../../components/ui/group/CredentialCommentsSection'
import MemberIssueCard from './MemberIssueCard'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

export function buildCredentialsPanel(
  {
    group, viewerName, viewerAvatarInitial, viewerAvatarColor, viewerPresenceStatus, showPassword, onTogglePassword,
    issueNote, evidenceUrl, memberProfiles,
  }
) {
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
      {memberProfiles?.length > 0 && (
        <div className="mt-3 space-y-2">
          {memberProfiles.map(({ id, userName, userAvatarInitial, userAvatarColor, userPresenceStatus, profileName, isSelf }) => (
            <div key={id} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="relative inline-block shrink-0">
                  <Avatar initial={userAvatarInitial} color={userAvatarColor} size="sm" />
                  <PresenceDot status={userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{userName}{isSelf ? '（你）' : ''}</p>
                  {!profileName && <p className="text-xs text-ink-4">尚未提取帳號</p>}
                </div>
              </div>
              {profileName && (
                <dl className="mt-2 rounded-lg bg-raised px-3 py-2">
                  <div className="flex items-baseline gap-2 text-xs">
                    <dt className="shrink-0 text-ink-4">Profile 名稱</dt>
                    <dd className="min-w-0 truncate text-ink-2">{profileName}</dd>
                  </div>
                </dl>
              )}
            </div>
          ))}
        </div>
      )}
      {(parsedCredentials || group.sharedCredentials) && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-4">
          <Info size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <p>請勿將帳號資訊截圖、轉傳或提供給群組以外的任何人，違反約定將影響你的信用分數。</p>
        </div>
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

  return { content: credentialsBody }
}
