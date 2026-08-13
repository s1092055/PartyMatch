import { HOME_WHY_US } from '../data/homeContent'

// 「為什麼選擇 PartyMatch？」區塊
export default function WhyUs() {
  return (
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-ink">為什麼選擇 PartyMatch？</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-ink-3">
        我們打造安全的環境與完善機制，讓您安心共享每一次的訂閱體驗。
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {HOME_WHY_US.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-extrabold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
