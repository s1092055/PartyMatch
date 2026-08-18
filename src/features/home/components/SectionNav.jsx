import { useEffect, useRef, useState } from 'react'

// 首頁右側垂直置中的分段導覽：平常收合成一排小圓點，滑鼠 hover 整條展開顯示各 Section 標題，
// 點擊直接捲動到對應區塊。跟 DesktopSidebar 不同的地方：外層顯示與否只看寬度（lg:），
// 不疊 can-hover:——收合狀態的圓點本身不需要 hover 就能點擊導覽，iPad 這類沒有 hover
// 能力但螢幕夠寬的裝置也看得到、用得到；只有「hover 才展開顯示完整標題文字」這個互動
// 細節（見下面 ul／span 的 can-hover:hover:）維持只在真的有 hover 能力的裝置上觸發，
// 觸控裝置永遠停在收合狀態，直接點圓點導覽即可
// label 一律照抄各 Section 實際的標題文字（h1/h2），不要另外改寫
const SECTIONS = [
  { id: 'section-hero', label: 'PartyMatch' },
  { id: 'section-why-us', label: '為什麼選擇 PartyMatch？' },
  { id: 'section-audience', label: '適合每一種共享生活' },
  { id: 'section-featured-groups', label: '探索適合你的共享群組' },
  { id: 'section-benefits', label: '自己開團，輕鬆管理' },
  { id: 'section-identity', label: '我想成為？' },
  { id: 'section-cta', label: '立即開始共享訂閱之旅' },
  { id: 'section-faq', label: '常見問題' },
]

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
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
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
