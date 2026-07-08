import { MessageCircle, Star } from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'

export default function HostReviews({ group, hostStars, headerClassName, onDm }) {
  return (
    <div className="space-y-4 py-5">
      <p className={headerClassName}>團主評價</p>
      <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
        <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{group.hostName}（團主）</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={12} className={i < hostStars ? 'fill-amber-400 text-amber-400' : 'text-line'} />
              ))}
            </div>
            {(group.hostReviewCount ?? 0) > 0 && (
              <span className="text-xs text-ink-4">{group.hostReviewCount} 則評價</span>
            )}
          </div>
        </div>
        {onDm && (
          <button
            onClick={onDm}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-brand hover:text-brand"
            aria-label="聯絡團主"
          >
            <MessageCircle size={16} />
          </button>
        )}
      </div>
      {(group.reviews ?? []).length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-4">尚無評價</p>
      ) : (
        (group.reviews ?? []).map(review => (
          <div key={review.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-2">
              {review.author?.[0] ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{review.author}</span>
                <span className="text-xs text-ink-4">{review.date}</span>
              </div>
              {review.rating != null && (
                <div className="mb-1 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                  ))}
                </div>
              )}
              <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
