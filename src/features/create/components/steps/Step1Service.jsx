import { useState } from "react";
import { Check } from "lucide-react";
import { listServiceTypes } from "../../../../shared/utils/serviceUtils";
import ServiceLogo from "../../../../shared/ui/ServiceLogo";
import CategoryPills from "../../../../shared/ui/CategoryPills";

const ALL_SERVICES = listServiceTypes();

export default function Step1Service({ form, onChange }) {
  const [activeCategory, setActiveCategory] = useState(
    () => ALL_SERVICES.find((s) => s.id === form.serviceId)?.category ?? "all",
  );

  const visible =
    activeCategory === "all"
      ? ALL_SERVICES
      : ALL_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <div>
      <h2 className="mb-4 text-base font-extrabold text-ink">
        選擇訂閱服務（單選）
      </h2>

      {/* 手機版：分類橫排在頂部 */}
      <CategoryPills
        showAll
        active={activeCategory}
        onChange={setActiveCategory}
        className="mb-3 lg:hidden"
      />

      <div className="lg:flex lg:items-start lg:gap-2">
        {/* 桌機版：分類垂直排在左側 */}
        <CategoryPills
          variant="vertical"
          showAll
          active={activeCategory}
          onChange={setActiveCategory}
          className="hidden lg:flex w-[130px] shrink-0 max-h-[280px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />

        <div
          className="flex-1 overflow-y-auto pr-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maxHeight: "280px" }}
        >
          <div className="grid grid-cols-2 gap-2">
            {visible.map((service) => {
              const active = form.serviceId === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => onChange("serviceId", service.id)}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-success bg-success-subtle"
                      : "border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40"
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-md bg-success flex items-center justify-center">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <ServiceLogo serviceId={service.id} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {service.name}
                    </p>
                    <p className="text-xs text-slate-400">{service.category}</p>
                  </div>
                </button>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-ink-3">
                此分類尚無服務
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
