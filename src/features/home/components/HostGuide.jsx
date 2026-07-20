import { HOST_TASKS, HOST_NOTICES } from '../data/homeContent'

export default function HostGuide() {
  return (
    <section>
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">成為團主</p>
        <h2 className="text-3xl font-extrabold text-ink">團主負責什麼？</h2>
        <p className="mt-3 text-base text-ink-3">建立群組後，你就是這個群組的負責人。以下是你需要承擔的工作。</p>
      </div>

      {/* 日常任務 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOST_TASKS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card flex flex-col gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle">
              <Icon size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="font-extrabold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 注意事項 */}
      <div className="mt-8 rounded-2xl border border-warning/30 bg-warning-subtle p-5">
        <p className="mb-3 text-sm font-extrabold text-warning-text">注意事項</p>
        <ul className="space-y-2.5">
          {HOST_NOTICES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon size={14} className="mt-0.5 shrink-0 text-warning" />
              <span className="text-sm leading-relaxed text-warning-text">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
