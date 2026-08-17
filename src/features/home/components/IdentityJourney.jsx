import { useEffect, useMemo, useRef, useState } from 'react'
import { List, Maximize2, Minimize2, Play } from 'lucide-react'
import { Drawer, DrawerContent, DrawerTitle } from '../../../components/ui/drawer'
import { HOME_HOST_JOURNEY, HOME_MEMBER_JOURNEY } from '../data/homeContent'

// 兩種身份共用同一組階段 id，切換身份時 Tab 位置／徽章不變，只換底下標題跟內容，
// 呼應這個區塊想傳達的「同一個平台，不同身份各自的任務」
const ROLES = [
  { id: 'host', label: '團主', journey: HOME_HOST_JOURNEY },
  { id: 'member', label: '成員', journey: HOME_MEMBER_JOURNEY },
]

// 身份切換：兩顆各自獨立的圓角按鈕（不是共用背景的 Segmented Control）。compact 給
// 手機版 Drawer 內用，兩顆等寬平分 Drawer 全寬；桌機/平板獨立顯示在標題下方時維持
// 原本置中、固定寬度的尺寸
function RoleToggle({ activeValue, onChange, compact = false }) {
  return (
    <div className={compact ? 'flex w-full items-center gap-3' : 'flex items-center justify-center gap-6'}>
      {ROLES.map(({ id, label }) => {
        const active = id === activeValue
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center justify-center rounded-full border font-bold transition-colors ${
              compact ? 'h-9 flex-1 text-sm' : 'w-44 px-5 py-2.5 text-sm'
            } ${
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
// 手機版沒有 hover，改用下面的 StepTrigger + Drawer，這裡只留給桌機/平板顯示
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
// 疊在影片下緣的按鈕，點開才叫出底部 Drawer；身份切換、階段（UnderlineTabs）跟子流程都
// 收進同一個 Drawer 裡切換，不用再另外佔版面，影片容器可以整個滿版。按鈕文字帶上目前
// 身份，不然身份切換搬進 Drawer 後，沒點開 Drawer 就看不出目前選的是團主還成員
function StepTrigger({ roleLabel, activeValue, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-x-2 bottom-2 z-10 flex h-9 items-center justify-center gap-1.5 rounded-full bg-canvas/80 px-3 text-xs font-bold text-ink-2 shadow-sm backdrop-blur transition-colors hover:bg-raised sm:hidden"
    >
      <List size={14} strokeWidth={1.5} className="shrink-0" />
      <span className="truncate">{roleLabel} · {activeValue}</span>
    </button>
  )
}

// Drawer 內容：依序是身份切換、階段（沿用桌機同一顆 UnderlineTabs 切階段，Drawer 夠寬，
// 不需要另外做直式版）、子流程清單。點選子流程直接關閉 Drawer（跟原本 Select 選完就收起
// 同一種手感），切身份／階段則維持開著讓使用者接著往下選
function StepDrawerContent({ role, onRoleChange, phaseTabItems, activePhaseId, onPhaseChange, steps, activeStepTitle, onStepChange }) {
  return (
    <>
      <DrawerTitle className="sr-only">選擇身份與流程階段、步驟</DrawerTitle>
      <div className="border-b border-line px-3 py-3">
        <RoleToggle activeValue={role} onChange={onRoleChange} compact />
      </div>
      <div className="border-b border-line px-2 pt-1">
        <UnderlineTabs items={phaseTabItems} activeValue={activePhaseId} onChange={onPhaseChange} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {steps.map(({ title }) => {
          const active = title === activeStepTitle
          return (
            <button
              key={title}
              type="button"
              onClick={() => onStepChange(title)}
              aria-current={active ? 'true' : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                active ? 'bg-raised text-brand' : 'text-ink-2 hover:bg-raised'
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-brand' : 'bg-ink-4'}`} />
              {title}
            </button>
          )
        })}
      </div>
    </>
  )
}

// 「不同身份，各有各的任務」區塊：先選身份（團主／成員），再看該身份底下四個大階段
// （建立/加入群組／管理／續約／其他情境）的底線 Tab，每個階段底下再是更細子流程的垂直
// Tab。切換身份或階段時，下層都會重置回第一項，避免切到不存在的子流程
export default function IdentityJourney() {
  const [role, setRole] = useState(ROLES[0].id)
  const roleLabel = ROLES.find(r => r.id === role).label
  const journey = ROLES.find(r => r.id === role).journey
  const [activePhaseId, setActivePhaseId] = useState(journey[0].id)
  const activePhase = journey.find(p => p.id === activePhaseId)
  const [activeStepTitle, setActiveStepTitle] = useState(activePhase.steps[0].title)
  const videoBoxRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Drawer 裡切身份／階段只是「草稿」，背景（影片＋觸發按鈕文字）維持開 Drawer 當下的
  // 內容，直到使用者實際點選子流程才一次套用；不然還沒選定就先跳身份／階段，Drawer 底下
  // 的內容跟著提早變來變去，使用者會搞不清楚現在到底選到哪個
  const [stepDrawerOpen, setStepDrawerOpen] = useState(false)
  const [draftRole, setDraftRole] = useState(role)
  const [draftPhaseId, setDraftPhaseId] = useState(activePhaseId)
  const draftJourney = ROLES.find(r => r.id === draftRole).journey
  const draftPhase = draftJourney.find(p => p.id === draftPhaseId) ?? draftJourney[0]

  const phaseTabItems = useMemo(
    () => journey.map(({ id, title, badge }) => ({ value: id, title, badge })),
    [journey]
  )
  const draftPhaseTabItems = useMemo(
    () => draftJourney.map(({ id, title, badge }) => ({ value: id, title, badge })),
    [draftJourney]
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

  function openStepDrawer() {
    setDraftRole(role)
    setDraftPhaseId(activePhaseId)
    setStepDrawerOpen(true)
  }

  // 使用者實際點了子流程才算「確定」，這時才一次把草稿的身份／階段連同選到的子流程套用到
  // 背景畫面，並關閉 Drawer
  function handleStepSelect(title) {
    setRole(draftRole)
    setActivePhaseId(draftPhaseId)
    setActiveStepTitle(title)
    setStepDrawerOpen(false)
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

      {/* 手機版只留標題和影片容器，團主／成員身份切換收進下面的 Drawer 裡選；桌機/平板
          維持原本標題下方獨立顯示一排身份切換按鈕 */}
      <div className="mt-4 hidden w-full sm:block">
        <RoleToggle activeValue={role} onChange={handleRoleChange} />
      </div>

      <div className="-mx-3 mt-6 w-[calc(100%+1.5rem)] sm:mx-0 sm:w-full">
        {/* 底線 Tab 收進影片容器內當作頁籤列，跟下面的影片共用同一個外框/圓角，視覺上像
            一張完整的播放卡片，而不是「Tab 列 + 另一個獨立的影片框」兩塊拼接。手機版沒有
            桌機的 hover 展開能力，階段／子流程改收進點擊影片左上角按鈕才叫出的底部 Drawer，
            影片容器本身可以整個滿版，不用另外切一塊側邊欄位置；桌機/平板維持原本頁籤貼頂
            橫向排列＋影片右側 hover 展開子流程選單 */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="hidden border-b border-line px-2 pt-1 sm:block">
            <UnderlineTabs
              items={phaseTabItems}
              activeValue={activePhaseId}
              onChange={handlePhaseChange}
            />
          </div>

          <div key={`${activePhaseId}-${activeStepTitle}`} className="animate-fade-in-up">
            {/* 手機版拿掉 aspect-[9/16]，改成固定高度＋w-full：容器寬度是 aspect-ratio
                鎖住寬高比，之前想把容器加寬，寬度一變高度也跟著等比拉高，反而讓整體內容
                變更高、被 RevealSection 的自動縮放機制縮得更小，寬度看起來又變窄了，
                兩者互相抵銷；改成固定高度後寬度可以單獨調寬，不會牽動高度 */}
            <div
              ref={videoBoxRef}
              className="relative flex h-[28rem] w-full items-center justify-center bg-raised text-ink-4 sm:aspect-video sm:h-auto"
            >
              <Play size={40} strokeWidth={1.5} />

              <StepDots items={activePhase.steps} activeValue={activeStepTitle} onChange={setActiveStepTitle} />
              <StepTrigger roleLabel={roleLabel} activeValue={activeStepTitle} onClick={openStepDrawer} />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? '離開全螢幕' : '全螢幕播放'}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-canvas/80 text-ink-3 shadow-sm backdrop-blur transition-colors hover:bg-raised hover:text-ink sm:top-auto sm:bottom-2"
              >
                {isFullscreen ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={stepDrawerOpen} onOpenChange={setStepDrawerOpen} swipeDirection="down" showSwipeHandle>
        {/* 不同階段的子流程數量不一樣，內容自然撐開的高度預設會跟著換高換低，切換階段時
            Drawer 高度跳動、體感不穩，這裡用 --drawer-height 固定高度，子流程數量較多的
            階段改由清單自己內部捲動（見下面 StepDrawerContent 的 overflow-y-auto） */}
        <DrawerContent style={{ '--drawer-height': '40dvh' }}>
          <StepDrawerContent
            role={draftRole}
            onRoleChange={setDraftRole}
            phaseTabItems={draftPhaseTabItems}
            activePhaseId={draftPhaseId}
            onPhaseChange={setDraftPhaseId}
            steps={draftPhase.steps}
            activeStepTitle={draftRole === role && draftPhaseId === activePhaseId ? activeStepTitle : null}
            onStepChange={handleStepSelect}
          />
        </DrawerContent>
      </Drawer>
    </section>
  )
}
