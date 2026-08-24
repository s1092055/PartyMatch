import { useEffect, useState } from 'react'
import { ShieldAlert, Clock, CheckCircle2 } from 'lucide-react'
import StatCard from './StatCard'
import { fetchAdminStats, fetchAdminDisputeHistory } from '../../../common/api/adminApi'

export default function DisputeStatCards({ refreshKey }) {
  const [stats, setStats] = useState(null)
  const [resolvedCount, setResolvedCount] = useState(null)

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(console.error)
    fetchAdminDisputeHistory({ take: 100 }).then(rows => setResolvedCount(rows.length)).catch(console.error)
  }, [refreshKey])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon={ShieldAlert} label="待裁定" value={stats?.pendingDisputes ?? '—'} tone="warning" />
      <StatCard icon={Clock} label="已逾期" value={stats?.overdueDisputes ?? '—'} tone="danger" />
      <StatCard icon={CheckCircle2} label="已處理" value={resolvedCount ?? '—'} tone="success" />
    </div>
  )
}
