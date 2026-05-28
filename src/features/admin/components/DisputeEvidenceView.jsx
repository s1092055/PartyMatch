import EvidenceLink from '../../../components/ui/EvidenceLink'

export default function DisputeEvidenceView({ evidenceUrl }) {
  if (!evidenceUrl) return null

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-ink-3">申訴證據</p>
      <EvidenceLink
        url={evidenceUrl}
        className="flex h-auto w-fit items-center gap-1 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-brand hover:bg-brand-subtle"
      />
    </div>
  )
}
