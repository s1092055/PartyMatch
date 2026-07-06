import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useGroupStore } from '../../../../shared/stores/useGroupStore'
import { toast } from '../../../../shared/utils/toast'

export default function AdminTab() {
  const [groupId, setGroupId]   = useState('')
  const [winner, setWinner]     = useState('host')
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)

  const adjudicateGroup = useGroupStore(s => s.adjudicateGroup)
  const allGroups = useGroupStore(s => s.groups)
  const groups = allGroups.filter(g => g.status === 'disputed')

  async function handleAdjudicate(e) {
    e.preventDefault()
    if (!groupId || !reason.trim()) return
    setLoading(true)
    try {
      await adjudicateGroup(groupId, { winner, reason: reason.trim() })
      toast(`裁定完成（${winner === 'member' ? '成員獲勝' : '團主獲勝'}）`, 'success')
      setGroupId('')
      setReason('')
    } catch (err) {
      toast(err?.message ?? '裁定失敗', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-danger" />
          <span className="text-sm font-bold text-ink">申訴裁定</span>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-ink-4 py-4 text-center">目前沒有待裁定的申訴群組</p>
        ) : (
          <form onSubmit={handleAdjudicate} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">選擇申訴群組</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                required
              >
                <option value="">-- 選擇群組 --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.serviceName} / {g.planName} ({g.id.slice(-6)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">裁定結果</label>
              <div className="flex gap-3">
                {[{ value: 'host', label: '團主獲勝（撥款）' }, { value: 'member', label: '成員獲勝（退款）' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="winner"
                      value={opt.value}
                      checked={winner === opt.value}
                      onChange={() => setWinner(opt.value)}
                      className="accent-brand"
                    />
                    <span className="text-sm text-ink">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">裁定說明</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="請填寫裁定原因及說明..."
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !groupId || !reason.trim()}
              className="rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white hover:bg-danger/80 transition-colors disabled:opacity-50"
            >
              {loading ? '處理中...' : '送出裁定'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
