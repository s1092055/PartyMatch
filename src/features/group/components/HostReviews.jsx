import { useEffect } from 'react'
import { MessageCircle, Star } from 'lucide-react'
import Avatar from '../../../shared/ui/primitives/Avatar'
import StarRating from '../../../shared/ui/primitives/StarRating'
import { useReviewStore } from '../../../shared/stores/useReviewStore'
import { toISODate } from '../../../shared/utils/date'

export default function HostReviews({ group, headerClassName, onDm }) {
  const hostId = group.hostId
  const data = useReviewStore(s => s.byHostId[hostId])
  const fetchForHost = useReviewStore(s => s.fetchForHost)

  useEffect(() => {
    if (hostId) fetchForHost(hostId)
  }, [hostId, fetchForHost])

  const average = data?.average ?? null
  const count = data?.count ?? 0
  const reviews = data?.reviews ?? []

  return (
    <div className="space-y-4 py-5">
      <p className={headerClassName}>團主評價</p>
      <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
        <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{group.hostName}（團主）</p>
          <div className="mt-1 flex items-center gap-1.5">
            {average != null ? (
              <>
                <Star size={13} className="fill-warning text-warning" />
                <span className="text-xs font-bold text-ink-2">{average.toFixed(1)} 分</span>
                <span className="text-xs text-ink-4">· {count} 則評價</span>
              </>
            ) : (
              <span className="text-xs text-ink-4">尚無評價</span>
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
      {data?.loading ? (
        <p className="py-4 text-center text-sm text-ink-4">載入中…</p>
      ) : reviews.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-4">尚無評價</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="flex gap-3">
            <Avatar initial={review.author?.avatarInitial} color={review.author?.avatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{review.author?.name ?? '匿名成員'}</span>
                <span className="text-xs text-ink-4">{toISODate(review.createdAt)}</span>
              </div>
              <div className="mb-1">
                <StarRating value={review.rating} readOnly />
              </div>
              {review.comment && <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
