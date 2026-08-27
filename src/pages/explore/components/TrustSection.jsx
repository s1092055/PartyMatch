import { Bell, CreditCard, ShieldCheck } from 'lucide-react'
import StarRating from '../../../shared/components/ui/StarRating'

const TRUST_ITEMS = [
  {
    title: '團主審核機制',
    desc: '每位申請者都需要通過審核，確保群組成員的品質與可信度。',
    icon: ShieldCheck,
    gradient: 'from-blue-500 to-brand',
  },
  {
    title: '付款狀態紀錄',
    desc: '每一筆付款都有完整的紀錄，隨時可以查看繳費明細。',
    icon: CreditCard,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    title: '收藏與提醒',
    desc: '收藏感興趣的群組，並在續訂日期前收到提醒通知。',
    icon: Bell,
    gradient: 'from-violet-400 to-purple-500',
  },
]

const TESTIMONIALS = [
  {
    name: '林○○',
    tag: 'Netflix 用戶',
    text: '之前都自己一個人訂，跟群組分攤之後每個月省了快一半，付款提醒也很方便。',
    rating: 5,
  },
  {
    name: '陳○○',
    tag: 'Spotify 群主',
    text: '管理介面很清楚，一眼就能看到誰付了誰還沒，比在 Line 群追蹤輕鬆太多。',
    rating: 5,
  },
  {
    name: '吳○○',
    tag: 'ChatGPT Plus 用戶',
    text: '快速配對功能很實用，幾個條件一設就推薦選項，沒花多少時間就找到適合的。',
    rating: 4,
  },
]

export default function TrustSection() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-ink text-center">安心使用的保障</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TRUST_ITEMS.map(({ title, desc, icon: Icon, gradient }) => (
            <div key={title} className="card overflow-hidden p-0">
              <div className={`flex h-44 items-center justify-center bg-gradient-to-br ${gradient}`}>
                <Icon size={52} className="text-white/90" strokeWidth={1.5} />
              </div>
              <div className="p-5 text-center">
                <h3 className="text-sm font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-ink-3">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight text-ink text-center">其他使用者的回饋</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TESTIMONIALS.map(({ name, tag, text, rating }) => (
            <div key={name} className="card p-5 text-center">
              <div className="flex justify-center sm:justify-start">
                <StarRating rating={rating} size={13} />
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-ink-2">「{text}」</p>
              <div className="mt-4 flex items-center gap-2.5 justify-center sm:justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-2">
                  {name[0]}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-ink">{name}</p>
                  <p className="text-xs text-ink-3">{tag}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
