import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { listServiceTypes } from "../../../../shared/utils/serviceUtils";
import ServiceLogo from "../../../../shared/ui/ServiceLogo";
import CategoryPills from "../../../../shared/ui/CategoryPills";
import Modal from "../../../../shared/ui/Modal";

const ALL_SERVICES = listServiceTypes();

export default function Step1Service({ form, onChange }) {
  const [activeCategory, setActiveCategory] = useState(
    () => ALL_SERVICES.find((s) => s.id === form.serviceId)?.category ?? "all",
  );
  const [infoService, setInfoService] = useState(null);

  const visible =
    activeCategory === "all"
      ? ALL_SERVICES
      : ALL_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <div>
      {/* 上：分類 */}
      <CategoryPills
        variant="grid"
        showAll
        active={activeCategory}
        onChange={setActiveCategory}
        className="mb-3 shrink-0"
      />

      {/* 下：服務種類清單，icon 在上、名稱在下，每列三個 */}
      <div className="grid grid-cols-3 gap-3 p-0.5">
        {visible.map((service) => {
          const active = form.serviceId === service.id;
          return (
            <div
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => onChange("serviceId", service.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("serviceId", service.id);
                }
              }}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                active
                  ? "border-brand bg-brand-subtle"
                  : "border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40"
              }`}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setInfoService(service); }}
                className="absolute right-1 top-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-300 transition-colors hover:bg-brand-subtle hover:text-brand"
                aria-label={`${service.name} 服務說明`}
              >
                <AlertCircle size={20} />
              </button>
              <ServiceLogo serviceId={service.id} size={48} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {service.name}
                </p>
                <p className="text-xs text-slate-400 truncate">{service.category}</p>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-ink-3">
            此分類尚無服務
          </p>
        )}
      </div>

      {infoService && (
        <Modal
          onClose={() => setInfoService(null)}
          maxWidth="max-w-xs"
          showHeader={false}
        >
          <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
            <ServiceLogo serviceId={infoService.id} size={64} className="rounded-logo border-line-strong" />
            <h2 className="text-lg font-black text-ink">{infoService.name}</h2>
            <p className="w-full text-left text-sm leading-relaxed text-ink-3">
              {infoService.description || "尚無服務說明"}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
