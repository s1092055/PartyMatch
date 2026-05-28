import { useState } from 'react'
import DisputeStatCards from './DisputeStatCards'
import DisputeListPanel from './DisputeListPanel'
import DisputeDetailPanel from './DisputeDetailPanel'
import DisputeHistorySection from './DisputeHistorySection'

export default function DisputeSection() {
  const [selectedId, setSelectedId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleResolved() {
    setSelectedId('')
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="space-y-4">
      <DisputeStatCards refreshKey={refreshKey} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DisputeListPanel selectedId={selectedId} onSelect={setSelectedId} refreshKey={refreshKey} />
        <DisputeDetailPanel disputeId={selectedId} onResolved={handleResolved} />
      </div>

      <DisputeHistorySection refreshKey={refreshKey} />
    </div>
  )
}
