import { useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Clock, FileText, ShieldAlert, UserCheck, UserX } from 'lucide-react'

const FLOW_STEPS = [
  {
    step: 1,
    label: '收到申請通知',
    desc: '系統會在通知中心提醒你有新的加入申請。',
  },
  {
    step: 2,
    label: '查看申請者資料',
    desc: '前往「群組管理」，瀏覽對方的信用分數與自我介紹。',
  },
  {
    step: 3,
    label: '核准申請',
    desc: '成員自動加入群組，名額減少，系統即時通知對方。',
  },
  {
    step: 4,
    label: '拒絕申請',
    desc: '系統通知對方申請未通過，不影響群組其他成員。',
  },
]

const TASKS = [
  {
    icon: UserCheck,
    title: '審核申請',
    desc: '收到新成員的加入申請後，查看對方的信用分數與資料，決定要核准或拒絕。',
  },
  {
    icon: CheckCircle2,
    title: '確認付款',
    desc: '成員標記付款後，確認你已收到款項，點擊確認即完成這筆紀錄。',
  },
  {
    icon: UserX,
    title: '管理成員',
    desc: '成員違規或長期未付款時，可以將對方移出群組並調整其信用分數。',
  },
  {
    icon: CheckCircle2,
    title: '啟用群組',
    desc: '名額招滿後手動啟用群組，系統會通知所有成員開始進行付款。',
  },
  {
    icon: Clock,
    title: '續訂或結束',
    desc: '每個計費週期結束時，選擇繼續招募下一輪，或結束這個群組。',
  },
]

const NOTICES = [
  {
    icon: Clock,
    text: '請在 48 小時內回覆申請，讓等待的成員有個底。',
  },
  {
    icon: ShieldAlert,
    text: '啟用群組前確認名額已滿，啟用後無法退回招募狀態。',
  },
  {
    icon: AlertCircle,
    text: '信用分數調整會直接影響對方，移除成員前請謹慎考慮。',
  },
  {
    icon: FileText,
    text: '群組規則請在建立時寫清楚，避免事後與成員產生糾紛。',
  },
]

const TABS = [
  { value: 'flow',   label: '申請流程', slides: FLOW_STEPS },
  { value: 'tasks',  label: '日常任務', slides: TASKS },
  { value: 'notice', label: '注意事項', slides: NOTICES },
]

function Slideshow({ slides, renderSlide }) {
  const [index, setIndex] = useState(0)
  const total = slides.length

  function prev() { setIndex(i => Math.max(0, i - 1)) }
  function next() { setIndex(i => Math.min(total - 1, i + 1)) }

  return (
    <div>
      {/* Slide — 非當前 slide 用 absolute 脫離文件流，不撐寬版面 */}
      <div className="relative overflow-hidden rounded-2xl">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="w-full transition-opacity duration-300"
            style={
              i === index
                ? { position: 'relative', opacity: 1 }
                : { position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }
            }
          >
            {renderSlide(slide, i)}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-30"
          aria-label="上一張"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-5 bg-brand' : 'w-2 bg-line hover:bg-ink-4'
              }`}
              aria-label={`第 ${i + 1} 張`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === total - 1}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-30"
          aria-label="下一張"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function HostGuide() {
  const [active, setActive] = useState('flow')

  return (
    <section className="overflow-hidden">
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">成為團主</p>
        <h2 className="text-3xl font-extrabold text-ink">團主要做什麼？</h2>
        <p className="mt-3 text-base text-ink-3">建立群組之後，你就是這個群組的團主，以下是你需要知道的事。</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-raised p-1 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={`flex flex-1 items-center justify-center rounded-xl py-2 px-3 text-sm font-bold transition-colors ${
              active === tab.value
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 申請流程 slideshow */}
      {active === 'flow' && (
        <Slideshow
          slides={FLOW_STEPS}
          renderSlide={({ step, label, desc }) => (
            <div className="card flex flex-col items-stretch gap-0 overflow-hidden sm:flex-row">
              <div className="flex h-40 shrink-0 items-center justify-center bg-brand-subtle sm:h-auto sm:w-40 sm:self-stretch">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-white">
                  {step}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 p-6">
                <h3 className="text-lg font-extrabold text-ink">{label}</h3>
                <p className="text-sm leading-relaxed text-ink-3">{desc}</p>
              </div>
            </div>
          )}
        />
      )}

      {/* 日常任務 slideshow */}
      {active === 'tasks' && (
        <Slideshow
          slides={TASKS}
          renderSlide={({ icon: Icon, title, desc }) => (
            <div className="card flex flex-col items-stretch gap-0 overflow-hidden sm:flex-row">
              <div className="flex h-40 shrink-0 items-center justify-center bg-brand-subtle sm:h-auto sm:w-40 sm:self-stretch">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm">
                  <Icon size={28} className="text-brand" />
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 p-6">
                <h3 className="text-lg font-extrabold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-ink-3">{desc}</p>
              </div>
            </div>
          )}
        />
      )}

      {/* 注意事項 slideshow */}
      {active === 'notice' && (
        <Slideshow
          slides={NOTICES}
          renderSlide={({ icon: Icon, text }) => (
            <div className="card flex flex-col items-stretch gap-0 overflow-hidden sm:flex-row">
              <div className="flex h-40 shrink-0 items-center justify-center bg-amber-50 sm:h-auto sm:w-40 sm:self-stretch">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm">
                  <Icon size={28} className="text-amber-500" />
                </div>
              </div>
              <div className="flex flex-col justify-center p-6">
                <p className="text-sm leading-relaxed text-ink-2">{text}</p>
              </div>
            </div>
          )}
        />
      )}
    </section>
  )
}
