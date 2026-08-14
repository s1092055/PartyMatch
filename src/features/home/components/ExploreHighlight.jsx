import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { Button } from '../../../components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { calcPricePerSeat } from '../../../common/utils/pricingUtils'
import { getServiceById, listServiceTypes } from '../../../common/utils/serviceUtils'

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

// 「探索適合你的共享群組」區塊：標題／說明置中在最上方，底下是搜尋卡片（關鍵字 + 服務篩選
// Select + 一般搜尋／快速搜尋兩顆按鈕，快速搜尋會開啟 QuickMatchModal，取代原本獨立的
// /quick-match 頁面）。跟「熱門與快額滿群組」幻燈片（FeaturedGroupsCarousel）是首頁上
// 各自獨立的 Section，見 HomePage.jsx
export default function ExploreHighlight() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [serviceId, setServiceId] = useState('all')
  const popularServices = POPULAR_SERVICE_IDS
    .map(id => ALL_SERVICES.find(s => s.id === id))
    .filter(Boolean)
  const highlightPlans = buildHighlightPlans()

  function handleSearchSubmit(e) {
    e.preventDefault()
    navigate('/explore', { state: { q: keyword, service: serviceId } })
  }

  function openQuickMatch() {
    window.dispatchEvent(new CustomEvent('pm:open-quick-match'))
  }

  return (
    <section id="explore-highlight" className="scroll-mt-24">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-ink">探索適合你的共享群組</h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-3">
          依照需求搜尋、篩選條件，快速找到適合的群組。
        </p>
      </div>

      <div className="mx-auto mt-10 w-full max-w-lg rounded-2xl border border-line bg-surface p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex h-11 items-center gap-2 rounded-control border border-line bg-canvas px-3.5 focus-within:ring-4 focus-within:ring-brand-subtle">
            <Search size={16} strokeWidth={1.5} className="shrink-0 text-ink-4" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜尋服務或關鍵字"
              aria-label="搜尋服務或關鍵字"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-4"
            />
          </div>

          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger aria-label="篩選服務" className="h-11 w-full font-bold">
              <SelectValue placeholder="不限服務" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">不限服務</SelectItem>
              {ALL_SERVICES.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-1.5">
                    <ServiceLogo serviceId={s.id} size={18} className="shrink-0" />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button type="submit" className="min-w-0 flex-1">
              <Search size={15} strokeWidth={1.5} />
              搜尋
            </Button>
            <Button type="button" variant="secondary" onClick={openQuickMatch} className="min-w-0 flex-1">
              <SlidersHorizontal size={15} strokeWidth={1.5} />
              快速搜尋
            </Button>
          </div>
        </form>

        <p className="mb-2 mt-5 text-center text-xs font-bold text-ink-4">熱門服務</p>
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
    </section>
  )
}
