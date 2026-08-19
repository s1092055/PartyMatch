import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, MousePointerClick, Pause, Play, X } from 'lucide-react'
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

// 沒有真正 hover 能力的裝置（手機＋iPad）用來開啟階段選單的觸發按鈕，疊在影片左上角
// （跟右下角的全螢幕按鈕分開兩角，不會互相搶位置）；播放中的影片跟 YouTube 一樣預設收起
// 工具列，這裡的 visible 是外部算好的「現在該不該顯示」，只負責淡入淡出＋停用點擊，
// can-hover:lg:hidden 維持不變（真桌機沒有影片可播放，這顆按鈕本來就整個不出現）
function StepTrigger({ onClick, visible }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-2 top-2 z-10 flex h-9 items-center justify-center gap-1.5 rounded-full bg-canvas/80 px-3 text-xs font-bold text-ink-2 shadow-sm backdrop-blur transition-opacity duration-300 hover:bg-raised can-hover:lg:hidden ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <MousePointerClick size={14} strokeWidth={1.5} className="shrink-0" />
      選擇流程
    </button>
  )
}

// 從影片容器內部滑出的面板：一般的 absolute 定位元素，直接掛在有 position:relative 的
// videoBoxRef 底下，範圍侷限在影片容器本身，不是蓋住整個畫面的獨立 Drawer。從左側滑入，
// 寬度依裝置不同：手機全寬（沒有多餘影片可露出，遮罩收成 0 寬度不顯示），sm 以上（iPad）
// 只顯示一半寬度，右側露出的影片部分疊一層可點擊關閉的半透明遮罩。內容只有四個階段
// （建立群組／群組管理／續訂管理／其他情境），置中顯示在標題列底下的區域，點選其中一個
// 直接切換並關閉面板
function StepPanel({ open, onClose, items, activeValue, onChange }) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-y-0 right-0 left-full z-10 bg-black/40 transition-opacity duration-300 sm:left-1/2 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-label="選擇流程階段"
        // 用 inert 取代 aria-hidden：面板關閉時使用者仍可能停留在裡面的關閉按鈕上，
        // aria-hidden 只隱藏語意卻不會主動移除焦點，瀏覽器會噴警告；inert 會連同焦點
        // 一起處理掉，瀏覽器自動把焦點移出去
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
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {items.map(({ value, title, badge }) => {
            const active = value === activeValue
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                aria-current={active ? 'true' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition-colors ${
                  active ? 'bg-raised text-brand' : 'text-ink-2 hover:bg-raised'
                }`}
              >
                <span className={`text-[0.65rem] font-extrabold tracking-wider ${active ? 'text-brand' : 'text-ink-4'}`}>
                  {badge}
                </span>
                <span className="text-sm font-bold sm:text-base">{title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// 「不同身份，各有各的任務」區塊：先選身份（團主／成員），再看該身份底下四個大階段
// （建立/加入群組／管理／續約／其他情境）。過去這裡曾經在每個階段底下再拆出更細的子流程
// （垂直 Tab／子選單），但那個顆粒度應該交給影片本身的分段來呈現，不需要在網站互動上
// 重複拆一次，因此簡化成只有階段這一層選擇，不再往下細分。真桌機用貼頂橫排的底線 Tab；
// 沒有真正 hover 能力的裝置（手機＋iPad）改成點擊影片左上角「選擇流程」按鈕才叫出、從
// 影片容器內部滑出的面板
export default function IdentityJourney() {
  const [role, setRole] = useState(ROLES[0].id)
  const journey = ROLES.find(r => r.id === role).journey
  const [activePhaseId, setActivePhaseId] = useState(journey[0].id)
  const activePhase = journey.find(p => p.id === activePhaseId)
  const videoBoxRef = useRef(null)
  const videoRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // iPhone 版 Safari（不含 iPad）完全不支援 Fullscreen API 作用在一般元素上，
  // document.fullscreenEnabled 在 iPhone 上一律是 false；這裡先偵測起來，容器層級的
  // 全螢幕在 iPhone 上要整個換成下面 iosVideoFullscreenSupported 那條路
  const [fullscreenSupported] = useState(() => typeof document !== 'undefined' && !!document.fullscreenEnabled)
  // iPhone Safari 只有真正的 <video> 元素本身能透過 webkitEnterFullscreen 進全螢幕
  // （容器 div 不行），這裡做 feature detect，不支援就不顯示按鈕，避免按了沒反應
  const [iosVideoFullscreenSupported] = useState(
    () => typeof window !== 'undefined' && typeof window.HTMLVideoElement?.prototype.webkitEnterFullscreen === 'function'
  )
  const [stepPanelOpen, setStepPanelOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  // 手機版影片自動播放時，說明文字＋工具列（選擇流程／播放暫停／全螢幕按鈕）跟 YouTube
  // 一樣預設收起、點擊影片容器才顯示，避免疊在畫面上擋住內容；沒有影片可播放的階段
  // （還沒補拍）或影片被暫停時維持一直顯示——沒有東西在播放就不需要「隱藏工具列」，
  // 這兩種情況的顯示條件併入下面的 controlsVisible 一起算，不是只看這個旗標本身
  const [showControls, setShowControls] = useState(false)
  // 切換階段時，影片會換一支重新自動播放，工具列也要重新收起，避免沿用上一個階段的
  // 顯示/播放狀態；用「渲染期間比對前一次的 activePhaseId」這個 React 官方建議的作法
  // 調整 state（見 https://react.dev/learn/you-might-not-need-an-effect），不要放進
  // useEffect 裡呼叫 setState，否則會多一次不必要的重新渲染
  const [prevPhaseId, setPrevPhaseId] = useState(activePhaseId)
  if (activePhaseId !== prevPhaseId) {
    setPrevPhaseId(activePhaseId)
    setShowControls(false)
    setIsPlaying(true)
  }

  // 影片播放中、工具列被點出來顯示時，跟 YouTube 一樣過幾秒沒有動作就自動收回去，
  // 不然工具列會一直蓋在畫面上；暫停或沒有影片時 controlsVisible 本來就一直是
  // true（見下面），不會進到這個 effect 的收回邏輯
  useEffect(() => {
    if (!showControls || !isPlaying) return
    const timer = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(timer)
  }, [showControls, isPlaying, activePhaseId])

  // 工具列／說明文字實際該不該顯示：使用者手動叫出來、影片暫停中、或這個階段根本沒有
  // 影片在播放（只是 Play icon 佔位）三種情況都要顯示，只有「影片正在播放且使用者沒有
  // 點出來」才收起
  const controlsVisible = showControls || !isPlaying || !activePhase.video

  const phaseTabItems = journey.map(({ id, title, badge }) => ({ value: id, title, badge }))

  // 影片可能被使用者點按鈕暫停、或開啟「選擇流程」面板時被程式呼叫 pause()，這裡監聽
  // 原生的 play/pause 事件，讓按鈕圖示永遠反映影片實際播放狀態，而不是自己維護一份
  // 可能失準的旗標
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function handlePlay() { setIsPlaying(true) }
    function handlePause() { setIsPlaying(false) }
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [activePhaseId])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole)
    const nextJourney = ROLES.find(r => r.id === nextRole).journey
    setActivePhaseId(nextJourney[0].id)
  }

  function handlePhaseSelect(id) {
    setActivePhaseId(id)
    closeStepPanel()
  }

  // 開啟「選擇流程」面板時先暫停目前播放中的影片，避免面板蓋在畫面上時背景還繼續播放；
  // 關閉面板時如果階段沒有跟著換（選了同一個階段、或直接點 X／背景關閉），影片元素不會
  // 重新掛載，要自己接手把暫停的影片播回去，不然會卡在暫停狀態
  function openStepPanel() {
    videoRef.current?.pause()
    setStepPanelOpen(true)
  }

  function closeStepPanel() {
    setStepPanelOpen(false)
    videoRef.current?.play()
  }

  // 佔位區塊／其餘裝置走容器層級的 Fullscreen API；監聽 fullscreenchange 是因為使用者
  // 也可能按 Esc 離開全螢幕（不是點按鈕），這種情況也要把 icon 切回「進入全螢幕」的箭頭
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === videoBoxRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // iPhone Safari 進出全螢幕不會觸發上面的 fullscreenchange，是走 <video> 元素自己的
  // webkitbeginfullscreen／webkitendfullscreen 事件（含使用者用系統手勢滑掉全螢幕的
  // 情況），要另外監聽才能讓 icon 正確反映狀態
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function handleBegin() { setIsFullscreen(true) }
    function handleEnd() { setIsFullscreen(false) }
    video.addEventListener('webkitbeginfullscreen', handleBegin)
    video.addEventListener('webkitendfullscreen', handleEnd)
    return () => {
      video.removeEventListener('webkitbeginfullscreen', handleBegin)
      video.removeEventListener('webkitendfullscreen', handleEnd)
    }
  }, [activePhaseId])

  // iPhone Safari 沒有容器層級的 Fullscreen API，要改叫 <video> 元素本身的
  // webkitEnterFullscreen()；其餘支援一般元素全螢幕的裝置（含 iPad）維持原本容器層級的
  // requestFullscreen，這樣影片上疊的說明文字／按鈕能一起被含進全螢幕畫面
  function toggleFullscreen() {
    if (!fullscreenSupported && iosVideoFullscreenSupported) {
      videoRef.current?.webkitEnterFullscreen()
      return
    }
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

      {/* 團主／成員身份切換固定顯示在標題下方，不分裝置 */}
      <div className="mt-4 w-full">
        <RoleToggle activeValue={role} onChange={handleRoleChange} />
      </div>

      <div className="-mx-3 mt-6 w-[calc(100%+1.5rem)] can-hover:lg:mx-0 can-hover:lg:w-full">
        {/* 底線 Tab 收進影片容器內當作頁籤列，跟下面的影片共用同一個外框/圓角，視覺上像
            一張完整的播放卡片，而不是「Tab 列 + 另一個獨立的影片框」兩塊拼接。沒有真正
            hover 能力的裝置（手機＋iPad）四個階段改收進點擊影片左上角「選擇流程」按鈕
            才叫出的面板，真桌機維持原本頁籤貼頂橫向排列 */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="hidden border-b border-line px-2 pt-1 can-hover:lg:block">
            <UnderlineTabs
              items={phaseTabItems}
              activeValue={activePhaseId}
              onChange={setActivePhaseId}
            />
          </div>

          <div key={activePhaseId} className="animate-fade-in-up">
            {/* 沒有真正 hover 能力的裝置拿掉 aspect-video，改成固定高度＋w-full：容器寬度
                是 aspect-ratio 鎖住寬高比，之前想把容器加寬，寬度一變高度也跟著等比拉高，
                反而讓整體內容變更高，寬度看起來又變窄了，兩者互相抵銷；改成固定高度後
                寬度可以單獨調寬，不會牽動高度。首頁 Section 已經是自然高度（不用塞進一個
                螢幕），這裡的高度純粹依內容需求調整即可。手機版影片是直式錄影（長寬比
                遠比這個容器窄高），改用 object-contain 後高度不夠會讓影片上下留白很多，
                所以把固定高度加高，縮小空白比例，讓影片視覺上更接近全高顯示 */}
            <div
              ref={videoBoxRef}
              className="relative flex h-[44rem] w-full items-center justify-center overflow-hidden text-ink-4 can-hover:lg:aspect-video can-hover:lg:h-auto"
            >
              {/* 每個階段各自對應一支完整的流程影片（尚未全部補齊拍攝），沒有真正 hover
                  能力的裝置（手機＋iPad）直接播放；真桌機跟其餘還沒補拍的階段一樣維持
                  Play icon 佔位。之後每個階段都補上對應影片時，這裡改成不分裝置直接播放
                  即可，不用再判斷 activePhase.video 存不存在。影片本身是直式手機錄影
                  （長寬比跟這裡固定高度＋滿版寬度的容器不同），用 object-contain 而不是
                  object-cover：cover 會裁切掉超出容器寬高比的部分，把直式影片放大再裁邊，
                  等於局部放大又內容被裁掉；contain 讓整支影片完整縮放進容器，維持原始比例
                  全部可見，上下或左右可能會留一點空白，但不會有內容被放大裁切的問題 */}
              {activePhase.video ? (
                <>
                  {/* 點擊影片本身叫出／收回工具列，跟 YouTube 手機版同一套手感：工具列
                      隱藏時這裡直接接住點擊；工具列顯示時，蓋在上面的置中播放/暫停按鈕、
                      左上角選擇流程、右下角全螢幕按鈕會各自攔截點擊，不會穿透到這裡 */}
                  <video
                    ref={videoRef}
                    onClick={() => setShowControls(v => !v)}
                    className="absolute inset-0 h-full w-full object-contain can-hover:lg:hidden"
                    src={activePhase.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <Play size={40} strokeWidth={1.5} className="hidden can-hover:lg:block" />

                  {/* 播放/暫停按鈕置中疊在影片正中央（YouTube 同款位置），用 inset-0 +
                      m-auto 讓固定尺寸的圓形按鈕在 relative 容器內置中，不用另外算座標；
                      隱藏時 pointer-events-none 讓點擊穿透到底下的 video，才能點影片任意
                      位置（含正中央）重新叫出工具列 */}
                  <button
                    type="button"
                    onClick={togglePlayback}
                    aria-label={isPlaying ? '暫停播放' : '繼續播放'}
                    className={`absolute inset-0 z-10 m-auto grid h-14 w-14 place-items-center rounded-full bg-canvas/80 text-ink-3 shadow-sm backdrop-blur transition-opacity duration-300 hover:bg-raised hover:text-ink can-hover:lg:hidden ${
                      controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {isPlaying ? <Pause size={24} strokeWidth={1.5} /> : <Play size={24} strokeWidth={1.5} />}
                  </button>
                </>
              ) : (
                <Play size={40} strokeWidth={1.5} />
              )}

              <StepTrigger onClick={openStepPanel} visible={controlsVisible} />

              {/* 沒有真正 hover 能力的裝置（手機＋iPad）全螢幕按鈕放右上角，跟左上角的
                  「選擇流程」左右對稱；真桌機維持原本右下角（can-hover:lg:bottom-2
                  can-hover:lg:top-auto 蓋回去） */}
              {(fullscreenSupported || (iosVideoFullscreenSupported && activePhase.video)) && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? '離開全螢幕' : '全螢幕播放'}
                  className={`absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-canvas/80 text-ink-3 shadow-sm backdrop-blur transition-opacity duration-300 hover:bg-raised hover:text-ink can-hover:lg:top-auto can-hover:lg:bottom-2 can-hover:lg:opacity-100 can-hover:lg:pointer-events-auto ${
                    controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  {isFullscreen ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
                </button>
              )}

              {/* 目前選中階段的說明文字，疊在影片容器內部底部置中。外層 inset-x-0 撐滿
                  整個寬度，pointer-events-none 避免蓋住底下的 video／置中播放鈕。顯示/
                  隱藏跟其餘工具列共用同一個 controlsVisible：播放中且使用者沒叫出來時
                  收起，暫停中／沒有影片可播放（只是 Play icon 佔位）／使用者點出來時
                  顯示；can-hover:lg:opacity-100 讓真桌機（沒有播放中的影片）強制蓋過這個
                  判斷、維持一直顯示。這裡故意不用 animate-fade-in-up：那個 class 的
                  animation 帶 fill-mode both，動畫結束後會把 opacity 鎖在 1，之後
                  controlsVisible 切到 false 時 opacity-0 這個 utility class 完全蓋不過
                  animation 鎖住的值，說明文字會變成永遠顯示、按鈕收不起來 */}
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-3 text-center transition-opacity duration-300 can-hover:lg:opacity-100 ${
                  controlsVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* w-fit + max-w-full：卡片寬度跟著文字內容的實際寬度縮放，塞得下就單行
                    顯示，不會被固定寬度（原本 max-w-md）硬性截斷成兩行；螢幕太窄放不下
                    完整內容寬度時，max-w-full 頂住到容器可用寬度，文字才自然換行 */}
                <div className="mx-auto w-fit max-w-full rounded-2xl bg-canvas/85 px-4 py-3 text-left shadow-sm backdrop-blur-md">
                  <p className="text-sm font-extrabold text-ink sm:text-base">{activePhase.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3 sm:text-sm">{activePhase.desc}</p>
                </div>
              </div>

              <StepPanel
                open={stepPanelOpen}
                onClose={closeStepPanel}
                items={phaseTabItems}
                activeValue={activePhaseId}
                onChange={handlePhaseSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
