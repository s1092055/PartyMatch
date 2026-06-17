import { CheckCircle2, Clock, Info, User, Users, Calendar } from 'lucide-react'
import { getPlanChips, getInfoRows } from '../utils/groupDisplay'

// 群組詳情 modal 共用的「服務介紹」「加入條件與規則」內容區塊，
// 探索頁（GroupDetailModal）與我的訂閱／群組管理（GroupViewModal）共用同一份，
// 確保三處看到的群組簡述、服務介紹、規則文字與排版完全一致。

const TAG_CONFIG = {
  '審核制':    { Icon: Clock,     cls: 'bg-amber-50  border border-amber-200 text-amber-700'  },
  '每月付款':  { Icon: Calendar,  cls: 'bg-blue-50   border border-blue-200  text-blue-700'   },
  '年付':      { Icon: Calendar,  cls: 'bg-blue-50   border border-blue-200  text-blue-700'   },
  '需自備帳號': { Icon: User,     cls: 'bg-green-50  border border-green-200 text-green-700'  },
  '共享帳號':  { Icon: Users,     cls: 'bg-purple-50 border border-purple-200 text-purple-700' },
  '自動加入':  { Icon: CheckCircle2, cls: 'bg-teal-50 border border-teal-200 text-teal-700'   },
}
const DEFAULT_TAG = { Icon: Info, cls: 'bg-raised border border-line text-ink-2' }

export function TagChip({ label, size = 'md' }) {
  const { Icon, cls } = TAG_CONFIG[label] ?? DEFAULT_TAG
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const iconSize = size === 'sm' ? 10 : 12
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold ${textSize} ${px} ${cls}`}>
      <Icon size={iconSize} />
      {label}
    </span>
  )
}

function ServiceIntro({ service, plan, planChips }) {
  return (
    <>
      {service?.description && (
        <p className="text-sm leading-relaxed text-ink-2">{service.description}</p>
      )}
      {planChips.length > 0 && (
        <div className={`grid gap-2 ${planChips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {planChips.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl border border-line bg-canvas p-3">
              <Icon size={14} className="text-ink-3" />
              <span className="text-xs text-ink-4">{label}</span>
              <span className="text-xs font-bold leading-snug text-ink">{value}</span>
            </div>
          ))}
        </div>
      )}
      {(plan?.description || (plan?.features?.length ?? 0) > 0) && (
        <div className="border-t border-line-subtle pt-4">
          {plan?.description && (
            <p className="mb-3 text-sm font-medium text-ink-2">{plan.description}</p>
          )}
          {(plan?.features ?? []).length > 0 && (
            <ul className="space-y-2">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" />
                  {feat}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function RulesList({ allRules }) {
  return allRules.length > 0 ? (
    <ul className="space-y-3">
      {allRules.map((rule, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-ink-4">此群組尚未設定加入規則</p>
  )
}

// group/service/plan：群組、服務目錄、方案資料
// desktopReviewsSection/mobileReviewsSection：選填，接在「加入條件與規則」之後渲染，
// 各自帶好對應排版（目前僅探索頁的團主評價使用，我的訂閱／群組管理不需要）
export default function GroupOverviewContent({ group, service, plan, desktopReviewsSection = null, mobileReviewsSection = null }) {
  const planChips = getPlanChips(group, plan)
  const allRules = [
    ...(group.requirements ? [group.requirements] : []),
    ...(group.rules ?? []),
  ]
  const infoRows = getInfoRows(group)
  const tags = group.tags ?? []

  return (
    <>
      {/* Desktop：各區塊永遠可見 */}
      <div className="hidden divide-y divide-line-subtle lg:block">
        <div className="space-y-4 py-5">
          <p className="text-lg font-black text-brand">服務介紹</p>
          <ServiceIntro service={service} plan={plan} planChips={planChips} />
        </div>
        <div className="space-y-3 py-5">
          <p className="text-lg font-black text-brand">加入條件與規則</p>
          <RulesList allRules={allRules} />
        </div>
        {desktopReviewsSection}
      </div>

      {/* Mobile：群組簡述 + 服務介紹 + 規則，各自獨立區塊 */}
      <div className="divide-y divide-line-subtle lg:hidden">
        <div className="space-y-4 px-2 py-6">
          <p className="text-lg font-black text-brand">群組簡述</p>
          <div>
            <p className="mb-0.5 text-xs font-medium text-ink-4">每席價格</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
              <span className="text-sm text-ink-3">/每月</span>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-3">剩餘名額</span>
              <span className="font-semibold text-ink">{group.openSeats} 席 / 總名額 {group.totalSeats} 席</span>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => <TagChip key={tag} label={tag} />)}
            </div>
          )}
          {infoRows.length > 0 && (
            <div className="space-y-2">
              {infoRows.map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="w-14 shrink-0 text-ink-4">{label}</span>
                  <span className="flex-1 text-ink-2">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 px-2 py-6">
          <p className="text-lg font-black text-brand">服務介紹</p>
          <ServiceIntro service={service} plan={plan} planChips={planChips} />
        </div>

        <div className="space-y-4 px-2 py-6">
          <p className="text-lg font-black text-brand">加入條件與規則</p>
          <RulesList allRules={allRules} />
        </div>

        {mobileReviewsSection}
      </div>
    </>
  )
}
