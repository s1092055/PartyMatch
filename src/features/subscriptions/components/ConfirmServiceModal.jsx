import { CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import GroupOverviewContent from '../../../components/ui/group/GroupOverviewContent'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'

// 成員端「確認服務」跟團主端 ActivateServiceModal 同一套排版（服務摘要列＋群組資訊＋
// 服務資訊填寫欄位＋最終確認勾選才能送出），只是少了團主那邊「逐一確認每位成員」的清單——
// 那是團主在檢查別人的完成度，成員這裡是自己一個人確認自己的服務體驗。
//
// 團主提供帳密的服務（shared_credentials，例如 Netflix）大家共用同一組帳號密碼，但實際使用時
// 通常會各自切換到不同 Profile 避免互相干擾——這個 Profile 是成員自己選的，不是團主當初提供帳密
// 時就能預先決定的，所以要另外開一個欄位讓成員自己填，跟其他成員自行輸入帳號的服務（Apple ID／
// Google Email／邀請碼等，那些已經在「填寫服務帳號」那一步收集過）是分開的兩件事
export default function ConfirmServiceModal({ isOpen, onClose, onConfirm, group, service, plan, sharingMethod, profileName, setProfileName, confirmed, setConfirmed, loading }) {
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const profileRequired = isSharedCredentials
  const canSubmit = confirmed && (!profileRequired || profileName.trim())
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" height="36rem" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">確認服務</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>確認服務</DialogDescription>
        <DialogBody>
      <div className="animate-step-slide-up flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 服務摘要 */}
        <div className="flex items-center gap-3 border-b border-line-subtle px-5 py-4">
          <ServiceLogo serviceId={group.serviceId} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{group.serviceName}</p>
            <p className="text-xs text-ink-3">{group.planName}</p>
          </div>
          <div className="rounded-lg bg-success-subtle px-3 py-1.5 text-right">
            <p className="text-xs text-success-text">撥款金額</p>
            <p className="text-base font-extrabold text-success-text"><TokenAmount amount={group.escrowTokens} /></p>
          </div>
        </div>

        {/* 群組資訊／群組規則／服務說明／方案說明 */}
        <div className="px-5 pt-5">
          <GroupOverviewContent group={group} service={service} plan={plan} />
        </div>

        {/* 服務資訊：成員自己使用的 Profile 名稱，只有共用帳密的服務才需要填 */}
        {isSharedCredentials && (
          <div className="px-5 pt-4">
            <label className="mb-1.5 block text-xs text-ink-3">你使用的 Profile 名稱</label>
            <Input
              type="text"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="請填寫自己在這個帳號底下使用的 Profile 名稱"
            />
          </div>
        )}

        {/* 最終確認 */}
        <div className="space-y-3 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            />
            <span className="text-sm font-medium leading-relaxed text-ink">
              我確認「{group.serviceName}」服務已可正常使用，同意平台進行撥款，此操作無法撤回
            </span>
          </label>
        </div>
      </div>
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={onConfirm}
            disabled={!canSubmit || loading}
            className="flex-1 rounded-lg"
          >
            {loading ? '確認中…' : '確認服務'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
