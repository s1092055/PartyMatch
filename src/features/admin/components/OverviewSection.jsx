import { useEffect, useState } from 'react'
import { Users, UserCog, Layers, Coins, ShieldAlert, ClipboardList } from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { fetchAdminStats } from '../../../common/api/adminApi'
import { STATUS_CONFIG } from '../../../components/ui/statusBadgeConfig'
import StatCard from './StatCard'

export default function OverviewSection() {
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchAdminStats()
        setStats(data)
        setStatsError('')
      } catch (err) {
        setStatsError(err?.message ?? '概覽數據載入失敗')
      }
    }
    loadStats()
  }, [])

  if (statsError) return <p className="text-sm text-danger">{statsError}</p>
  if (!stats) return <p className="text-sm text-ink-4">載入中...</p>

  return (
    <div className="space-y-6">
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
      </div>

      {Object.keys(stats.groupStatusCounts).length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-bold text-ink">群組狀態分佈</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.groupStatusCounts).map(([status, count]) => {
              const config = STATUS_CONFIG[status]
              return (
                <Badge key={status} variant={config?.variant ?? 'secondary'} className="px-2.5 py-1 text-xs">
                  {config?.label ?? status}：{count}
                </Badge>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
