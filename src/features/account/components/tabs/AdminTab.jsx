import { useState } from 'react'
import { ShieldAlert, Clock } from 'lucide-react'
import { useGroupStore } from '../../../../common/stores/useGroupStore'
import { toast } from '../../../../common/utils/toast'
import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Textarea } from '../../../../components/ui/input'

function isOverdue(group) {
  return !!group.disputeDeadline && new Date(group.disputeDeadline) <= new Date()
}

export default function AdminTab() {
  const [groupId, setGroupId]   = useState('')
  const [winner, setWinner]     = useState('host')
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)

  const adjudicateGroup = useGroupStore(s => s.adjudicateGroup)
  const allGroups = useGroupStore(s => s.groups)
  // 已逾期（超過 disputeDeadline 仍未裁定）排在最前面，提醒優先處理
  const groups = allGroups
    .filter(g => g.status === 'disputed')
    .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
  const overdueCount = groups.filter(isOverdue).length

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
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-danger" />
          <span className="text-sm font-bold text-ink">回報問題裁定</span>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-ink-4 py-4 text-center">目前沒有待裁定的回報群組</p>
        ) : (
          <form onSubmit={handleAdjudicate} className="space-y-3">
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                <Clock size={14} strokeWidth={1.5} />
                <span>{overdueCount} 筆回報已超過 48 小時裁定期限，代管金額仍凍結中，請優先處理</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">選擇回報群組</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-4 focus:ring-brand-subtle"
                required
              >
                <option value="">-- 選擇群組 --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {isOverdue(g) ? '⚠ 已逾期／' : ''}{g.serviceName} / {g.planName} ({g.id.slice(-6)})
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
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="請填寫裁定原因及說明..."
                required
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !groupId || !reason.trim()}
              className="rounded-lg"
            >
              {loading ? '處理中...' : '送出裁定'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
