import { CheckCircle2, Users, Calendar, Banknote } from "lucide-react";
import ServiceLogo from "../../../shared/components/ui/ServiceLogo";
import CreditScoreBadge from "../../../shared/components/ui/CreditScoreBadge";
import { getServiceById } from "../../../shared/services/serviceTypes";

function StatItem({ icon: Icon, label, value, valueClass = "text-ink" }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-raised rounded-[var(--radius-inner)] flex-1 min-w-0">
      <Icon size={16} className="text-ink-4 shrink-0" />
      <span className={`text-base font-bold truncate ${valueClass}`}>
        {value}
      </span>
      <span className="text-xs text-ink-4 truncate">{label}</span>
    </div>
  );
}

export default function GroupHeroCard({ group }) {
  const service = getServiceById(group.serviceId)

  return (
    <div className="card p-6 mb-4">
      <div className="flex items-start gap-4 mb-5">
        <ServiceLogo serviceId={group.serviceId} size={78} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-ink">
              {group.serviceName}
            </h1>
            {group.isHostVerified && (
              <span className="flex items-center gap-1 text-xs text-success-text bg-success-subtle px-2 py-0.5 rounded-full font-bold">
                <CheckCircle2 size={11} />
                已驗證團主
              </span>
            )}
          </div>
          <p className="text-sm text-ink-3 mt-0.5">{group.planName}</p>
          {service?.description && (
            <p className="mt-2 text-xs leading-relaxed text-ink-3">{service.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 px-4 py-3 bg-raised rounded-[var(--radius-inner)] flex-1 min-w-0">
          <CreditScoreBadge score={group.hostRating} size="md" />
          <span className="text-xs text-ink-4 truncate">團主信用</span>
        </div>
        <StatItem
          icon={Users}
          label="已加入"
          value={`${group.usedSeats}/${group.totalSeats} 人`}
        />
        {['active', 'paused', 'cancelled', 'ended'].includes(group.status) ? (
          <StatItem icon={Calendar} label="下次扣款" value={group.nextBillingDate?.slice(5) ?? '—'} />
        ) : (
          <StatItem icon={Calendar} label="建立日期" value={group.createdAt?.slice(5) ?? '—'} />
        )}
        <StatItem
          icon={Banknote}
          label="月費"
          value={`NT$${group.pricePerSeat}`}
          valueClass="text-brand"
        />
      </div>
    </div>
  );
}
