import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2, MousePointerClick, Play, X } from 'lucide-react'
import { HOME_HOST_JOURNEY, HOME_MEMBER_JOURNEY } from '../data/homeContent'

// 兩種身份共用同一組階段 id，切換身份時 Tab 位置／徽章不變，只換底下標題跟內容，
// 呼應這個區塊想傳達的「同一個平台，不同身份各自的任務」
const ROLES = [
  { id: 'host', label: '團主', journey: HOME_HOST_JOURNEY },
  { id: 'member', label: '成員', journey: HOME_MEMBER_JOURNEY },
]

// 身份切換：兩顆各自獨立的圓角按鈕（不是共用背景的 Segmented Control），固定顯示在標題
// 下方，不分裝置。手機螢幕較窄，兩顆用 flex-1 平分寬度；sm 以上維持原本置中、固定寬度
function RoleToggle({ activeValue, onChange }) {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-4 sm:max-w-none sm:gap-6">
      {ROLES.map(({ id, label }) => {
        const active = id === activeValue
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-1 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold transition-colors sm:w-44 sm:flex-none ${
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
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-3 text-sm font-bold outline-none transition-colors ${
            value === activeValue ? 'text-brand' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <span
            className={`w-full truncate text-center text-[0.65rem] font-extrabold tracking-wider ${value === activeValue ? 'text-brand' : 'text-ink-4'}`}
          >
            {badge}
          </span>
          <span data-value={value} className="w-full truncate text-center">{title}</span>
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
// 沒有真正 hover 能力的裝置（手機＋iPad）改用下面的 StepTrigger + StepPanel，這裡只留給
// 真桌機顯示，跟 can-hover 判斷相關元件同一套模式
function StepDots({ items, activeValue, onChange }) {
  return (
    <nav aria-label="子流程" className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 can-hover:lg:left-3 can-hover:lg:block">
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

// 沒有真正 hover 能力的裝置（手機＋iPad）子流程選單：桌機那套「收合成點、hover 才展開」
// 在觸控裝置上沒有 hover，改放一顆疊在影片左上角的按鈕（跟右下角的全螢幕按鈕分開兩角，
// 不會互相搶位置），點開才叫出底下的 StepPanel；階段（UnderlineTabs）跟子流程都收進
// 同一個面板裡切換，不用再另外佔版面，影片容器可以整個滿版。身份切換按鈕固定顯示在
// 標題下方（不分裝置），不收進這個面板
function StepTrigger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-2 top-2 z-10 flex h-9 items-center justify-center gap-1.5 rounded-full bg-canvas/80 px-3 text-xs font-bold text-ink-2 shadow-sm backdrop-blur transition-colors hover:bg-raised can-hover:lg:hidden"
    >
      <MousePointerClick size={14} strokeWidth={1.5} className="shrink-0" />
      選擇流程
    </button>
  )
}

// 從影片容器內部滑出的面板：跟原本全螢幕的 Base UI Drawer 不同，這裡改成一般的
// absolute 定位元素，直接掛在有 position:relative 的 videoBoxRef 底下，範圍侷限在
// 影片容器本身（inset-y-0 left-0 對齊的是最近的 relative 祖先，也就是影片容器，不是
// 整個視窗），視覺上是「從影片容器打開的面板」而不是蓋住整個畫面的獨立 Drawer；外層
// 卡片本來就有 overflow-hidden + rounded-2xl，面板滑出時邊角會自然被裁成一致的圓角。
// 從左側滑入，寬度依裝置不同：手機全寬（沒有多餘影片可露出），sm 以上（iPad）只顯示
// 一半寬度，右側留一半露出影片內容。背景用半透明＋模糊（不是純色），底下的影片畫面
// 隱約透出來；iPad 版右側沒被面板蓋住的部分疊一層可點擊關閉的半透明遮罩，維持「點外面
// 關閉」的手感（手機全寬時沒有露出區域，遮罩收成 0 寬度不顯示）。依序是階段（沿用桌機
// 同一顆 UnderlineTabs 切階段）、子流程清單；點選子流程直接關閉面板（跟原本 Select
// 選完就收起同一種手感），切階段則維持開著讓使用者接著往下選
function StepPanel({ open, onClose, phaseTabItems, activePhaseId, onPhaseChange, steps, activeStepTitle, onStepChange }) {
  return (
    <>
      {/* 手機版面板全寬，沒有露出的影片區域，不需要遮罩；sm 以上（iPad）面板改成只顯示
          一半寬度，右側會露出一部分影片內容，這裡疊一層可點擊關閉的半透明遮罩，維持「點
          外面關閉」的手感。left-1/2 對齊面板實際寬度（sm:w-1/2），確保遮罩跟面板剛好
          接壤、不重疊——面板本身有 backdrop-blur，如果遮罩蓋到面板底下，blur 會把遮罩的
          黑色一起取樣進去，讓面板背景看起來混濁變色，不是乾淨的半透明卡片色。手機版用
          left-full 讓遮罩寬度收成 0（完全不可見），呼應面板全寬時沒有遮罩的設計 */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-y-0 right-0 left-full z-10 bg-black/40 transition-opacity duration-300 sm:left-1/2 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-label="選擇流程階段與步驟"
        // 用 inert 取代 aria-hidden：面板關閉時使用者仍可能停留在裡面的關閉按鈕上
        // （例如剛點完關閉），aria-hidden 只隱藏語意卻不會主動移除焦點，瀏覽器會噴
        // 「aria-hidden 蓋到還有焦點的元素」的警告；inert 會連同焦點一起處理掉，
        // 瀏覽器自動把焦點移出去，不會有這個警告，也一併阻擋隱藏狀態下的鍵盤操作
        inert={!open}
        className={`absolute inset-y-0 left-0 z-20 flex w-full flex-col overflow-hidden bg-surface/85 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-1/2 sm:border-r sm:border-line/70 ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line/70 px-3 py-2.5">
          <span />
          <span className="text-center text-sm font-extrabold text-ink sm:text-base">選擇流程</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="grid h-7 w-7 shrink-0 place-items-center justify-self-end rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="shrink-0 border-b border-line/70 px-3 pt-1">
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
                className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors sm:text-base ${
                  active ? 'bg-raised text-brand' : 'text-ink-2 hover:bg-raised'
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-brand' : 'bg-ink-4'}`} />
                {title}
              </button>
            )
          })}
        </div>
      </div>
    </>
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
  const activeStep = activePhase.steps.find(s => s.title === activeStepTitle) ?? activePhase.steps[0]
  const videoBoxRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // iPhone 版 Safari（不含 iPad）完全不支援 Fullscreen API 作用在一般元素上（只有真正的
  // <video> 元素能透過 webkitEnterFullscreen 進全螢幕），document.fullscreenEnabled 在
  // iPhone 上一律是 false；這裡先偵測起來，不支援就整顆按鈕不顯示，避免按了沒反應
  const [fullscreenSupported] = useState(() => typeof document !== 'undefined' && !!document.fullscreenEnabled)

  // 面板裡切階段只是「草稿」，背景（影片＋觸發按鈕）維持開面板當下的內容，直到
  // 使用者實際點選子流程才一次套用；不然還沒選定就先跳階段，面板底下的內容跟著提早
  // 變來變去，使用者會搞不清楚現在到底選到哪個。身份切換固定顯示在標題下方，選了直接
  // 套用，不需要草稿機制
  const [stepPanelOpen, setStepPanelOpen] = useState(false)
  const [draftPhaseId, setDraftPhaseId] = useState(activePhaseId)
  const draftPhase = journey.find(p => p.id === draftPhaseId) ?? journey[0]

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

  // 目前影片區塊還只是靜態 Play icon 佔位，沒有真正在播放的媒體可以暫停；之後換成
  // 實際 <video> 元素時，這裡要一併呼叫 video.pause()，面板蓋住畫面時背景不會繼續播放
  function openStepPanel() {
    setDraftPhaseId(activePhaseId)
    setStepPanelOpen(true)
  }

  // 使用者實際點了子流程才算「確定」，這時才一次把草稿的階段連同選到的子流程套用到
  // 背景畫面，並關閉面板
  function handleStepSelect(title) {
    setActivePhaseId(draftPhaseId)
    setActiveStepTitle(title)
    setStepPanelOpen(false)
  }

  // 先讓佔位區塊就能進全螢幕，之後換成實際 <video> 時容器不用動，直接沿用同一顆按鈕跟
  // requestFullscreen 邏輯；監聽 fullscreenchange 是因為使用者也可能按 Esc 離開全螢幕
  // （不是點按鈕），這種情況也要把 icon 切回「進入全螢幕」的箭頭。iPhone Safari 完全不
  // 支援一般元素的 Fullscreen API，按鈕本身在上面用 fullscreenSupported 整顆隱藏；
  // 之後換成真的 <video> 元素時，iPhone 要另外走 video.webkitEnterFullscreen() 這條
  // iOS 專屬的路徑（只有 <video> 標籤本身支援，容器 div 沒有），不能沿用這裡的邏輯
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
      videoBoxRef.current?.requestFullscreen().catch(() => {})
    }
  }

  return (
    <section id="identity" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        我想成為？
      </h2>

      {/* 團主／成員身份切換固定顯示在標題下方，不分裝置（沒有真正 hover 能力的手機／
          iPad 底下改用同一套「Toggle 展開影片內容」的顯示方式，但身份切換不收進那個
          面板） */}
      <div className="mt-4 w-full">
        <RoleToggle activeValue={role} onChange={handleRoleChange} />
      </div>

      <div className="-mx-3 mt-6 w-[calc(100%+1.5rem)] can-hover:lg:mx-0 can-hover:lg:w-full">
        {/* 底線 Tab 收進影片容器內當作頁籤列，跟下面的影片共用同一個外框/圓角，視覺上像
            一張完整的播放卡片，而不是「Tab 列 + 另一個獨立的影片框」兩塊拼接。沒有真正
            hover 能力的裝置（手機＋iPad）階段／子流程改收進點擊影片左上角「選擇流程」
            按鈕才叫出、從影片容器內部滑出的面板，影片容器本身可以整個滿版，不用另外切
            一塊側邊欄位置；真桌機維持原本頁籤貼頂橫向排列＋影片左側 hover 展開子流程選單 */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="hidden border-b border-line px-2 pt-1 can-hover:lg:block">
            <UnderlineTabs
              items={phaseTabItems}
              activeValue={activePhaseId}
              onChange={handlePhaseChange}
            />
          </div>

          <div key={`${activePhaseId}-${activeStepTitle}`} className="animate-fade-in-up">
            {/* 沒有真正 hover 能力的裝置拿掉 aspect-video，改成固定高度＋w-full：容器寬度
                是 aspect-ratio 鎖住寬高比，之前想把容器加寬，寬度一變高度也跟著等比拉高，
                反而讓整體內容變更高，寬度看起來又變窄了，兩者互相抵銷；改成固定高度後
                寬度可以單獨調寬，不會牽動高度。首頁 Section 已經是自然高度（不用塞進一個
                螢幕），這裡的高度純粹依內容需求調整即可 */}
            <div
              ref={videoBoxRef}
              className="relative flex h-[34rem] w-full items-center justify-center bg-raised text-ink-4 can-hover:lg:aspect-video can-hover:lg:h-auto"
            >
              <Play size={40} strokeWidth={1.5} />

              <StepDots items={activePhase.steps} activeValue={activeStepTitle} onChange={setActiveStepTitle} />
              <StepTrigger onClick={openStepPanel} />

              {fullscreenSupported && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? '離開全螢幕' : '全螢幕播放'}
                  className="absolute bottom-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-canvas/80 text-ink-3 shadow-sm backdrop-blur transition-colors hover:bg-raised hover:text-ink"
                >
                  {isFullscreen ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
                </button>
              )}

              {/* 目前選中子流程的說明文字，疊在影片容器內部底部置中；key 帶入
                  activeStepTitle 讓切換子流程時重播一次淡入效果。外層 pr 留出右下角
                  全螢幕按鈕的位置，避免文字卡片跟按鈕疊在一起；外層 inset-x-0 撐滿整個
                  寬度，pr 只是內距不是實際留白，右側 padding 區域仍然是這個 div 的範圍，
                  沒有 pointer-events-none 的話會蓋住並吃掉全螢幕按鈕的點擊，因為這個
                  說明區塊在 DOM 順序上排在按鈕後面、同樣是 z-10，後面的元素蓋在上面 */}
              <div
                key={activeStepTitle}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 animate-fade-in-up px-4 pb-3 pr-14 text-center can-hover:lg:pr-16"
              >
                <div className="mx-auto max-w-md rounded-2xl bg-canvas/85 px-4 py-3 shadow-sm backdrop-blur-md">
                  <p className="text-sm font-extrabold text-ink sm:text-base">{activeStep.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3 sm:text-sm">{activeStep.desc}</p>
                </div>
              </div>

              <StepPanel
                open={stepPanelOpen}
                onClose={() => setStepPanelOpen(false)}
                phaseTabItems={phaseTabItems}
                activePhaseId={draftPhaseId}
                onPhaseChange={setDraftPhaseId}
                steps={draftPhase.steps}
                activeStepTitle={draftPhaseId === activePhaseId ? activeStepTitle : null}
                onStepChange={handleStepSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
