import { Bell, Heart, MessageSquare, Star, VideoOff } from 'lucide-react'

const EXTRAS = [
  {
    icon: MessageSquare,
    title: '訊息中心',
    desc: '和同群組的成員直接對話，溝通付款細節或任何問題，不需要另外找聯絡方式。',
    videoSrc: null,
    action: () => window.dispatchEvent(new CustomEvent('pm:open-messages')),
    color: 'text-brand',
    bg: 'bg-brand-subtle',
  },
  {
    icon: Bell,
    title: '通知中心',
    desc: '申請結果、付款提醒、成員動態即時送達，所有重要事項都不會漏掉。',
    videoSrc: null,
    action: () => window.dispatchEvent(new CustomEvent('pm:open-notify')),
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Heart,
    title: '我的收藏',
    desc: '看到感興趣的群組先收起來，之後再決定要不要申請加入，隨時可以回來查看。',
    videoSrc: null,
    action: null,
    color: 'text-danger',
    bg: 'bg-danger-subtle',
  },
  {
    icon: Star,
    title: '信用分數',
    desc: '每次按時付款都能累積評分。分數愈高，團主愈願意接受你的申請。',
    videoSrc: null,
    action: null,
    color: 'text-success',
    bg: 'bg-success/10',
  },
]

export default function ExtraFeatures() {
  return (
    <section>
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">附加功能</p>
        <h2 className="text-3xl font-extrabold text-ink">讓使用體驗更完整</h2>
        <p className="mt-3 text-base text-ink-3">除了核心功能，這些小工具讓整個流程更順暢。</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {EXTRAS.map(({ icon: Icon, title, desc, videoSrc, action, color, bg }) => {
          const Tag = action ? 'button' : 'div'
          return (
          <Tag
            key={title}
            onClick={action ?? undefined}
            className={`card overflow-hidden text-left ${action ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
          >
            {/* 影片 / 佔位區 */}
            <div className="aspect-video w-full bg-raised">
              {videoSrc ? (
                <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
                  <source src={videoSrc} />
                </video>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${bg}`}>
                    <Icon size={28} className={color} />
                  </div>
                  <div className="flex items-center gap-1.5 text-ink-4">
                    <VideoOff size={13} />
                    <span className="text-xs font-medium">功能示範影片即將推出</span>
                  </div>
                </div>
              )}
            </div>
            {/* 文字說明 */}
            <div className="p-4">
              <h3 className="font-extrabold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
            </div>
          </Tag>
          )
        })}
      </div>
    </section>
  )
}
