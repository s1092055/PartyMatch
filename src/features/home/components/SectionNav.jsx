import { useEffect, useRef, useState } from 'react'
import { HOME_SECTION_IDS } from '../data/sectionIds'

// 首頁右側垂直置中的分段導覽：平常收合成一排小圓點，滑鼠 hover 整條展開顯示各 Section 標題，
// 點擊直接捲動到對應區塊。跟 DesktopSidebar 同一套「收合成 icon、hover 才展開全名」模式，
// 只在有真正 hover 能力的桌機顯示（can-hover:lg:block），iPad 版不顯示這個選單
// label 一律照抄各 Section 實際的標題文字（h1/h2），不要另外改寫；id 跟 ScrollCue.jsx
// 共用同一份 HOME_SECTION_IDS，這裡另外配上顯示用的 label
const SECTION_LABELS = {
  'section-hero': 'PartyMatch',
  'section-intro': '什麼是 PartyMatch？',
  'section-audience': '適合每一種共享生活',
  'section-identity': '我想成為？',
  'section-why-us': '為什麼選擇 PartyMatch？',
  'section-featured-groups': '探索適合你的共享群組',
  'section-faq': '常見問題',
  'section-cta': '立即開始共享訂閱之旅',
}
const SECTIONS = HOME_SECTION_IDS.map(id => ({ id, label: SECTION_LABELS[id] }))

export default function SectionNav() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  // IntersectionObserver 每次 callback 只回傳「狀態剛好改變」的 entries，不是目前所有區塊的
  // 交集狀態，所以要自己用這個 map 累積每個區塊最新的交集比例，才能在每次 callback 都正確算出
  // 目前交集比例最大的區塊，而不是只看這次剛好變化的那幾個
  const ratiosRef = useRef(new Map())

  useEffect(() => {
    const elements = SECTIONS
      .map(s => document.getElementById(s.id))
      .filter(Boolean)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => ratiosRef.current.set(e.target.id, e.intersectionRatio))
        let bestId = null
        let bestRatio = 0
        ratiosRef.current.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        })
        if (bestId) setActiveId(bestId)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function handleClick(id) {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="區塊導覽"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 can-hover:lg:block"
    >
      {/* 收合時只露出方塊寬度，hover 整條展開成固定寬度，讓每個項目的 hover:bg-raised
          能撐滿整排寬度，而不是只包住文字本身 */}
      <ul className="group/secnav flex w-11 flex-col items-stretch gap-1 overflow-hidden rounded-2xl border border-transparent px-1.5 py-3 transition-[width,background-color,border-color,box-shadow] duration-300 can-hover:hover:w-64 can-hover:hover:border-line can-hover:hover:bg-surface can-hover:hover:shadow-sm">
        {SECTIONS.map(s => {
          const active = s.id === activeId
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleClick(s.id)}
                aria-label={s.label}
                aria-current={active ? 'true' : undefined}
                className="flex w-full items-center justify-between gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-raised"
              >
                <span
                  className="min-w-0 flex-1 overflow-hidden truncate text-left text-sm font-bold text-ink-2 opacity-0 transition-opacity duration-200 group-hover/secnav:opacity-100"
                >
                  {s.label}
                </span>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-[3px] transition-all duration-200 ${
                    active ? 'scale-125 bg-brand' : 'bg-ink-4 group-hover/secnav:bg-ink-3'
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
