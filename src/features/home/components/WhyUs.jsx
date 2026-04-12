import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_WHY_US_HIGHLIGHTS } from '../data/homeContent'

function WhyUsTabs({ items, activeId, onChange }) {
  const containerRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeLabel = containerRef.current?.querySelector(`[data-value="${activeId}"]`)
    if (!activeLabel) return
    setIndicator({ left: activeLabel.offsetLeft, width: activeLabel.offsetWidth })
  }, [activeId, items])

  return (
    <div ref={containerRef} className="relative mx-auto flex w-full max-w-md items-center justify-between">
      {items.map(({ id, tab }) => (
        <button
          key={id}
          type="button"
          data-value={id}
          onClick={() => onChange(id)}
          className={`py-3 text-sm font-bold transition-colors sm:text-base ${
            id === activeId ? 'text-brand' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {tab}
        </button>
      ))}
      <span
        className="absolute bottom-0 h-0.5 rounded-full bg-brand transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  )
}

export default function WhyUs() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const [activeId, setActiveId] = useState(HOME_WHY_US_HIGHLIGHTS[0].id)
  const active = HOME_WHY_US_HIGHLIGHTS.find(t => t.id === activeId)

  return (
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-ink">為什麼選擇 PartyMatch？</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-ink-3">
        打造安全又完善機制，安心共享每一次的訂閱體驗。
      </p>

      <div className="mt-8">
        <WhyUsTabs items={HOME_WHY_US_HIGHLIGHTS} activeId={activeId} onChange={setActiveId} />

        <div key={activeId} className="animate-fade-in-up pt-6">
          <div
            className={`mx-auto flex items-center justify-center ${
              active.image ? 'aspect-[3/2] w-72 sm:w-80' : 'h-56 w-56 sm:h-64 sm:w-64'
            }`}
          >
            {active.image ? (
              <img src={active.image} alt="" className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-full bg-brand-subtle text-brand">
                <active.icon size={64} strokeWidth={1.5} />
              </div>
            )}
          </div>

          <p className="mx-auto mt-4 max-w-md text-center font-extrabold text-ink">{active.title}</p>
          <p className="mx-auto mt-2 max-w-md text-left text-sm leading-relaxed text-ink-3">{active.desc}</p>
        </div>
      </div>

      {!loggedIn && (
        <Button size="lg" className="mt-8 rounded-full px-8" onClick={() => navigate('/login')}>
          登入會員，瞭解更多
          <ChevronRight size={14} strokeWidth={1.5} />
        </Button>
      )}
    </section>
  )
}
