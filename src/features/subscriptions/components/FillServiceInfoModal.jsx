import { CheckCircle2, ClipboardEdit } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import CredentialWatermark from '../../../components/ui/primitives/CredentialWatermark'
import { getServiceInfoSummary, isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
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
  }
) {
  const existingSummary = getServiceInfoSummary(serviceInfo, sharingMethod)
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const modalTitle = isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <ClipboardEdit size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">{modalTitle}</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>{modalTitle}</DialogDescription>
        <DialogBody>
      <form onSubmit={onSubmit} className="animate-step-slide-up p-5 space-y-4">
        <p className="text-sm text-ink-3">
          {isSharedCredentials
            ? <>團主已提供 <span className="font-semibold text-ink">{group.serviceName}</span> 的帳號資訊，請取得後確認可以登入。</>
            : <>請填寫你用於 <span className="font-semibold text-ink">{group.serviceName}</span> 的服務資訊，團主將使用此資訊幫你設定訂閱。</>}
        </p>
        {sharingMethodConfig.notice && (
          <div className="rounded-lg bg-warning-subtle px-3 py-2 text-xs leading-relaxed text-warning-text">
            {sharingMethodConfig.notice}
          </div>
        )}
        {isSharedCredentials && (
          <div>
            <label className="block text-xs text-ink-3 mb-1.5">團主提供的帳號資訊</label>
            {parsedCredentials ? (
              <CredentialWatermark viewerName={viewerName}>
                <dl className="space-y-1 rounded-lg border border-line bg-raised px-3 py-2.5">
                  {parsedCredentials.map(({ label, value }) => (
                    <div key={label} className="flex items-baseline gap-2 text-sm">
                      <dt className="shrink-0 text-ink-4">{label}</dt>
                      <dd className="min-w-0 truncate text-ink-2">{value}</dd>
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
          </div>
        )}
        {existingSummary && (
          <div className="rounded-lg bg-success-subtle px-3 py-2 text-sm text-success-text flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" /> 目前已填：{existingSummary}
          </div>
        )}
        {sharingMethodConfig.fields.map(({ key, label, type, placeholder }) => (
          type === 'checkbox' ? (
            <label key={key} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
              <input
                type="checkbox"
                checked={!!fillValues[key]}
                onChange={e => setFillValues(prev => ({ ...prev, [key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              {label}
            </label>
          ) : (
            <div key={key}>
              <label className="block text-xs text-ink-3 mb-1.5">{label}</label>
              <Input
                type={type}
                value={fillValues[key] ?? ''}
                onChange={e => setFillValues(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                required
              />
            </div>
          )
        ))}
        <Button
          type="submit"
          disabled={!fillValid || fillLoading}
          className="w-full rounded-lg"
        >
          {fillLoading ? '送出中…' : isSharedCredentials ? '確認已取得帳號資訊' : '送出帳號資訊'}
        </Button>
      </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
