import { CheckCircleIcon } from "@heroicons/react/24/solid";
import {
  SERVICE_CATEGORIES,
  getServicesByCategory,
} from "../../../data/services.config.js";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";

export function CreateGroupStep1Service({ form, onChange, errors }) {
  const services = SERVICE_CATEGORIES.filter(
    (category) => getServicesByCategory(category.id).length > 0,
  ).flatMap((category) => getServicesByCategory(category.id));

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-5 overflow-hidden">
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/34">
          步驟 1
        </div>
        <div className="text-3xl font-semibold tracking-tight text-black sm:text-[2.7rem]">
          選擇服務類型
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto scrollbar-none pr-1">
        <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3">
          {services.map((service) => {
            const active = form.serviceId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onChange("serviceId", service.id)}
                className={[
                  "group relative flex h-full min-h-[100px] flex-col items-center justify-center rounded-[22px] border bg-white px-4 py-4 text-center transition duration-200 sm:min-h-[108px] lg:min-h-[116px] xl:min-h-[124px]",
                  active
                    ? "border-black/32"
                    : "border-black/10 hover:border-black/22 hover:bg-black/[0.02]",
                ].join(" ")}
              >
                {active ? (
                  <CheckCircleIcon className="absolute right-3 top-3 h-4 w-4 text-black" />
                ) : null}
                <ServiceIcon
                  serviceId={service.id}
                  alt={service.shortLabel}
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9 lg:h-10 lg:w-10"
                />
                <div className="mt-3 text-[11px] font-semibold leading-4 text-black sm:text-xs lg:text-[13px]">
                  {service.shortLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errors.serviceId ? (
        <div className="text-sm font-medium text-red-600">
          {errors.serviceId}
        </div>
      ) : null}
    </div>
  );
}
