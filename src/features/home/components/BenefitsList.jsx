import { HOME_BENEFITS } from '../data/homeContent'

// 「從找人到成團，一切變得更簡單」區塊
export default function BenefitsList() {
  return (
    <section id="benefits" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        從找人到成團，一切變得更簡單
      </h2>

      <ul className="mt-8 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
        {HOME_BENEFITS.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex flex-col items-center gap-2">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <p className="font-extrabold text-ink">{title}</p>
            <p className="text-sm text-ink-3">{desc}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
