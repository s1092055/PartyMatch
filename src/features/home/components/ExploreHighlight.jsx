import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { Button } from '../../../components/ui/button'
import { calcPricePerSeat } from '../../../common/utils/pricingUtils'
import { getServiceById, listServiceTypes } from '../../../common/utils/serviceUtils'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import ExploreGroupCard from '../../explore/components/ExploreGroupCard'

const POPULAR_SERVICE_IDS = ['netflix', 'spotify', 'disney', 'youtube', 'chatgpt']
const HIGHLIGHT_SERVICE_IDS = ['netflix', 'spotify', 'disney']
const ALL_SERVICES = listServiceTypes()

function buildHighlightPlans() {
  return HIGHLIGHT_SERVICE_IDS.map(id => {
    const service = getServiceById(id)
    if (!service?.plans?.length) return null
    const plan = service.plans[0]
    return { service, plan, pricePerSeat: calcPricePerSeat(plan, plan.maxSeats) }
  }).filter(Boolean)
}

// 左側視覺：真實存在的群組卡片，直接沿用 /explore 頁面同一個 ExploreGroupCard 元件與
// 真實的 useGroupStore 資料（招募中且還有名額的群組），不是模擬圖片或編造的資料。
// h-full：跟右側搜尋卡片一樣高（由外層 grid 的 items-stretch 決定）
function ShowcaseColumn() {
  const groups = useGroupStore(s => s.groups)
  const featuredGroup = groups.find(g => g.status === 'recruiting' && g.openSeats > 0) ?? groups[0] ?? null

  if (!featuredGroup) return null

  return (
    <div className="hidden h-full min-h-80 items-center justify-center lg:flex">
      <div className="w-72 sm:w-80">
        <ExploreGroupCard group={featuredGroup} />
      </div>
    </div>
  )
}

// 「探索適合你的共享群組」區塊：標題／說明／連結置中在最上方，底下左側是真實群組卡片，
// 右側是搜尋框（送出後帶關鍵字跳到探索頁）、熱門服務 icon 列，以及依真實 serviceCatalog
// 資料算出來的 3 個熱門方案；左右兩欄用 items-stretch 讓兩欄一樣高
export default function ExploreHighlight() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const popularServices = POPULAR_SERVICE_IDS
    .map(id => ALL_SERVICES.find(s => s.id === id))
    .filter(Boolean)
  const highlightPlans = buildHighlightPlans()

  function handleSearchSubmit(e) {
    e.preventDefault()
    navigate('/explore', { state: { q: keyword } })
  }

  return (
    <section id="explore-highlight" className="scroll-mt-24">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-ink">探索適合你的共享群組</h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-3">
          依照需求搜尋、篩選條件，快速找到適合的群組。
        </p>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="mt-5 flex w-fit items-center gap-1 text-sm font-bold text-brand transition-colors hover:text-brand-hover"
        >
          探索群組
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-12">
        <ShowcaseColumn />

        <div className="mx-auto flex w-full max-w-lg flex-col justify-center rounded-2xl border border-line bg-surface p-5">
          <form onSubmit={handleSearchSubmit} className="flex h-11 items-center gap-2 rounded-control border border-line bg-canvas px-3.5 focus-within:ring-4 focus-within:ring-brand-subtle">
            <Search size={16} strokeWidth={1.5} className="shrink-0 text-ink-4" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜尋服務或關鍵字"
              aria-label="搜尋服務或關鍵字"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-4"
            />
          </form>

          <p className="mb-2 mt-4 text-center text-xs font-bold text-ink-4">熱門服務</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularServices.map(s => (
              <ServiceLogo key={s.id} serviceId={s.id} size={36} />
            ))}
          </div>

          <p className="mb-2 mt-4 text-center text-xs font-bold text-ink-4">推薦方案</p>
          <div className="space-y-2">
            {highlightPlans.map(({ service, plan, pricePerSeat }) => (
              <div key={service.id} className="flex items-center gap-3 rounded-inner p-2 transition-colors hover:bg-raised">
                <ServiceLogo serviceId={service.id} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{service.fullName} {plan.name}</p>
                  <p className="text-xs text-ink-3">NT${pricePerSeat} / 位</p>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => navigate('/explore')}>
                  查看
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
