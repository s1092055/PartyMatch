import { useState, useRef, useEffect } from 'react'
import { Search, Users, PlusCircle, CreditCard } from 'lucide-react'

// 替換 videoSrc 為實際功能示範影片路徑（mp4 / webm），null 時顯示彩色 placeholder
const FEATURES = [
  {
    icon: Search,
    title: '探索共享群組',
    desc: '依照服務類型、價格與剩餘名額篩選，快速找到最適合你的訂閱群組，支援關鍵字搜尋與多維度排序。',
    videoSrc: null,
  },
  {
    icon: Users,
    title: '快速配對',
    desc: '告訴我們你的需求與預算，系統自動推薦最符合條件的群組，省去逐一比較的時間。',
    videoSrc: null,
  },
  {
    icon: PlusCircle,
    title: '建立群組',
    desc: '幾個步驟就能成為團主，自訂方案、名額與加入條件，輕鬆招募成員一起分攤費用。',
    videoSrc: null,
  },
  {
    icon: CreditCard,
    title: '管理訂閱',
    desc: '集中查看所有訂閱的付款狀態、下次續訂日期與完整付款紀錄，再也不怕漏繳。',
    videoSrc: null,
  },
]

export default function FeatureCards() {
  const [active, setActive] = useState(0)
  const videoRef = useRef(null)
  const { icon: Icon, title, desc, videoSrc } = FEATURES[active]

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [active])

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-ink">PartyMatch 的核心功能</h2>
        <p className="mt-1 text-xs font-medium text-ink-3">
          探索、配對、建立群組、管理訂閱，四大功能一次掌握，點擊下方分頁切換查看說明。
        </p>
      </div>

      <div className="card overflow-hidden">
        {/* Video / placeholder area */}
        <div className="relative h-52 w-full sm:h-60">
          {videoSrc ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={videoSrc} />
            </video>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle">
                  <Icon size={32} className="text-brand" />
                </div>
                <span className="text-sm font-bold text-ink-3">功能示範影片 placeholder</span>
              </div>
            </div>
          )}
        </div>

        {/* Text area */}
        <div className="p-5">
          <h3 className="text-base font-extrabold text-ink">{title}</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ink-3">{desc}</p>
        </div>

        {/* Tab buttons */}
        <div className="flex border-t border-line">
          {FEATURES.map((f, i) => {
            const TabIcon = f.icon
            return (
              <button
                key={f.title}
                onClick={() => setActive(i)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-2xs font-bold transition-colors ${
                  i === active
                    ? 'border-t-2 border-brand text-brand -mt-px bg-brand-subtle'
                    : 'text-ink-3 hover:bg-raised hover:text-ink'
                }`}
              >
                <TabIcon size={16} />
                <span className="hidden sm:block">{f.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
