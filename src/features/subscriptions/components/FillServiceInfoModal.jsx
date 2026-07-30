import { CheckCircle2, ClipboardEdit } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import CredentialWatermark from '../../../shared/ui/primitives/CredentialWatermark'
import { getServiceInfoSummary } from '../../../shared/utils/serviceInfoFields'
import { parseHostCredentials } from '../../../shared/utils/hostCredentialFields'

// 填寫服務帳號改成堆疊在群組詳情 Modal 上方的 sub-modal（跟團主端 ActivateServiceModal 同一套模式），
// 而不是側邊欄那種切換內容的 subPanel——關閉時只會回到底下的群組詳情，不會像 subPanel 一樣
// 需要另外按返回鍵才能回到概覽畫面
export default function FillServiceInfoModal({
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
}) {
  const existingSummary = getServiceInfoSummary(serviceInfo, sharingMethod)
  const parsedCredentials = parseHostCredentials(group.sharedCredentials, group.serviceId)

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <ClipboardEdit size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">填寫服務帳號</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>填寫服務帳號</DialogDescription>
        <DialogBody>
      <form onSubmit={onSubmit} className="animate-step-slide-up p-5 space-y-4">
        <p className="text-sm text-ink-3">
          請填寫你用於 <span className="font-semibold text-ink">{group.serviceName}</span> 的服務資訊，團主將使用此資訊幫你設定訂閱。
        </p>
        {sharingMethodConfig.notice && (
          <div className="rounded-lg bg-warning-subtle px-3 py-2 text-xs leading-relaxed text-warning-text">
            {sharingMethodConfig.notice}
          </div>
        )}
        {sharingMethod === 'shared_credentials' && (
          <div>
            <label className="block text-xs text-ink-3 mb-1.5">團主提供的帳號資訊</label>
            {parsedCredentials ? (
              <CredentialWatermark viewerName={viewerName}>
                <dl className="space-y-1 rounded-xl border border-line bg-raised px-3 py-2.5">
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
                <p className="whitespace-pre-wrap rounded-xl border border-line bg-raised px-3 py-2.5 text-sm text-ink-2">
                  {group.sharedCredentials}
                </p>
              </CredentialWatermark>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-ink-4">
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
              <input
                type={type}
                value={fillValues[key] ?? ''}
                onChange={e => setFillValues(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )
        ))}
        <Button
          type="submit"
          disabled={!fillValid || fillLoading}
          className="w-full rounded-xl"
        >
          {fillLoading ? '送出中…' : '送出帳號資訊'}
        </Button>
      </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
