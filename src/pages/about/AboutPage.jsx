import { AlertTriangle } from 'lucide-react'
import FeatureCards from './components/FeatureCards'
import HowItWorks from './components/HowItWorks'
import CTASection from './components/CTASection'

const DISCLAIMER_ITEMS = [
  {
    title: '平台性質聲明',
    body: 'PartyMatch 為純粹的群組媒合平台，僅提供尋找共享訂閱夥伴之功能。本平台不介入任何費用代收、帳號管理或訂閱方案購買，亦不作為交易的任何一方。',
  },
  {
    title: '使用條款責任',
    body: '部分服務（包括但不限於 ChatGPT Plus、Claude Pro、Adobe Creative Cloud、Midjourney 等）並無官方授權的帳號共享方案。用戶在加入任何共享群組前，須自行閱讀並確認該服務之使用條款（Terms of Service）。因違反第三方服務條款所導致的帳號暫停、服務中斷或其他損失，本平台概不負責。',
  },
  {
    title: '金流與帳號安全',
    body: 'PartyMatch 不代為收付款項。所有費用分攤均由群組成員自行協議，透過雙方同意的方式完成。本平台強烈建議用戶勿將帳號主密碼分享予他人，並在適當時機更換密碼。任何因用戶自行分享帳號資訊所造成的損失，本平台不承擔責任。',
  },
  {
    title: '資料使用聲明',
    body: '本平台所收集之個人資料（包括姓名、聯絡方式）僅用於媒合功能及通知目的，不會出售或提供予第三方廣告商。詳細資料處理方式請參閱隱私權政策。',
  },
  {
    title: '免責範圍',
    body: 'PartyMatch 對以下情況不承擔任何法律責任：用戶之間的糾紛或詐騙行為；第三方訂閱服務的價格變動或方案調整；因共享帳號導致的服務品質下降；不可抗力因素所造成的服務中斷。',
  },
]

export default function AboutPage() {
  return (
    <section className="card p-6">
      <div className="space-y-8">
        <FeatureCards />
        <HowItWorks />
        <CTASection />

        <div id="disclaimer" className="rounded-xl border border-warning/30 bg-warning-subtle p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0 text-warning" />
            <h2 className="text-base font-extrabold text-warning-text">免責聲明</h2>
          </div>
          <div className="space-y-4">
            {DISCLAIMER_ITEMS.map(item => (
              <div key={item.title}>
                <p className="mb-1 text-sm font-bold text-warning-text">{item.title}</p>
                <p className="text-xs leading-relaxed text-warning-text">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-2xs text-warning-text">
            最後更新：2026 年 5 月．繼續使用本平台即表示您已閱讀並同意上述聲明。
          </p>
        </div>
      </div>
    </section>
  )
}
