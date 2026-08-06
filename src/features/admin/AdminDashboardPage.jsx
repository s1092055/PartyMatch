import { useEffect, useState } from 'react'
import { Users, UserCog, Layers, Coins, ShieldAlert, Clock, Megaphone, Send, CheckCircle2, UserPlus, FolderPlus, ClipboardList } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { toast } from '../../common/utils/toast'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input, Textarea } from '../../components/ui/input'
import ConfirmActionDialog from '../../components/ui/ConfirmActionDialog'
import { broadcastSystemMessage, sendDirectSystemMessage } from '../../common/api/systemMessagesApi'
import { findUserByEmail } from '../../common/api/usersApi'
import { fetchAdminStats } from '../../common/api/adminApi'
import { getStatusLabel } from '../../components/ui/statusBadgeConfig'
import StatCard from './components/StatCard'

function isOverdue(group) {
  return !!group.disputeDeadline && new Date(group.disputeDeadline) <= new Date()
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')

  const [groupId, setGroupId]   = useState('')
  const [winner, setWinner]     = useState('host')
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)

  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting]         = useState(false)
  const [confirmBroadcast, setConfirmBroadcast] = useState(false)

  const [directEmail, setDirectEmail]     = useState('')
  const [directContent, setDirectContent] = useState('')
  const [directTarget, setDirectTarget]   = useState(null) // { id, name, email } 查到的對象
  const [directLookupError, setDirectLookupError] = useState('')
  const [lookingUp, setLookingUp]         = useState(false)
  const [sendingDirect, setSendingDirect] = useState(false)

  const adjudicateGroup = useGroupStore(s => s.adjudicateGroup)
  const allGroups = useGroupStore(s => s.groups)
  // 已逾期（超過 disputeDeadline 仍未裁定）排在最前面，提醒優先處理
  const disputedGroups = allGroups
    .filter(g => g.status === 'disputed')
    .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
  const overdueCount = disputedGroups.filter(isOverdue).length

  async function loadStats() {
    try {
      const data = await fetchAdminStats()
      setStats(data)
      setStatsError('')
    } catch (err) {
      setStatsError(err?.message ?? '概覽數據載入失敗')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats()
  }, [])

  async function handleAdjudicate(e) {
    e.preventDefault()
    if (!groupId || !reason.trim()) return
    setLoading(true)
    try {
      await adjudicateGroup(groupId, { winner, reason: reason.trim() })
      toast(`裁定完成（${winner === 'member' ? '成員獲勝' : '團主獲勝'}）`, 'success')
      setGroupId('')
      setReason('')
      loadStats()
    } catch (err) {
      toast(err?.message ?? '裁定失敗', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleBroadcast() {
    setConfirmBroadcast(false)
    setBroadcasting(true)
    try {
      const { sent } = await broadcastSystemMessage(broadcastContent.trim())
      toast(`公告已發送給 ${sent} 位使用者`, 'success')
      setBroadcastContent('')
    } catch (err) {
      toast(err?.message ?? '公告發送失敗', 'error')
    } finally {
      setBroadcasting(false)
    }
  }

  async function handleLookupUser(e) {
    e.preventDefault()
    if (!directEmail.trim()) return
    setLookingUp(true)
    setDirectLookupError('')
    setDirectTarget(null)
    try {
      const user = await findUserByEmail(directEmail.trim())
      setDirectTarget(user)
    } catch (err) {
      setDirectLookupError(err?.message ?? '查詢失敗')
    } finally {
      setLookingUp(false)
    }
  }

  function resetDirectTarget() {
    setDirectTarget(null)
    setDirectLookupError('')
  }

  async function handleSendDirect(e) {
    e.preventDefault()
    if (!directTarget || !directContent.trim()) return
    setSendingDirect(true)
    try {
      await sendDirectSystemMessage(directTarget.id, directContent.trim())
      toast(`已發送給 ${directTarget.name}`, 'success')
      setDirectContent('')
      setDirectEmail('')
      setDirectTarget(null)
    } catch (err) {
      toast(err?.message ?? '發送失敗', 'error')
    } finally {
      setSendingDirect(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-ink">平台概覽</h1>
        <p className="mt-0.5 text-sm text-ink-3">PartyMatch 目前的整體使用狀況</p>
      </div>

      {statsError ? (
        <p className="text-sm text-danger">{statsError}</p>
      ) : !stats ? (
        <p className="text-sm text-ink-4">載入中...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="總使用者數" value={stats.totalUsers} sub={`今日新增 ${stats.newUsersToday}`} />
          <StatCard icon={UserCog} label="團主數" value={stats.totalHosts} />
          <StatCard icon={Layers} label="總群組數" value={stats.totalGroups} sub={`今日新增 ${stats.newGroupsToday}`} />
          <StatCard icon={Coins} label="代管中 PM 幣" value={stats.totalEscrowTokens.toLocaleString()} />
          <StatCard
            icon={ShieldAlert}
            label="待裁定申訴"
            value={stats.pendingDisputes}
            sub={stats.overdueDisputes > 0 ? `${stats.overdueDisputes} 筆已逾期` : undefined}
            tone={stats.overdueDisputes > 0 ? 'danger' : stats.pendingDisputes > 0 ? 'warning' : 'default'}
          />
          <StatCard icon={ClipboardList} label="今日新增申請" value={stats.newApplicationsToday} />
          <StatCard icon={FolderPlus} label="今日新增群組" value={stats.newGroupsToday} />
          <StatCard icon={UserPlus} label="今日新增使用者" value={stats.newUsersToday} />
        </div>
      )}

      {stats && Object.keys(stats.groupStatusCounts).length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-bold text-ink">群組狀態分佈</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.groupStatusCounts).map(([status, count]) => (
              <span key={status} className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-ink-2">
                {getStatusLabel(status)}：{count}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={16} className="text-brand" />
            <span className="text-sm font-bold text-ink">發送系統公告</span>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); if (broadcastContent.trim()) setConfirmBroadcast(true) }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">公告內容</label>
              <Textarea
                value={broadcastContent}
                onChange={e => setBroadcastContent(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="這則訊息會發送到每一位使用者的系統聊天室，請確認內容無誤"
                required
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              disabled={broadcasting || !broadcastContent.trim()}
              className="rounded-lg"
            >
              {broadcasting ? '發送中...' : '發送給所有使用者'}
            </Button>
          </form>

          {confirmBroadcast && (
            <ConfirmActionDialog
              title="確認發送系統公告？"
              message="這則訊息會發送給平台上「每一位」使用者，發送後無法收回，請再次確認內容。"
              confirmLabel="確認發送"
              danger
              onConfirm={handleBroadcast}
              onCancel={() => setConfirmBroadcast(false)}
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Send size={16} className="text-brand" />
            <span className="text-sm font-bold text-ink">單發系統訊息</span>
          </div>

          {!directTarget ? (
            <form onSubmit={handleLookupUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-3 mb-1 block">對方 Email</label>
                <Input
                  type="email"
                  value={directEmail}
                  onChange={e => { setDirectEmail(e.target.value); setDirectLookupError('') }}
                  placeholder="輸入使用者的 email 查詢"
                  required
                />
                {directLookupError && (
                  <p className="mt-1 text-xs text-danger">{directLookupError}</p>
                )}
              </div>
              <Button type="submit" disabled={lookingUp || !directEmail.trim()} className="rounded-lg">
                {lookingUp ? '查詢中...' : '查詢使用者'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendDirect} className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-subtle px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={14} className="shrink-0 text-brand" />
                  <span className="font-semibold">{directTarget.name}</span>
                  <span className="text-ink-4">{directTarget.email}</span>
                </div>
                <button
                  type="button"
                  onClick={resetDirectTarget}
                  className="shrink-0 text-xs font-semibold text-ink-3 underline-offset-2 hover:underline"
                >
                  換一位
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-3 mb-1 block">訊息內容</label>
                <Textarea
                  value={directContent}
                  onChange={e => setDirectContent(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={`這則訊息只會發送給 ${directTarget.name}`}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={sendingDirect || !directContent.trim()}
                className="rounded-lg"
              >
                {sendingDirect ? '發送中...' : '發送'}
              </Button>
            </form>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-danger" />
          <span className="text-sm font-bold text-ink">回報問題裁定</span>
        </div>

        {disputedGroups.length === 0 ? (
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
                {disputedGroups.map(g => (
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
                placeholder="請填寫裁定原因"
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
