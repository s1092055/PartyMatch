import { CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import GroupOverviewContent from '../../../components/ui/group/GroupOverviewContent'

export default function ConfirmServiceModal(
  { isOpen, onClose, onConfirm, group, service, plan, confirmed, setConfirmed, loading }
) {
  const canSubmit = confirmed
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent variant="panel" maxWidth="max-w-lg" height="36rem" instant>
        <DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <CheckCircle2 strokeWidth={1.5} size={18} className="shrink-0 text-brand" />
            <DialogTitle className="truncate text-base">確認服務</DialogTitle>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>確認服務</DialogDescription>
        <DialogBody>
      <div className="animate-step-slide-up flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

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

        <div className="px-5 pt-5">
          <GroupOverviewContent group={group} service={service} plan={plan} />
        </div>

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
  );
}
