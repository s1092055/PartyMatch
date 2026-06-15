import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'PartyMatch 是什麼服務？',
    a: 'PartyMatch 是訂閱共享媒合平台。我們讓你輕鬆找到願意共享 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴，大家一起分攤費用，享受完整服務，不必單獨負擔高額月費。',
  },
  {
    q: '加入群組後如何完成付款？',
    a: 'PartyMatch 本身不代為收付款項。加入群組後，請前往「我的訂閱」查看付款資訊，依照團主指定的方式（匯款、Line Pay、街口等）完成費用分攤。平台提供付款狀態追蹤，讓你和團主都能清楚掌握進度。',
  },
  {
    q: '帳號安全嗎？我的個人資料會外洩嗎？',
    a: '我們僅收集媒合所需的最低限度資料，不出售或提供予第三方廣告商。關於共享帳號的安全性，我們強烈建議你不要將主要密碼分享給任何人，可另外建立共享用的 Profile 或使用服務提供的子帳號功能。',
  },
  {
    q: '可以同時加入多個不同服務的群組嗎？',
    a: '當然可以！你可以同時是 Netflix 群組的成員，也是 Spotify 群組的成員。每個群組獨立計費、獨立追蹤，讓你輕鬆管理所有訂閱。',
  },
  {
    q: '如何成為團主？',
    a: '登入後點擊「建立群組」，填寫服務名稱、方案、席位數量與月費，發布後即可開始接受申請。成為團主意味著你負責管理帳號與席位，成員則負責按時繳費，雙方各盡其責。',
  },
]

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className={`rounded-2xl px-5 transition-colors duration-200 ${open ? 'bg-raised' : 'hover:bg-raised'}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-center"
      >
        <span className="flex-1 text-center font-bold text-ink">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-4' : 'max-h-0'}`}>
        <p className="text-sm leading-relaxed text-ink-3">{a}</p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section>
      <p className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-ink-4">常見問題</p>
      <h2 className="mb-6 text-center text-3xl font-extrabold text-ink">FAQ</h2>
      <div className="space-y-1">
        {FAQS.map((item, i) => (
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
