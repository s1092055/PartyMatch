import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_HOST_JOURNEY } from '../data/homeContent'

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
  }, [activeValue])

  return (
    <div ref={containerRef} className="relative flex w-full gap-2">
      {items.map(({ value, title, icon: Icon }, i) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-sm font-bold outline-none transition-colors ${
            value === activeValue ? 'text-brand' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <span className={`text-[0.65rem] font-extrabold tracking-wider ${value === activeValue ? 'text-brand' : 'text-ink-4'}`}>
            STEP {i + 1}
          </span>
          <span data-value={value} className="inline-flex items-center gap-1.5">
            <Icon size={16} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{title}</span>
          </span>
        </button>
      ))}
      <span
        className="absolute bottom-0 h-0.5 rounded-full bg-brand transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  )
}

// 垂直 Tab：橫向底線 Tab 的直向版本，一樣用會滑動的 indicator（改成左側直條、
// 用 offsetTop/offsetHeight 量測），放在每個階段底下顯示更細的子流程
function VerticalTabs({ items, activeValue, onChange, className = '' }) {
  const containerRef = useRef(null)
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })

  useEffect(() => {
    const activeButton = containerRef.current?.querySelector(`[data-value="${activeValue}"]`)
    if (!activeButton) return
    setIndicator({ top: activeButton.offsetTop, height: activeButton.offsetHeight })
  }, [activeValue, items])

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      <span
        className="absolute left-0 w-0.5 rounded-full bg-brand transition-all duration-300 ease-out"
        style={{ top: indicator.top, height: indicator.height }}
      />
      {items.map(({ title }) => (
        <button
          key={title}
          type="button"
          data-value={title}
          onClick={() => onChange(title)}
          className={`rounded-md py-2 pl-4 pr-2 text-left text-sm font-bold outline-none transition-colors ${
            title === activeValue ? 'text-brand' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {title}
        </button>
      ))}
    </div>
  )
}

// 「自己開團，一切變得更簡單」區塊：團主完整流程分兩層——上層底線 Tab 是三個大階段
// （建立群組／群組管理／續訂管理），下層垂直 Tab 是該階段更細的子流程，切換階段時
// 子流程會重置回第一項。內容順序對應 Group 狀態機，詳見 HOME_HOST_JOURNEY 註解
export default function BenefitsList() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const [activePhaseId, setActivePhaseId] = useState(HOME_HOST_JOURNEY[0].id)
  const activePhase = HOME_HOST_JOURNEY.find(p => p.id === activePhaseId)
  const [activeStepTitle, setActiveStepTitle] = useState(activePhase.steps[0].title)
  const activeStep = activePhase.steps.find(s => s.title === activeStepTitle) ?? activePhase.steps[0]

  function handlePhaseChange(id) {
    setActivePhaseId(id)
    setActiveStepTitle(HOME_HOST_JOURNEY.find(p => p.id === id).steps[0].title)
  }

  return (
    <section id="benefits" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        自己開團，一切變得更簡單
      </h2>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-3">
        從開團、管理到續約，每個階段 PartyMatch 都幫你安排好了。
      </p>

      <div className="mt-8 w-full">
        <UnderlineTabs
          items={HOME_HOST_JOURNEY.map(({ id, title, icon }) => ({ value: id, title, icon }))}
          activeValue={activePhaseId}
          onChange={handlePhaseChange}
        />

        <div className="mt-6 flex flex-col gap-3 text-left sm:flex-row sm:gap-8">
          <VerticalTabs
            items={activePhase.steps}
            activeValue={activeStepTitle}
            onChange={setActiveStepTitle}
            className="sm:w-52 sm:shrink-0"
          />
          <p
            key={`${activePhaseId}-${activeStepTitle}`}
            className="animate-fade-in-up text-sm leading-relaxed text-ink-3 sm:pt-2"
          >
            {activeStep.desc}
          </p>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-8 rounded-full px-8"
        onClick={() => navigate(loggedIn ? '/create-group' : '/register')}
      >
        建立群組
        <ChevronRight size={14} strokeWidth={1.5} />
      </Button>
    </section>
  )
}
