import { useEffect, useMemo } from 'react'
import { MessageCircle, Star } from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import StarRating from '../../../components/ui/primitives/StarRating'
import EmptyState from '../../../components/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../components/ui/group/panelLayout'
import { useReviewStore } from '../../../common/stores/useReviewStore'
import { toISODate } from '../../../common/utils/date'

export default function HostReviews({ group, headerClassName, onDm, groupId, title = '團主評價', scrollable = false, centerEmpty = false }) {
  const hostId = group.hostId
  const data = useReviewStore(s => s.byHostId[hostId])
  const fetchForHost = useReviewStore(s => s.fetchForHost)

  useEffect(() => {
    if (hostId) fetchForHost(hostId)
  }, [hostId, fetchForHost])

  // groupId 有帶入時（例如群組詳情裡的「成員評價」分頁）只顯示這個群組的評價，
  // 平均分數／則數也改成只算這個群組的，不是團主全部群組的整體評價；沒有 groupId
  // 時直接沿用 store 算好的 average/count，不用重新掃一次跟 store 一樣的全部評價
  const reviews = useMemo(() => {
    const all = data?.reviews ?? []
    return groupId ? all.filter(r => r.groupId === groupId) : all
  }, [data?.reviews, groupId])
  const average = groupId
    ? (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null)
    : (data?.average ?? null)
  const count = groupId ? reviews.length : (data?.count ?? 0)

  const emptyOrLoading = data?.loading
    ? <p className="py-4 text-center text-sm text-ink-4">載入中…</p>
    : reviews.length === 0
      ? <EmptyState icon={Star} title="尚無評價" description="成員完成服務後留下的評價會顯示在這裡。" className="py-4" />
      : null

  // centerEmpty 且尚無評價時，頭像列跟 EmptyState 標題重複講「尚無評價」，且頭像列會把
  // 下方置中的空狀態往下推、跟申請管理／審核紀錄的置中位置對不齊，乾脆整列先隱藏
  const showHeader = !(centerEmpty && emptyOrLoading)

  return (
    <div className={centerEmpty ? `flex min-h-0 flex-1 flex-col space-y-4 ${CENTERED_PANEL_BODY_CLASS}` : 'space-y-4 py-5'}>
      {title && (
        <p className={`flex items-center gap-2 ${headerClassName}`}>
          <Star size={16} strokeWidth={1.5} className="shrink-0 text-brand" />
          {title}
        </p>
      )}
      {showHeader && (
        <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
          <span className="relative inline-block shrink-0">
            <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
            <PresenceDot status={group.hostPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-3 w-3" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{group.hostName}</p>
              <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                團主
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {average != null ? (
                <>
                  <Star size={13} strokeWidth={1.5} className="fill-warning text-warning" />
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
              <MessageCircle size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
      {showHeader && group.hostBio && (
        <p className="whitespace-pre-wrap border-b border-line-subtle pb-4 text-sm leading-relaxed text-ink-3">{group.hostBio}</p>
      )}
      {emptyOrLoading ? (
        centerEmpty ? <div className="flex flex-1 items-center justify-center">{emptyOrLoading}</div> : emptyOrLoading
      ) : (
        <div className={`space-y-4 ${scrollable ? 'max-h-[15rem] overflow-y-auto pr-1' : ''}`}>
          {reviews.map(review => (
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
          ))}
        </div>
      )}
    </div>
  )
}
