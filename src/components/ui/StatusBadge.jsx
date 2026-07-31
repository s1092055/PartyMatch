import { Badge } from './badge'
import { STATUS_CONFIG, DEFAULT_STATUS_CONFIG } from './statusBadgeConfig'

export function StatusBadge({ status, label, className }) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS_CONFIG
  return (
    <Badge variant={config.variant} className={className}>
      {label ?? config.label ?? status}
    </Badge>
  )
}
