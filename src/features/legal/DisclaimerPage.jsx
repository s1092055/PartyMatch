import { AlertTriangle } from 'lucide-react'
import PageHeader from '../../shared/layout/PageHeader'

const ITEMS = [
  {
    title: '平台性質聲明',
    body: 'PartyMatch 提供共享訂閱夥伴的媒合功能，並透過平台內部虛擬貨幣「PM 幣」（1 PM 幣 = 新台幣 1 元）代管群組成員的席位費用：申請接受當下即自動從 PM 幣餘額轉入平台代管，待服務啟用並經過確認期後撥款予團主。本平台僅提供代管與撥款的技術服務，不代為購買、管理或提供任何第三方訂閱服務本身。',
  },
  {
    title: '使用條款責任',
    body: '部分服務（包括但不限於 ChatGPT Plus、Claude Pro、Adobe Creative Cloud、Midjourney 等）並無官方授權的帳號共享方案。用戶在加入任何共享群組前，須自行閱讀並確認該服務之使用條款（Terms of Service）。因違反第三方服務條款所導致的帳號暫停、服務中斷或其他損失，本平台概不負責。',
  },
  {
    title: 'PM 幣代管與帳號安全',
    body: '席位費用經由 PM 幣代管機制自動轉帳，用戶無需自行匯款或上傳付款截圖；若對代管款項的撥付有爭議，可於確認期內向平台提出申訴，由客服裁定。PM 幣代管僅處理群組席位費用，本平台強烈建議用戶勿將訂閱服務本身的帳號主密碼分享予他人，並在適當時機更換密碼；任何因用戶自行分享帳號資訊所造成的損失，本平台不承擔責任。',
  },
  {
    title: '資料使用聲明',
    body: '本平台所收集之個人資料（包括姓名、聯絡方式）僅用於媒合功能及通知目的，不會出售或提供予第三方廣告商。詳細資料處理方式請參閱隱私政策。',
  },
  {
    title: '免責範圍',
    body: 'PartyMatch 對以下情況不承擔任何法律責任：確認期申訴機制範圍以外的用戶間糾紛或詐騙行為；第三方訂閱服務的價格變動或方案調整；因共享帳號導致的服務品質下降；不可抗力因素所造成的服務中斷。PM 幣代管與申訴裁定僅處理群組席位費用的撥付爭議，不涉及訂閱服務本身的品質保證。',
  },
]

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="免責聲明" className="mb-8" />

      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning-subtle px-5 py-4">
        <AlertTriangle size={16} className="shrink-0 text-warning" />
        <p className="text-sm font-medium text-warning-text">繼續使用本平台即表示您已閱讀並同意以下聲明。</p>
      </div>

      <div className="space-y-6">
        {ITEMS.map(item => (
          <div key={item.title} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-2 font-extrabold text-ink">{item.title}</h2>
            <p className="text-sm leading-relaxed text-ink-3">{item.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink-4">最後更新：2026 年 5 月</p>
    </div>
  )
}
