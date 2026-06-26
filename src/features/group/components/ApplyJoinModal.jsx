import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Modal from '../../../shared/ui/Modal'
import Button from '../../../shared/ui/Button'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { createApplication } from '../../../shared/stores/applicationStore'

export default function ApplyJoinModal({ group, isOpen, onClose, onSuccess, onDone }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!agreed) return
    createApplication({
      groupId: group.id,
      groupName: group.groupName || group.serviceName,
      serviceId: group.serviceId,
      serviceName: group.serviceName,
      planName: group.planName,
      hostId: group.hostId,
      hostName: group.hostName,
      hostAvatarInitial: group.hostAvatarInitial,
      hostAvatarColor: group.hostAvatarColor,
      message,
    })
    setSubmitted(true)
    onSuccess?.()
  }

  function handleClose() {
    setMessage('')
    setAgreed(false)
    setSubmitted(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen && !!group} onClose={handleClose} title="申請加入群組" sub>
      {submitted ? (
        <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-success-subtle flex items-center justify-center">
            <CheckCircle2 size={26} className="text-success" />
          </div>
          <p className="text-base font-bold text-ink">申請已送出！</p>
          <p className="text-sm text-ink-3">等待團主審核後即可加入，請留意通知。</p>
          <Button variant="primary" size="md" className="mt-2 min-w-[7rem]" onClick={() => { navigate('/my-subscriptions', { state: { tab: 'processing' } }); window.dispatchEvent(new CustomEvent('pm:set-sub-tab', { detail: { tab: 'processing' } })); handleClose(); onDone?.(); }}>
            確認
          </Button>
        </div>
      ) : (
        <>
          
          <div className="px-5 pt-4 pb-3 bg-canvas border-b border-line-subtle">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ServiceLogo serviceId={group?.serviceId} size={36} className="shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{group?.serviceName}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{group?.planName}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-extrabold text-brand">NT${group?.pricePerSeat}</span>
                <span className="text-xs text-ink-3"> /月</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
              <span>
                團主：<span className="text-ink-2 font-medium">{group?.hostName}</span>
              </span>
              <span>
                剩餘名額：<span className="text-ink-2 font-medium">{group?.openSeats} 席</span>
              </span>
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                申請備註
                <span className="ml-1 text-ink-4 font-normal">（選填）</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="可以介紹自己或說明申請原因…"
                className="field w-full resize-none px-3 py-2.5 text-sm placeholder:text-ink-4"
              />
            </div>

<label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand cursor-pointer shrink-0"
              />
              <span className="text-sm text-ink-2">
                我已閱讀並同意此群組的所有規則與付款條件
              </span>
            </label>

<div className="flex gap-3 pt-1">
              <Button variant="ghost" size="md" className="flex-1 border border-line" onClick={handleClose}>
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!agreed}
                onClick={handleSubmit}
              >
                送出申請
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
