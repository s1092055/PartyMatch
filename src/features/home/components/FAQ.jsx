import { useState } from 'react'
import { Plus } from 'lucide-react'
import { HOME_FAQS } from '../data/homeContent'

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${open ? 'border-brand-border bg-brand-subtle' : 'border-line bg-surface hover:border-brand-border'}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-ink">{q}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-brand shadow-card transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          <Plus size={16} strokeWidth={1.5} />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-ink-3">{a}</p>
        </div>
      </div>
    </div>
  )
}

// 首頁「常見問題」預覽區塊
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section id="faq" className="scroll-mt-24 flex flex-col items-center gap-10">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-ink">常見問題</h2>
      </div>

      <div className="w-full max-w-2xl space-y-3">
        {HOME_FAQS.map((item, i) => (
          <FAQItem
            key={item.q}
            {...item}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  )
}
