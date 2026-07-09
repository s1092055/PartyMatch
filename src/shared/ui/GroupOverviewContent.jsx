import { CheckCircle2, Clock, Info, User, Users, Calendar } from 'lucide-react'
import { getPlanChips, getInfoRows } from '../utils/groupDisplay'
import Badge from './Badge'

const TAG_CONFIG = {
  '審核制':    { Icon: Clock,        cls: 'bg-amber-50  border border-amber-200 text-amber-700'   },
  '每月付款':  { Icon: Calendar,     cls: 'bg-blue-50   border border-blue-200  text-blue-700'    },
  '年付':      { Icon: Calendar,     cls: 'bg-blue-50   border border-blue-200  text-blue-700'    },
  '需自備帳號': { Icon: User,        cls: 'bg-green-50  border border-green-200 text-green-700'   },
  '共享帳號':  { Icon: Users,        cls: 'bg-purple-50 border border-purple-200 text-purple-700' },
  '自動加入':  { Icon: CheckCircle2, cls: 'bg-teal-50   border border-teal-200  text-teal-700'    },
}
const DEFAULT_TAG = { Icon: Info, cls: 'bg-raised border border-line text-ink-2' }

export function TagChip({ label, size = 'md' }) {
  const { Icon, cls } = TAG_CONFIG[label] ?? DEFAULT_TAG
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const iconSize = size === 'sm' ? 10 : 12
  const px       = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
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
        <div className={`grid gap-2 ${service?.description ? 'mt-4' : ''} ${planChips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
          <span className="text-ink-4 shrink-0">{i + 1}.</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-ink-4">此群組尚未設定群組規則</p>
  )
}

export default function GroupOverviewContent({ group, service, plan, reviewsSection = null, statusBadgeOverride, extraRows = [] }) {
  const planChips = getPlanChips(group, plan)
  const allRules  = group.rules ?? []
  const infoRows = [
    ...getInfoRows(group).map(row =>
      row.badge === group.status && statusBadgeOverride
        ? { ...row, badge: statusBadgeOverride }
        : row
    ),
    ...extraRows,
  ]
  const tags = group.tags ?? []

  return (
    <div className="divide-y divide-line-subtle">
      <div className="pb-5 pt-0">
        <p className="mb-4 text-lg font-black text-brand">服務介紹</p>
        <ServiceIntro service={service} plan={plan} planChips={planChips} />
      </div>

      <div className="space-y-4 py-5">
        <p className="text-lg font-black text-brand">群組資訊</p>
        {infoRows.length > 0 && (
          <div className="space-y-2">
            {infoRows.map(({ label, value, badge }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-ink-4">{label}</span>
                <span className="text-ink-2">{badge ? (
                  typeof badge === 'object'
                    ? <Badge variant={badge.variant} label={badge.label} />
                    : <Badge variant={badge} />
                ) : value}</span>
              </div>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map(tag => <TagChip key={tag} label={tag} />)}
          </div>
        )}
      </div>

      <div className="space-y-4 py-5">
        <p className="text-lg font-black text-brand">群組規則</p>
        <RulesList allRules={allRules} />
      </div>

      {reviewsSection && <div className="py-5">{reviewsSection}</div>}
    </div>
  )
}
