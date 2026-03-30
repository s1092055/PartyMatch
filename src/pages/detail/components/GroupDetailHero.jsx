import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";

export function GroupDetailHero({
  heroTheme,
  serviceId,
  platform,
  iconKey,
  serviceLabel,
  categoryLabel,
  planLabel,
  elevated = true,
}) {
  return (
    <section>
      <div
        className={[
          "relative overflow-hidden rounded-[32px] border border-black/8 px-6 py-6 text-white sm:px-8 sm:py-7",
          elevated ? "shadow-[0_16px_40px_rgba(15,23,42,0.12)]" : "shadow-none",
          "bg-gradient-to-br",
          heroTheme,
        ].join(" ")}
      >
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                <ServiceIcon
                  serviceId={serviceId}
                  platform={platform}
                  iconKey={iconKey}
                  alt={serviceLabel}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  {categoryLabel}
                </div>
                <div className="mt-2 break-words text-2xl font-semibold tracking-tight">
                  {serviceLabel}
                </div>
              </div>
            </div>
            <span className="inline-flex self-start rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
              {planLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
