import { useEffect, useRef } from 'react'
import Step2Plans from './Step2Plans'
import Step3Filters from './Step3Filters'
import { smoothScrollTo } from '../../../../common/utils/scroll'

const SCROLL_MARGIN = 24;

const ANCHOR_LABELS = [
  { key: 'plans',   label: '選擇方案' },
  { key: 'filters', label: '篩選條件' },
]

export default function Step2PlansAndFilters({ conditions, onChangePlan, onChangeFilter, containerRef }) {
  const plansRef = useRef(null)
  const filtersRef = useRef(null)
  const cancelScrollRef = useRef(null)
  const sectionRefByKey = { plans: plansRef, filters: filtersRef }

  useEffect(() => () => cancelScrollRef.current?.(), [])

  function scrollToSection(target) {
    const container = containerRef?.current
    if (!container || !target) return
    cancelScrollRef.current?.()
    const targetTop = Math.max(0, target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - SCROLL_MARGIN)
    cancelScrollRef.current = smoothScrollTo(container, targetTop)
  }

  return (
    <div className="flex gap-3">
      <nav className="sticky top-0 hidden w-20 shrink-0 flex-col gap-1 self-start md:flex">
        {ANCHOR_LABELS.map(a => (
          <button
            key={a.key}
            onClick={() => scrollToSection(sectionRefByKey[a.key].current)}
            className="rounded-lg px-2 py-2 text-left text-xs font-bold text-ink-3 transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
          >
            {a.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-8 rounded-2xl bg-surface p-5">
        <div ref={plansRef}>
          <h2 className="mb-4 text-lg font-extrabold text-ink">選擇方案</h2>
          <Step2Plans conditions={conditions} onChangePlan={onChangePlan} />
        </div>
        <div className="border-t border-slate-100 pt-8">
          <h2 ref={filtersRef} className="mb-4 text-lg font-extrabold text-ink">篩選條件</h2>
          <Step3Filters conditions={conditions} onChange={onChangeFilter} />
        </div>
      </div>
    </div>
  )
}
