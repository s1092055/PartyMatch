import { Radio } from 'lucide-react'
import Modal from '../../../shared/ui/Modal'

export default function ActivateGroupModal({ isOpen, onClose, paymentAccount, setPaymentAccount, members, onConfirm }) {
  function handleClose() {
    onClose()
    setPaymentAccount('')
  }

  function handleConfirm() {
    const account = paymentAccount.trim()
    if (!account) return
    setPaymentAccount('')
    onConfirm(account)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="啟用群組"
      icon={<Radio size={18} className="text-success" />}
      height="min(520px, 90vh)"
      sub
      footer={
        <div className="flex gap-2 w-full">
          <button
            onClick={handleClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
          >取消</button>
          <button
            onClick={handleConfirm}
            disabled={!paymentAccount.trim()}
            className="flex-1 rounded-xl bg-success py-2.5 text-sm font-bold text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
          >確認啟用</button>
        </div>
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-5 py-4">
        <p className="text-sm text-ink-3">啟用後將開啟群組聊天室，系統會通知所有成員進行付款。</p>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-2">
            收款帳號資訊<span className="ml-0.5 text-danger">*</span>
          </label>
          <textarea
            rows={3}
            placeholder={`例如：\n台新銀行 帳號 0123-4567-8901\n戶名：王小明`}
            value={paymentAccount}
            onChange={e => setPaymentAccount(e.target.value)}
            maxLength={300}
            className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <p className="mt-1 pl-1 text-xs text-ink-4">成員付款時將看到此資訊，請確認正確後再啟用</p>
        </div>
        {members.length > 0 && (
          <div className="rounded-xl bg-raised p-3 space-y-1.5">
            <p className="text-xs font-semibold text-ink-3 mb-2">即將通知以下成員</p>
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white"
                  style={{ background: m.userAvatarColor }}
                >
                  {m.userAvatarInitial}
                </span>
                <p className="text-sm text-ink">{m.userName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
