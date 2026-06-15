import { VideoOff } from 'lucide-react'
import { HOME_EXTRA_FEATURES } from '../data/homeContent'

function runAction(action) {
  if (!action) return
  if (action.type === 'event') window.dispatchEvent(new CustomEvent(action.event))
}

export default function ExtraFeatures() {
  return (
    <section>
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">附加功能</p>
        <h2 className="text-3xl font-extrabold text-ink">更完善的體驗？</h2>
        <p className="mt-3 text-base text-ink-3">除了核心功能，這些小工具讓整個流程更順暢。</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {HOME_EXTRA_FEATURES.map(({ icon: Icon, title, desc, videoSrc, action, color, bg }) => {
          const Tag = action ? 'button' : 'div'
          return (
          <Tag
            key={title}
            onClick={action ? () => runAction(action) : undefined}
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
