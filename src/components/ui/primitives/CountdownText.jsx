import { useCountdown } from '../../../common/utils/hooks'

export default function CountdownText({ deadline, expiredText = '已逾期' }) {
  const { label, expired } = useCountdown(deadline)
  if (!label && !expired) return null
  return <span className="font-mono tabular-nums">{expired ? expiredText : label}</span>
}
