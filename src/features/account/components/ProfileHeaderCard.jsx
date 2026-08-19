import { CheckCircle2, ShieldCheck, Star } from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { useAuthStore } from '../../../common/stores/useAuthStore'

// icon 大在上、文字小在下的圓角按鈕；手機版左右平均分佈（flex-1），電腦版固定寬度靠右
function HeroStatTile({ icon: Icon, iconClassName, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-full border border-line-subtle py-3 transition-all hover:-translate-y-0.5 hover:bg-raised md:w-24 md:flex-none"
    >
      <Icon size={22} strokeWidth={1.5} className={iconClassName ?? 'text-ink-3'} />
      <span className="text-xs font-bold text-ink-3">{label}</span>
    </button>
  )
}

export default function ProfileHeaderCard({ user, onOpenCreditScore, onOpenReviews }) {
  // 「其他設定」的狀態選擇器改的是全域 authStore，這裡另外用 hook 直接訂閱，
  // 不吃 user prop 裡那份只在 AccountPage 掛載當下取一次快照的舊值，才會即時反映
  const presenceStatus = useAuthStore(s => s.user?.presenceStatus ?? 'online')
  return (
    <div className="mb-5 flex flex-col items-center gap-4 p-5 md:flex-row">
      <div className="relative shrink-0">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="xl" />
        {user.isVerified && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow">
            <CheckCircle2 size={18} className="text-brand" />
          </div>
        )}
        <PresenceDot status={presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-center md:text-left">
        <div className="mb-0.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
          {user.isVerified && (
            <Badge>
              <CheckCircle2 size={11} /> 已驗證
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>

      {/* 信用分數／我的評價：手機版跟電腦版用同一套「icon 大在上、文字小在下」設計，
          手機版在 Hero 底部左右平均分佈，電腦版固定寬度放在 Hero 右側 */}
      <div className="flex w-full gap-2 md:w-auto md:shrink-0">
        <HeroStatTile icon={ShieldCheck} iconClassName="text-brand" label="信用分數" onClick={onOpenCreditScore} />
        <HeroStatTile icon={Star} iconClassName="text-brand" label="我的評價" onClick={onOpenReviews} />
      </div>
    </div>
  )
}
