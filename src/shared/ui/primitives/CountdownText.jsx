import { useCountdown } from '../../utils/hooks'

// 顯示距離 deadline 的剩餘時間，逾期後顯示 expiredText；deadline 為空時不渲染任何東西
export default function CountdownText({ deadline, expiredText = '已逾期' }) {
  const { label, expired } = useCountdown(deadline)
  if (!label && !expired) return null
  return <span className="font-mono tabular-nums">{expired ? expiredText : label}</span>
}
