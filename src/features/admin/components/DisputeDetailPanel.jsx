import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/card'
import DisputeSummaryCard from './DisputeSummaryCard'
import DisputeEvidenceView from './DisputeEvidenceView'
import DisputeConversationView from './DisputeConversationView'
import DisputeAdjudicateForm from './DisputeAdjudicateForm'
import { fetchAdminDisputeDetail } from '../../../common/api/adminApi'

export default function DisputeDetailPanel({ disputeId, onResolved }) {
  const [dispute, setDispute] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!disputeId) { setDispute(null); return }
    setLoading(true)
    fetchAdminDisputeDetail(disputeId)
      .then(setDispute)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [disputeId])

  if (!disputeId) {
    return (
      <Card className="flex h-full items-center justify-center p-5">
        <p className="text-sm text-ink-4">請從左側選擇一筆申訴</p>
      </Card>
    )
  }

  if (loading || !dispute) {
    return (
      <Card className="flex h-full items-center justify-center p-5">
        <p className="text-sm text-ink-4">載入中…</p>
      </Card>
    )
  }

  return (
    <Card className="space-y-4 p-5">
      <DisputeSummaryCard dispute={dispute} />
      <DisputeEvidenceView evidenceUrl={dispute.evidenceUrl} />
      <DisputeConversationView
        credentialComments={dispute.credentialComments}
        conversationMessages={dispute.conversationMessages}
        hostId={dispute.host.id}
      />
      <DisputeAdjudicateForm dispute={dispute} onResolved={onResolved} />
    </Card>
  )
}
