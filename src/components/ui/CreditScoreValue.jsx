import { CircleArrowUp } from 'lucide-react'

export default function CreditScoreValue({ score, className = '' }) {
  if (!score) return '不限'
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {score} 分
      <CircleArrowUp size={16} strokeWidth={2} />
    </span>
  )
}
