import { Heart } from 'lucide-react'

// 收藏愛心切換鈕：探索卡片／群組詳情／手機底部操作列共用同一套已收藏/未收藏配色，
// 只有尺寸與定位（浮動卡片、modal 標頭、底部操作列）需要各自的 className 決定
export default function FavoriteToggleButton({ isFav, onClick, heartSize = 18, className = '', square = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={isFav ? '取消收藏' : '加入收藏'}
      className={`grid shrink-0 place-items-center border transition-colors ${square ? 'rounded-xl' : 'rounded-full'} ${
        isFav
          ? 'border-danger/30 bg-danger-subtle text-danger'
          : 'border-line-subtle text-ink-3 hover:border-danger/30 hover:text-danger'
      } ${className}`}
    >
      <Heart size={heartSize} className={isFav ? 'fill-danger' : ''} />
    </button>
  )
}
