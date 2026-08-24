import { Heart } from 'lucide-react'

export default function FavoriteToggleButton({ isFav, onClick, heartSize = 18, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={isFav ? '取消收藏' : '加入收藏'}
      className={`grid shrink-0 place-items-center rounded-full border transition-colors ${
        isFav
          ? 'border-danger bg-danger text-white'
          : 'border-line-subtle bg-surface text-ink-3 hover:border-danger/30 hover:text-danger'
      } ${className}`}
    >
      <Heart size={heartSize} className={isFav ? 'fill-white' : ''} />
    </button>
  )
}
