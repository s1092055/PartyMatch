import { CircleArrowUp } from 'lucide-react'

// 「N 分以上」的「以上」改用箭頭 icon 表示；群組卡／群組詳情／建立群組預覽共用
export default function CreditScoreValue({ score, className = '' }) {
  if (!score) return '不限'
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {score} 分
      <CircleArrowUp size={16} strokeWidth={2} />
    </span>
  )
}
