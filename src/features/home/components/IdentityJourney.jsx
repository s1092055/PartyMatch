import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MousePointerClick, Play, RotateCcw, X } from 'lucide-react'
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

// 開啟階段選單的觸發按鈕，放在影片說明文字卡片右側，不疊在影片畫面上
function StepTrigger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line/70 bg-canvas px-3 text-xs font-bold text-ink-2 shadow-sm transition-colors hover:bg-raised"
    >
      <MousePointerClick size={14} strokeWidth={1.5} className="shrink-0" />
      選擇流程
    </button>
  )
}

// 影片播完疊在畫面上的結束畫面，跟 YouTube 播完問「要不要重播」同款手感：黑色遮罩淡入
// 蓋住影片（duration-500，比其他按鈕淡入淡出稍慢，讓「播完了」這件事更明顯），問使用者
// 要重播還是直接去下一步；primaryLabel／onPrimaryAction 由外部依身份決定文案跟目的地
function VideoEndOverlay({ visible, onReplay, onPrimaryAction, primaryLabel }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/75 text-center transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <p className="text-sm font-bold text-white">影片播放完畢</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/20"
        >
          <RotateCcw size={16} strokeWidth={1.5} />
          重播
        </button>
        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand/90"
        >
          {primaryLabel}
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

// 從影片容器正中央開啟的面板，手感跟一般 Modal 一樣（淡入＋輕微縮放，不是從邊緣滑入）：
// 背景遮罩蓋住整個影片容器（inset-0），點遮罩關閉；面板本身用 flex items-center
// justify-center 置中疊在遮罩上，寬度固定不吃滿容器，四個階段（建立群組／群組管理／
// 續訂管理／其他情境）縱向排列，點選其中一個直接切換並關閉面板
function StepPanel({ open, onClose, items, activeValue, onChange }) {
  return (
    // 這層外層 wrapper 蓋滿整個影片容器（inset-0）方便置中疊面板，但它本身也是一個
    // 有版面範圍的 div：即使沒有背景色，只要 pointer-events 沒關掉，瀏覽器 hit-test
    // 還是會先打到這層、擋住底下的 video，導致面板關閉時點影片完全沒反應。面板關閉時
    // 一定要整層 pointer-events-none，只留開啟時給裡面的遮罩／面板各自接手點擊
    <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 ${open ? '' : 'pointer-events-none'}`}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
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
        className={`relative flex w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-line/70 bg-surface/95 shadow-lg backdrop-blur-md transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
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
        <div className="flex flex-col gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
    </div>
  )
}

// 「不同身份，各有各的任務」區塊：先選身份（團主／成員），再看該身份底下四個大階段
// （建立/加入群組／管理／續約／其他情境）。過去這裡曾經在每個階段底下再拆出更細的子流程
// （垂直 Tab／子選單），但那個顆粒度應該交給影片本身的分段來呈現，不需要在網站互動上
// 重複拆一次，因此簡化成只有階段這一層選擇，不再往下細分。真桌機用貼頂橫排的底線 Tab；
// 沒有真正 hover 能力的裝置（手機＋iPad）改成點擊影片左上角「選擇流程」按鈕才叫出、從
// 影片容器內部滑出的面板
export default function IdentityJourney() {
  const navigate = useNavigate()
  const [role, setRole] = useState(ROLES[0].id)
  const journey = ROLES.find(r => r.id === role).journey
  const [activePhaseId, setActivePhaseId] = useState(journey[0].id)
  const activePhase = journey.find(p => p.id === activePhaseId)
  const videoRef = useRef(null)
  const [stepPanelOpen, setStepPanelOpen] = useState(false)
  // 影片播完後顯示重播／下一步的結束畫面；換身份或換階段都要換一支影片重新播放，
  // 得跟著重設，不然新影片才剛開始播，結束畫面卻還疊在上面
  const [videoEnded, setVideoEnded] = useState(false)
  // 播哪一支影片要看裝置本身有沒有真正的滑鼠 hover 能力，不能看視窗寬度：不然真桌機
  // 使用者把視窗縮到 1024px 以下會被誤判成手機，看到直式手機操作影片反而更奇怪；平板
  // 沒有真正 hover 能力，直接併入手機這一組，播手機版影片。裝置的 hover 能力不會在
  // 使用中途改變，只偵測一次即可
  const [isHoverDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  // 目前這個裝置實際會播放的影片：真桌機播橫式的 videoDesktop，其餘裝置播直式的
  // video；兩邊各自獨立判斷有沒有對應影片，還沒補拍的那一邊 fallback 成 Play icon 佔位
  const videoSrc = isHoverDevice ? activePhase.videoDesktop : activePhase.video

  const phaseTabItems = journey.map(({ id, title, badge }) => ({ value: id, title, badge }))

  function handleRoleChange(nextRole) {
    setRole(nextRole)
    const nextJourney = ROLES.find(r => r.id === nextRole).journey
    setActivePhaseId(nextJourney[0].id)
    setVideoEnded(false)
  }

  function handlePhaseSelect(id) {
    setActivePhaseId(id)
    setVideoEnded(false)
    closeStepPanel()
  }

  function handleReplay() {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play()
    setVideoEnded(false)
  }

  // 團主看完影片直接導去建立群組頁；成員情境下「建立群組」不是下一步，改導去探索頁找
  // 現有群組申請
  function handlePrimaryAction() {
    navigate(role === 'host' ? '/create-group' : '/explore')
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
        {/* 四個階段的切換不分裝置都收進點擊影片說明卡片右側「選擇流程」按鈕才叫出的面板，
            不再另外用貼頂頁籤列——影片容器可以整個維持完整的播放卡片版面，不用另外切一塊
            頁籤區域 */}
        <div className="relative overflow-hidden rounded-lg">
          <div key={activePhaseId} className="animate-fade-in-up">
            {/* 容器高寬比／高度依裝置切換，跟上面 videoSrc 同一個 isHoverDevice 判斷，
                不是看視窗寬度：真桌機播的是橫式桌機錄影，用 aspect-video + h-auto 維持
                16:9；其餘裝置（手機＋iPad）播直式手機錄影，改用固定高度＋w-full——容器
                寬度是 aspect-ratio 鎖住寬高比的話，之前想把容器加寬，寬度一變高度也跟著
                等比拉高，反而讓整體內容變更高，寬度看起來又變窄了，兩者互相抵銷；改成
                固定高度後寬度可以單獨調寬，不會牽動高度 */}
            <div
              className={`relative flex w-full items-center justify-center overflow-hidden text-ink-4 ${
                isHoverDevice ? 'aspect-video h-auto' : 'h-[44rem]'
              }`}
            >
              {/* 每個階段各自對應手機／桌機兩支完整的流程影片（尚未全部補齊拍攝），
                  isHoverDevice 決定這個裝置實際要播哪一支、還沒補拍的那一邊 fallback 成
                  Play icon 佔位；同一時間只會掛載其中一個 <video> 元素，不是兩支都放進
                  DOM 用 CSS 互相隱藏——不然沒在播放的那一支也會被瀏覽器一起下載，白白
                  浪費流量（桌機那支是原始桌機錄影檔，體積比手機那支大上一截）。手機影片是
                  直式錄影（長寬比跟這裡固定高度＋滿版寬度的容器不同），用 object-contain
                  而不是 object-cover：cover 會裁切掉超出容器寬高比的部分，把直式影片放大
                  再裁邊，等於局部放大又內容被裁掉；contain 讓整支影片完整縮放進容器，維持
                  原始比例全部可見，上下或左右可能會留一點空白，但不會有內容被放大裁切的
                  問題。桌機影片是橫式錄影，長寬比跟 aspect-video 的容器一致，用
                  object-cover 即可 */}
              {videoSrc ? (
                <>
                  {/* 改用瀏覽器原生 <video controls>：播放/暫停、進度條、全螢幕、音量都
                      交給瀏覽器內建控制列，不用再自己刻按鈕跟顯示/收起邏輯。不再加 loop——
                      播完要停下來讓 onEnded 觸發下面的結束畫面，不是無限循環播放 */}
                  <video
                    ref={videoRef}
                    controls
                    onEnded={() => setVideoEnded(true)}
                    className={`absolute inset-0 h-full w-full ${isHoverDevice ? 'object-cover' : 'object-contain'}`}
                    src={videoSrc}
                    autoPlay
                    muted
                    playsInline
                  />
                  <VideoEndOverlay
                    visible={videoEnded}
                    onReplay={handleReplay}
                    onPrimaryAction={handlePrimaryAction}
                    primaryLabel={role === 'host' ? '建立群組' : '探索群組'}
                  />
                </>
              ) : (
                <Play size={40} strokeWidth={1.5} />
              )}

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

        {/* 目前選中階段的說明文字，獨立顯示在影片容器下方，跟容器分開兩個區塊；key 帶入
            activePhaseId 讓切換階段時重播一次淡入效果。「選擇流程」按鈕放在右側，文字
            跟著改成靠左對齊，呼應橫向排列的版面 */}
        <div key={activePhaseId} className="animate-fade-in-up mt-4 flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-4">
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-extrabold text-ink sm:text-base">{activePhase.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3 sm:text-sm">{activePhase.desc}</p>
          </div>
          <StepTrigger onClick={openStepPanel} />
        </div>
      </div>
    </section>
  )
}
