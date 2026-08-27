import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, CreditCard, PencilLine, Users, AlertTriangle } from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'
import ProgressBar from '../../../shared/components/ui/ProgressBar'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { updateGroup } from '../../../shared/stores/groupStore'

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-line-subtle bg-surface-soft p-3">
      <p className="text-xs font-semibold text-ink-3">{label}</p>
      <div className="mt-1 text-sm font-bold text-ink">{value}</div>
    </div>
  )
}

export default function EditGroupModal({ isOpen, onClose, group, members, onDangerAction, onSaved }) {
  const paidCount = members.filter(m => m.paymentStatus === 'paid').length
  const totalCount = members.length

  const [form, setForm] = useState({
    description:  group?.description  ?? '',
    requirements: group?.requirements ?? '',
    joinMode:     group?.joinMode     ?? 'approval',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined
    function handleKeyDown(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!group) return null

  function handleSave() {
    updateGroup(group.id, {
      description:  form.description,
      requirements: form.requirements,
      joinMode:     form.joinMode,
    })
    setSaved(true)
    onSaved?.()
    setTimeout(() => setSaved(false), 2000)
  }

  const isDirty =
    form.description  !== (group.description  ?? '') ||
    form.requirements !== (group.requirements ?? '') ||
    form.joinMode     !== (group.joinMode     ?? 'approval')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="編輯群組"
      titleIcon={<PencilLine size={16} className="text-brand" />}
      maxWidth="max-w-2xl"
    >
      <div className="max-h-[75vh] overflow-y-auto p-5">
        {/* Group header */}
        <div className="flex items-start gap-3 rounded-2xl bg-raised p-4">
          <ServiceLogo serviceId={group.serviceId} size={42} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-ink">{group.serviceName}</p>
              <Badge variant={group.status} />
            </div>
            <p className="mt-1 text-sm text-ink-3">{group.planName}</p>
          </div>
        </div>

        {/* Read-only details */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailItem label="每人費用" value={`NT$${group.pricePerSeat} / ${group.billingCycle === 'yearly' ? '年' : '月'}`} />
          <DetailItem
            label="成員數"
            value={(
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-ink-3" />
                {group.usedSeats} / {group.totalSeats} 人
              </span>
            )}
          />
          {group.nextBillingDate && (
            <DetailItem
              label="下次續訂日"
              value={(
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-ink-3" />
                  {group.nextBillingDate}
                </span>
              )}
            />
          )}
          <DetailItem
            label="本期收款進度"
            value={(
              <span className="inline-flex items-center gap-1.5">
                <CreditCard size={14} className="text-ink-3" />
                {paidCount} / {totalCount} 已收
              </span>
            )}
          />
        </div>

        {totalCount > 0 && (
          <div className="mt-4 rounded-2xl border border-line-subtle p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink-2">本期收款進度</span>
              <span className={`font-extrabold ${paidCount === totalCount ? 'text-success-text' : 'text-ink-2'}`}>
                {paidCount} / {totalCount} 已收
              </span>
            </div>
            <ProgressBar value={paidCount} max={totalCount} color={paidCount === totalCount ? 'bg-success' : 'bg-brand'} />
          </div>
        )}

        {/* Editable fields */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">群組說明</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="描述你的群組，讓申請者更了解你的要求…"
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:border-brand focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">申請須知</label>
            <textarea
              rows={2}
              value={form.requirements}
              onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
              placeholder="對申請成員的要求或注意事項…"
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:border-brand focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">加入方式</label>
            <div className="flex gap-3">
              {[
                { value: 'approval', label: '審核制', desc: '由你審核每位申請者' },
                { value: 'instant',  label: '立即加入', desc: '有空位即可直接加入' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, joinMode: opt.value }))}
                  className={`flex-1 rounded-2xl border p-3 text-left transition-colors ${
                    form.joinMode === opt.value
                      ? 'border-brand bg-brand-subtle'
                      : 'border-line hover:bg-raised'
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.joinMode === opt.value ? 'text-brand' : 'text-ink'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        {(group.status === 'recruiting' || group.status === 'active') && (
          <div className="mt-5 rounded-2xl border border-danger/30 bg-red-50/50 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-danger">
              <AlertTriangle size={14} />
              危險操作
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {group.status === 'recruiting' && (
                <>
                  <button
                    onClick={() => onDangerAction('pause')}
                    className="flex-1 rounded-xl border border-amber-400 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
                  >
                    暫停招募
                  </button>
                  <button
                    onClick={() => onDangerAction('cancel')}
                    className="flex-1 rounded-xl border border-danger/50 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
                  >
                    解散群組
                  </button>
                </>
              )}
              {group.status === 'active' && (
                <button
                  onClick={() => onDangerAction('stop')}
                  className="flex-1 rounded-xl border border-danger/50 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
                >
                  停止服務
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-line-subtle p-5">
        <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
          關閉
        </Button>
        <Button
          size="md"
          onClick={handleSave}
          disabled={!isDirty && !saved}
          className="flex-1 gap-1.5"
        >
          {saved ? <><CheckCircle2 size={15} /> 已儲存</> : '儲存變更'}
        </Button>
      </div>
    </Modal>
  )
}
