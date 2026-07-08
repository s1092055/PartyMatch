import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'PartyMatch 是什麼服務？',
    a: 'PartyMatch 是訂閱共享群組媒合平台。讓你輕鬆找到願意共享 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴，大家一起分攤費用，從找團、申請、付款到溝通，全部在同一個平台完成。',
  },
  {
    q: '加入群組後如何完成付款？',
    a: '申請通過、團主鎖定群組後，你會收到通知。請前往「我的訂閱」填寫你在該服務使用的電子信箱（服務帳號），再依照群組聊天室中團主提供的收款資訊（匯款帳號等）完成付款並上傳截圖。團主確認收款後，訂閱正式啟用。',
  },
  {
    q: '帳號安全嗎？我的個人資料會外洩嗎？',
    a: '我們僅收集媒合所需的最低限度資料，不出售或提供予第三方廣告商。關於共享帳號的安全性，我們強烈建議你不要將主要密碼分享給任何人，可另外建立共享用的 Profile 或使用服務提供的子帳號功能。',
  },
  {
    q: '可以同時加入多個不同服務的群組嗎？',
    a: '當然可以！你可以同時是 Netflix 群組的成員，也是 Spotify 群組的成員。每個群組獨立計費、獨立追蹤，在「我的訂閱」可以一次查看所有訂閱狀態。',
  },
  {
    q: '如何成為團主？',
    a: '登入後點擊「建立群組」，經過 4 個步驟（選服務、選方案、設定名額與規則、確認送出）即可上架群組開始招募。名額全數核准後，填寫收款帳號並鎖定群組，系統會引導你完成收款確認與服務啟用流程。',
  },
  {
    q: '群組鎖定後我還需要做什麼？',
    a: '成員付款並上傳截圖後，你會收到通知。前往「群組管理 → 收款紀錄」逐筆確認收款。全員確認完成後，系統出現「啟用服務」按鈕，點擊後群組正式進入服務中狀態，所有成員會收到啟用通知。',
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
