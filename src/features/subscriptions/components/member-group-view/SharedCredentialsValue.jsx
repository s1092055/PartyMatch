import { Eye, EyeOff, Info } from 'lucide-react'
import CredentialWatermark from '../../../../components/ui/primitives/CredentialWatermark'
import { parseHostCredentials } from '../../../../common/utils/hostCredentialFields'

export function CredentialsValue({ group, viewerName, showPassword, onTogglePassword }) {
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)

  if (parsedCredentials) {
    return (
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
    )
  }

  if (group.sharedCredentials) {
    return (
      <CredentialWatermark viewerName={viewerName}>
        <p className="whitespace-pre-wrap rounded-lg border border-line bg-raised px-3 py-2.5 text-sm text-ink-2">
          {group.sharedCredentials}
        </p>
      </CredentialWatermark>
    )
  }

  return (
    <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-ink-4">
      團主尚未提供帳號資訊，請先在群組聊天室詢問團主
    </p>
  )
}

export function CredentialsPrivacyNote({ visible }) {
  if (!visible) return null
  return (
    <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-4">
      <Info size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <p>請勿將帳號資訊截圖、轉傳或提供給群組以外的任何人，違反約定將影響你的信用分數。</p>
    </div>
  )
}
