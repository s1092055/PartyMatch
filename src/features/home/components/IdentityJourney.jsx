import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2, Play } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { HOME_HOST_JOURNEY, HOME_MEMBER_JOURNEY } from '../data/homeContent'

// 兩種身份共用同一組階段 id，切換身份時 Tab 位置／徽章不變，只換底下標題跟內容，
// 呼應這個區塊想傳達的「同一個平台，不同身份各自的任務」
const ROLES = [
  { id: 'host', label: '團主', journey: HOME_HOST_JOURNEY },
  { id: 'member', label: '成員', journey: HOME_MEMBER_JOURNEY },
]

// 身份切換：兩顆各自獨立的圓角按鈕（不是共用背景的 Segmented Control），中間留適度
// 間距，讓兩個選項感覺是分開的選擇，但又不會離太遠
function RoleToggle({ activeValue, onChange }) {
  return (
    <div className="flex items-center justify-center gap-6">
      {ROLES.map(({ id, label }) => {
        const active = id === activeValue
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex w-44 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${
              active
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-surface text-ink-3 hover:text-ink'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// 底線 Tab：用一條會滑動的底線 indicator 標示目前選到哪個項目，取代制式的
// 藥丸背景切換樣式。indicator 的 left/width 量測目前 active 按鈕的實際版位
// （offsetLeft/offsetWidth 相對於有 position:relative 的容器），切換時用
// transition 讓底線滑過去，而不是瞬間跳位
function UnderlineTabs({ items, activeValue, onChange }) {
  const containerRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeLabel = containerRef.current?.querySelector(`[data-value="${activeValue}"]`)
    if (!activeLabel) return
    setIndicator({ left: activeLabel.offsetLeft, width: activeLabel.offsetWidth })
  }, [activeValue, items])

  return (
    <div ref={containerRef} className="relative flex w-full gap-2">
      {items.map(({ value, title, badge }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-sm font-bold outline-none transition-colors ${
            value === activeValue ? 'text-brand' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <span
            className={`text-[0.65rem] font-extrabold tracking-wider ${value === activeValue ? 'text-brand' : 'text-ink-4'}`}
          >
            {badge}
          </span>
          <span data-value={value} className="truncate">{title}</span>
        </button>
      ))}
      <span
        className="absolute bottom-0 h-0.5 rounded-full bg-brand transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  )
}

// 子流程選單：疊在影片區內部左邊，平常只露出一排小圓點，桌機 hover 時整條展開顯示
// 子流程標題（跟首頁右側 SectionNav 同一套「收合成點、hover 才展開全名」模式）；
// 手機版改用 StepSelect（見下方），這裡只留給桌機/平板顯示
function StepDots({ items, activeValue, onChange }) {
  return (
    <nav aria-label="子流程" className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 sm:left-3 sm:block">
      <ul className="group/steps flex w-40 flex-col items-stretch gap-1 overflow-hidden rounded-2xl border border-line bg-surface/90 px-1.5 py-3 shadow-sm backdrop-blur transition-[width,background-color,border-color,box-shadow] duration-300 can-hover:w-11 can-hover:border-transparent can-hover:bg-transparent can-hover:shadow-none can-hover:hover:w-52 can-hover:hover:border-line can-hover:hover:bg-surface/90 can-hover:hover:shadow-sm">
        {items.map(({ title }) => {
          const active = title === activeValue
          return (
            <li key={title}>
              <button
                type="button"
                onClick={() => onChange(title)}
                aria-label={title}
                aria-current={active ? 'true' : undefined}
                className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-raised"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full transition-all duration-200 ${
                    active ? 'scale-125 bg-brand' : 'bg-ink-4 can-hover:group-hover/steps:bg-ink-3'
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-2 opacity-100 transition-opacity duration-200 can-hover:opacity-0 can-hover:group-hover/steps:opacity-100">
                  {title}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// 手機版子流程選單：桌機那套「收合成點、hover 才展開」在觸控裝置上沒有 hover，改放一顆
// Select 疊在影片下緣，圓角比照上方團主／成員身份切換按鈕用 rounded-full，維持同一套圓角語彙
function StepSelect({ items, activeValue, onChange }) {
  return (
    <div className="absolute bottom-2 left-2 z-10 sm:hidden">
      <Select value={activeValue} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-44 rounded-full border-line bg-canvas/80 backdrop-blur">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(({ title }) => (
            <SelectItem key={title} value={title}>
              {title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// 「不同身份，各有各的任務」區塊：先選身份（團主／成員），再看該身份底下四個大階段
// （建立/加入群組／管理／續約／其他情境）的底線 Tab，每個階段底下再是更細子流程的垂直
// Tab。切換身份或階段時，下層都會重置回第一項，避免切到不存在的子流程
export default function IdentityJourney() {
  const [role, setRole] = useState(ROLES[0].id)
  const journey = ROLES.find(r => r.id === role).journey
  const [activePhaseId, setActivePhaseId] = useState(journey[0].id)
  const activePhase = journey.find(p => p.id === activePhaseId)
  const [activeStepTitle, setActiveStepTitle] = useState(activePhase.steps[0].title)
  const activeStep = activePhase.steps.find(s => s.title === activeStepTitle)
  const videoBoxRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const phaseTabItems = useMemo(
    () => journey.map(({ id, title, badge }) => ({ value: id, title, badge })),
    [journey]
  )

  // 切到新 journey/phase 後都要把子流程重置回第一步，避免停留在不存在的子流程
  function resetToPhase(phase) {
    setActivePhaseId(phase.id)
    setActiveStepTitle(phase.steps[0].title)
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole)
    const nextJourney = ROLES.find(r => r.id === nextRole).journey
    resetToPhase(nextJourney[0])
  }

  function handlePhaseChange(id) {
    resetToPhase(journey.find(p => p.id === id))
  }

  // 先讓佔位區塊就能進全螢幕，之後換成實際 <video> 時容器不用動，直接沿用同一顆按鈕跟
  // requestFullscreen 邏輯；監聽 fullscreenchange 是因為使用者也可能按 Esc 離開全螢幕
  // （不是點按鈕），這種情況也要把 icon 切回「進入全螢幕」的箭頭
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === videoBoxRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoBoxRef.current?.requestFullscreen()
    }
  }

  return (
    <section id="identity" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        我想成為？
      </h2>

      <div className="mt-4 w-full">
        <RoleToggle activeValue={role} onChange={handleRoleChange} />
      </div>

      <div className="mt-6 w-full">
        {/* 底線 Tab 收進影片容器內當作頂部頁籤列，跟下面的影片共用同一個外框/圓角，
            視覺上像一張完整的播放卡片，而不是「Tab 列 + 另一個獨立的影片框」兩塊拼接 */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-2 pt-1">
            <UnderlineTabs
              items={phaseTabItems}
              activeValue={activePhaseId}
              onChange={handlePhaseChange}
            />
          </div>

          <div key={`${activePhaseId}-${activeStepTitle}`} className="animate-fade-in-up">
            <div
              ref={videoBoxRef}
              className="relative flex aspect-video w-full items-center justify-center bg-raised text-ink-4"
            >
              <Play size={40} strokeWidth={1.5} />

              <StepDots items={activePhase.steps} activeValue={activeStepTitle} onChange={setActiveStepTitle} />
              <StepSelect items={activePhase.steps} activeValue={activeStepTitle} onChange={setActiveStepTitle} />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? '離開全螢幕' : '全螢幕播放'}
                className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-canvas/80 text-ink-3 shadow-sm backdrop-blur transition-colors hover:bg-raised hover:text-ink"
              >
                {isFullscreen ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
              </button>
            </div>

            <p className="truncate border-t border-line px-4 py-3 text-center text-sm leading-relaxed text-ink-3">
              {activeStep.desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
