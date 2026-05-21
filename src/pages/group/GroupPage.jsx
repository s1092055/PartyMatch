import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react'
import StarRating from '../../shared/components/ui/StarRating'
import { getGroupById } from '../../shared/stores/groupStore'
import GroupHeroCard from './components/GroupHeroCard'
import StickyJoinSummary from './components/StickyJoinSummary'
import SectionCard from '../../shared/components/ui/SectionCard'

const PREVIEW_COUNT = 3

export default function GroupPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [showAllReviews, setShowAllReviews] = useState(false)
  const group = getGroupById(groupId)

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-ink-3">
        <AlertCircle size={40} className="text-ink-4" />
        <p className="font-semibold">找不到此群組</p>
        <button
          onClick={() => navigate('/explore')}
          className="text-sm text-brand hover:underline"
        >
          返回探索頁
        </button>
      </div>
    )
  }

  return (
    <div>
      
      <button
        onClick={() => navigate('/explore')}
        className="flex items-center gap-1 text-sm text-ink-3 hover:text-ink-2 mb-4 transition-colors"
      >
        <ChevronLeft size={16} />
        返回探索群組
      </button>

<div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        
        <div className="flex-1 min-w-0">
          <GroupHeroCard group={group} />

<SectionCard
            title="加入條件與規則"
            subtitle="加入前請仔細閱讀"
            className="mb-4"
          >
            {group.requirements && (
              <div className="flex items-start gap-2 bg-brand-subtle text-brand text-sm px-3 py-2.5 rounded-[var(--radius-inner)] mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{group.requirements}</span>
              </div>
            )}
            <ul className="space-y-2">
              {(group.rules ?? []).map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </SectionCard>

<SectionCard
            title="團主評價"
            subtitle={`${group.hostReviewCount} 則評價`}
            action={
              <div className="flex items-center gap-1.5">
                <StarRating rating={Math.round(group.hostRating)} size={13} />
                <span className="text-sm font-bold text-ink-2">{group.hostRating}</span>
              </div>
            }
          >
            <div className="space-y-4">
              {((showAllReviews ? group.reviews : (group.reviews ?? []).slice(0, PREVIEW_COUNT)) ?? []).map(review => (
                <div key={review.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-raised flex items-center justify-center text-ink-2 text-xs font-semibold shrink-0">
                    {review.author[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-2">{review.author}</span>
                        <StarRating rating={review.rating} size={11} />
                      </div>
                      <span className="text-xs text-ink-3 shrink-0">{review.date}</span>
                    </div>
                    <p className="text-sm text-ink-3 leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowAllReviews(v => !v)}
                className="flex items-center gap-1 text-sm text-brand hover:underline mt-1"
              >
                <MessageSquare size={13} />
                {showAllReviews
                  ? '收起評價'
                  : `查看全部 ${group.hostReviewCount} 則評價`}
              </button>
            </div>
          </SectionCard>
        </div>

<div className="w-full lg:w-[25rem] shrink-0">
          <StickyJoinSummary group={group} />
        </div>
      </div>
    </div>
  )
}
