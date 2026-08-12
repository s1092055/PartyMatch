import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'PartyMatch 是什麼服務？',
    a: 'PartyMatch 是訂閱共享媒合平台，協助您找到願意共享 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴，共同分攤費用。從尋找群組、送出申請、款項代管到成員溝通，皆可於同一平台完成。',
  },
  {
    q: '加入群組後如何完成付款？',
    a: '平台使用內部代幣「PM 幣」（1 PM 幣 = 1 新台幣）作為交易媒介，儲值後即可使用。申請通過的同時，您的席位費用將自動從 PM 幣餘額轉入平台代管，無須另行轉帳、匯款或上傳憑證。團主鎖定群組後，請至「我的訂閱」填寫服務帳號，並等待啟用通知即可。',
  },
  {
    q: '帳號安全嗎？我的個人資料會外洩嗎？',
    a: '我們僅收集媒合所需的最低限度資料，不會出售或提供予第三方廣告商。關於共享帳號安全性，建議您避免將主要密碼分享予他人，可另行建立共用 Profile 或使用服務提供的子帳號功能。',
  },
  {
    q: '可以同時加入多個不同服務的群組嗎？',
    a: '可以。您可同時是 Netflix 群組與 Spotify 群組的成員，每個群組皆獨立計費、獨立追蹤，並可於「我的訂閱」統一檢視所有訂閱狀態。',
  },
  {
    q: '如何成為團主？',
    a: '登入後點擊「建立群組」，依序完成 4 個步驟（選擇服務、選擇方案、設定名額與規則、確認送出）即可上架並開始招募。名額全數接受後即可點擊「鎖定群組」——每位成員的席位費用其實已於您接受申請當下自動完成代管，系統將建立群組聊天室，並引導您完成服務帳號確認與啟用流程。',
  },
  {
    q: '群組鎖定後我還需要做什麼？',
    a: '全員席位費用於接受申請當下即已完成代管，鎖定群組後僅須等待成員填寫服務帳號。全員填寫完成後，系統將顯示「啟用服務」按鈕，點擊後群組進入 48 小時確認期；期間若無成員回報問題，代管款項將自動撥付予您。',
  },
  {
    q: '如果成員覺得服務有問題怎麼辦？',
    a: '服務啟用後的 48 小時確認期內，成員可於群組聊天室反應問題，或向平台回報問題。一旦回報，該筆代管款項將被凍結，平台客服將於 48 小時內完成處理：若成員勝訴則退款並退出群組，若團主勝訴則款項撥付予團主，其餘成員權益不受影響。',
  },
]

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className={`rounded-2xl px-5 transition-colors duration-200 ${open ? 'bg-raised' : 'hover:bg-raised'}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-bold text-ink">{q}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
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
      <h2 className="mb-6 text-center text-3xl font-extrabold text-ink">常見問題</h2>
      <div className="mx-auto max-w-lg space-y-1">
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
