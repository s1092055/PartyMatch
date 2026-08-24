import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MousePointerClick, Play, RotateCcw, X } from 'lucide-react'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_HOST_JOURNEY, HOME_MEMBER_JOURNEY } from '../data/homeContent'

const ROLES = [
  { id: 'host', label: '團主', journey: HOME_HOST_JOURNEY },
  { id: 'member', label: '成員', journey: HOME_MEMBER_JOURNEY },
];

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

function StepPanel({ open, onClose, items, activeValue, onChange }) {
  return (
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
  );
}

export default function IdentityJourney() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const [role, setRole] = useState(ROLES[0].id)
  const journey = ROLES.find(r => r.id === role).journey
  const [activePhaseId, setActivePhaseId] = useState(journey[0].id)
  const activePhase = journey.find(p => p.id === activePhaseId)
  const videoRef = useRef(null)
  const [stepPanelOpen, setStepPanelOpen] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false);
  const [isHoverDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );

  const videoSrc = isHoverDevice ? activePhase.videoDesktop : activePhase.video;

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

  function handlePrimaryAction() {
    if (role === 'host') {
      navigate(loggedIn ? '/create-group' : '/register')
    } else {
      navigate('/explore')
    }
  }

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

      <div className="mt-4 w-full">
        <RoleToggle activeValue={role} onChange={handleRoleChange} />
      </div>
      <div className="-mx-3 mt-6 w-[calc(100%+1.5rem)] can-hover:lg:mx-0 can-hover:lg:w-full">

        <div className="relative overflow-hidden rounded-lg">
          <div key={activePhaseId} className="animate-fade-in-up">

            <div
              className={`relative flex w-full items-center justify-center overflow-hidden text-ink-4 ${
                isHoverDevice ? 'aspect-video h-auto' : 'h-[44rem]'
              }`}
            >

              {videoSrc ? (
                <>

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

        <div key={activePhaseId} className="animate-fade-in-up mt-4 flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-4">
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-extrabold text-ink sm:text-base">{activePhase.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3 sm:text-sm">{activePhase.desc}</p>
          </div>
          <StepTrigger onClick={openStepPanel} />
        </div>
      </div>
    </section>
  );
}
