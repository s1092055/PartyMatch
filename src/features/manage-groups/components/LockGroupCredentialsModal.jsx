import { Lock } from 'lucide-react'
import Modal from '../../../shared/ui/primitives/Modal'
import { getHostCredentialFields, CREDENTIAL_RISK_NOTICE } from '../../../shared/utils/hostCredentialFields'

// 鎖定群組時，官方無多人邀請機制的服務改成填這個結構化表單（取代原本的自由文字 textarea），
// 跟成員端「填寫服務帳號」sub-modal 同一套堆疊模式
export default function LockGroupCredentialsModal({ isOpen, onClose, serviceId, serviceName, values, setValues, onSubmit, loading }) {
  const config = getHostCredentialFields(serviceId)
  const valid  = config.fields.every(({ key }) => !!values[key]?.trim())

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="鎖定群組"
      icon={<Lock size={18} strokeWidth={1.5} className="text-ink-2" />}
      maxWidth="max-w-lg"
      sub
      instantEntry
    >
      <form onSubmit={onSubmit} className="animate-step-slide-up p-5 space-y-4">
        <p className="text-sm text-ink-3">
          <span className="font-semibold text-ink">{serviceName}</span> 官方沒有多人邀請機制，鎖定群組後請提供以下帳號資訊，成員填寫服務帳號時會直接看到。
        </p>
        <div className="rounded-lg bg-danger-subtle px-3 py-2 text-xs leading-relaxed text-danger-text">
          {CREDENTIAL_RISK_NOTICE}
        </div>
        {config.warning && (
          <div className="rounded-lg bg-warning-subtle px-3 py-2 text-xs leading-relaxed text-warning-text">
            {config.warning}
          </div>
        )}
        {config.fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-ink-3 mb-1.5">{label}</label>
            <input
              type="text"
              value={values[key] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              required
              className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={!valid || loading}
          className="w-full rounded-xl bg-ink-2 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-40 disabled:pointer-events-none"
        >
          {loading ? '鎖定中…' : '確認鎖定群組'}
        </button>
      </form>
    </Modal>
  )
}
