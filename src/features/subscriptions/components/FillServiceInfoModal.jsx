import { useState } from 'react'
import { ClipboardEdit, Eye, EyeOff, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import CredentialWatermark from '../../../components/ui/primitives/CredentialWatermark'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
import { parseHostCredentials } from '../../../common/utils/hostCredentialFields'

export default function FillServiceInfoModal(
  {
    isOpen,
    onClose,
    group,
    serviceInfo,
    sharingMethod,
    sharingMethodConfig,
    fillValues,
    setFillValues,
    fillValid,
    fillLoading,
    onSubmit,
    viewerName,
    hasServiceInfoIssue,
    issueNote,
  }
) {
  const [showPassword, setShowPassword] = useState(false)
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const modalTitle = hasServiceInfoIssue ? '修正帳號資訊' : isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'
  const hasProfileField = sharingMethodConfig.fields.some(({ key }) => key === 'memberProfileName')
  const issueBanner = hasServiceInfoIssue && (
    <div className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-text">
      回報問題：{issueNote}，請修正後重新送出。
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <ClipboardEdit strokeWidth={1.5} size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">{modalTitle}</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>{modalTitle}</DialogDescription>
        {sharingMethodConfig.notice && (
          <div className="flex items-center justify-center bg-warning-subtle px-6 py-3 text-center text-sm font-extrabold text-warning-text">
            {sharingMethodConfig.bannerNotice ?? sharingMethodConfig.notice}
          </div>
        )}
        <DialogBody>
      <form onSubmit={onSubmit} className="animate-step-slide-up p-5 space-y-4">
        {isSharedCredentials && (
          <div>
            <p className="mb-1.5 text-xs text-ink-3">團主提供 {group.serviceName} 的帳號資訊</p>
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
                            onClick={() => setShowPassword(v => !v)}
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
            {(parsedCredentials || group.sharedCredentials) && (
              <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink-4">
                <Info size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <p>請勿將帳號資訊截圖、轉傳或提供給群組以外的任何人，違反約定將影響你的信用分數。</p>
              </div>
            )}
          </div>
        )}
        {!hasServiceInfoIssue && !isSharedCredentials && (
          <p className="text-sm text-ink-3">
            請填寫你用於 <span className="font-semibold text-ink">{group.serviceName}</span> 的服務資訊，團主將使用此資訊幫你設定訂閱。
          </p>
        )}
        {!hasProfileField && issueBanner}
        {sharingMethodConfig.fields.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            {type === 'checkbox' ? (
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={!!fillValues[key]}
                  onChange={e => setFillValues(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                />
                {label}
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-ink-3">{label}</span>
                  {serviceInfo?.[key] && <span className="text-ink-4">目前已填：{serviceInfo[key]}</span>}
                </span>
                <Input
                  type={type}
                  value={fillValues[key] ?? ''}
                  onChange={e => setFillValues(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                />
              </label>
            )}
            {key === 'memberProfileName' && issueBanner && (
              <div className="mt-1.5">{issueBanner}</div>
            )}
          </div>
        ))}
        <Button
          type="submit"
          disabled={!fillValid || fillLoading}
          className="w-full rounded-lg"
        >
          {fillLoading ? '送出中…' : hasServiceInfoIssue ? '重新送出' : isSharedCredentials ? '確認已取得帳號資訊' : '送出帳號資訊'}
        </Button>
      </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
