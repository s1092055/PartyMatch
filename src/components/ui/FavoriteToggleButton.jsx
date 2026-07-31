import { Heart } from 'lucide-react'

// 收藏愛心切換鈕：探索卡片／群組詳情／手機底部操作列共用同一套已收藏/未收藏配色，
// 只有尺寸與定位（浮動卡片、modal 標頭、底部操作列）需要各自的 className 決定
export default function FavoriteToggleButton({ isFav, onClick, heartSize = 18, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={isFav ? '取消收藏' : '加入收藏'}
      className={`grid shrink-0 place-items-center rounded-full border transition-colors ${
        isFav
          ? 'border-red-100 bg-red-50 text-red-500'
          : 'border-line-subtle text-ink-3 hover:border-red-100 hover:text-red-400'
      } ${className}`}
    >
      <Heart size={heartSize} className={isFav ? 'fill-red-500' : ''} />
    </button>
  )
}
