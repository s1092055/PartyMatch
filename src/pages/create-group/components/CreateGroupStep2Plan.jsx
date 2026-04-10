import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { getServiceById } from "../../../data/services.config.js";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { formatCreateGroupSeatPrice } from "../utils/createGroupFlowTheme.js";
import { CreateGroupFeatureStrip } from "./CreateGroupFeatureStrip.jsx";

const MotionDiv = motion.div;

export function CreateGroupStep2Plan({ form, onChange, errors, officialLink = "" }) {
  const selectedService = getServiceById(form.serviceId);
  const visiblePlans = useMemo(
    () => selectedService?.plans ?? [],
    [selectedService],
  );
  const [expandedPlanId, setExpandedPlanId] = useState(
    () => form.planId || visiblePlans[0]?.id || null,
  );
  const resolvedExpandedPlanId = useMemo(() => {
    if (!visiblePlans.length) return null;

    if (
      expandedPlanId &&
      visiblePlans.some((plan) => plan.id === expandedPlanId)
    ) {
      return expandedPlanId;
    }

    return null;
  }, [expandedPlanId, visiblePlans]);

  if (!selectedService) {
    return (
      <div className="grid h-full min-h-0 place-items-center overflow-hidden">
        <div className="max-w-md rounded-[28px] border border-black/10 bg-white px-6 py-7 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-black/34">
            步驟 2
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-black">
            請先選擇服務
          </div>
          <p className="mt-3 text-sm leading-7 text-black/54">
            回到上一步選擇服務後，這裡會顯示對應方案。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr_auto] gap-5 overflow-hidden">
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/34">
          步驟 2
        </div>
        <div className="text-3xl font-semibold tracking-tight text-black sm:text-[2.7rem]">
          選擇方案
        </div>
      </div>

      <div className="inline-flex max-w-full items-center gap-3 truncate rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-medium text-black/66">
        <ServiceIcon
          serviceId={selectedService.id}
          alt={selectedService.shortLabel}
          className="h-5 w-5 shrink-0 object-contain"
        />
        <span className="truncate">{selectedService.name}</span>
      </div>

      <div className="min-h-0 overflow-y-auto scrollbar-none pr-1">
        <div className="space-y-3 pb-4">
          {visiblePlans.map((plan) => {
            const active = form.planId === plan.id;
            const expanded = resolvedExpandedPlanId === plan.id;
            const seatPriceLabel = formatCreateGroupSeatPrice(
              selectedService.id,
              plan.id,
              plan.billingCycle,
            );
            const featureItems = plan.features?.length
              ? plan.features
              : (plan.highlights ?? []);

            return (
              <div
                key={plan.id}
                className={[
                  "overflow-hidden rounded-[24px] border bg-white transition",
                  active ? "border-black/28" : "border-black/10",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPlanId((current) =>
                      current === plan.id ? null : plan.id,
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-lg font-semibold text-black">
                        {plan.name}
                      </span>
                      {active ? (
                        <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                          已選擇
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-black">
                      {seatPriceLabel}
                    </span>
                    <ChevronDownIcon
                      className={[
                        "h-5 w-5 text-black/42 transition-transform",
                        expanded ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <MotionDiv
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-black/8"
                    >
                      <div className="space-y-4 px-5 py-5">
                        <div className="text-sm leading-7 text-black/54">
                          {plan.billingNote}
                        </div>

                        {featureItems.length ? (
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">
                                方案內容
                              </div>
                            </div>
                            <div className="mt-3 min-w-0">
                              <CreateGroupFeatureStrip
                                features={featureItems}
                                tone="light"
                                showEdgeHint
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onChange("planId", plan.id);
                              setExpandedPlanId(null);
                            }}
                            className={[
                              "inline-flex min-w-[112px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                              active
                                ? "border border-black/12 bg-black/[0.04] text-black"
                                : "bg-black text-white hover:bg-black/85",
                            ].join(" ")}
                          >
                            {active ? "已選擇" : "選擇"}
                          </button>
                        </div>
                      </div>
                    </MotionDiv>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {officialLink ? (
        <div className="flex justify-start">
          <a
            href={officialLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-black/72 transition hover:bg-black/[0.03] hover:text-black"
          >
            查看官方方案
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        </div>
      ) : null}

      {errors.planId ? (
        <div className="text-sm font-medium text-red-600">{errors.planId}</div>
      ) : null}
    </div>
  );
}
