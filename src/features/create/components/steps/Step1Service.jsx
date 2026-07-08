import { useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import { listServiceTypes } from "../../../../shared/utils/serviceUtils";
import ServiceLogo from "../../../../shared/ui/ServiceLogo";
import CategoryPills from "../../../../shared/ui/CategoryPills";
import Modal from "../../../../shared/ui/Modal";

const ALL_SERVICES = listServiceTypes();

export default function Step1Service({ form, onChange, preview }) {
  const [activeCategory, setActiveCategory] = useState(
    () => ALL_SERVICES.find((s) => s.id === form.serviceId)?.category ?? "all",
  );
  const [infoService, setInfoService] = useState(null);

  const visible =
    activeCategory === "all"
      ? ALL_SERVICES
      : ALL_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <div className="lg:h-full">
      {/* 手機版：分類橫排在頂部 */}
      <CategoryPills
        showAll
        active={activeCategory}
        onChange={setActiveCategory}
        className="mb-3 lg:hidden"
      />

      <div className="lg:flex lg:h-full lg:items-stretch lg:gap-4">
        {/* 桌機版：分類垂直排在左側，佔滿全高、按鈕平均分配高度 */}
        <CategoryPills
          variant="vertical"
          showAll
          fullHeight
          active={activeCategory}
          onChange={setActiveCategory}
          className="hidden lg:flex w-[130px] shrink-0"
        />

        {/* 中間：服務清單，唯一可捲動的區域 */}
        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-2 gap-2">
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
                  className={`flex cursor-pointer items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-brand bg-brand-subtle"
                      : "border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40"
                  }`}
                >
                  <ServiceLogo serviceId={service.id} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {service.name}
                    </p>
                    <p className="text-xs text-slate-400">{service.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setInfoService(service); }}
                    className="shrink-0 text-slate-300 transition-colors hover:text-brand"
                    aria-label={`${service.name} 服務說明`}
                  >
                    <AlertCircle size={16} />
                  </button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-ink-3">
                此分類尚無服務
              </p>
            )}
          </div>
        </div>

        {/* 右側：群組卡預覽，與左側分類欄頂端切齊，內容過長時內部捲動 */}
        {preview && (
          <div className="hidden shrink-0 lg:flex lg:h-full lg:w-72 lg:flex-col lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {preview}
          </div>
        )}
      </div>

      {infoService && (
        <Modal
          onClose={() => setInfoService(null)}
          title="服務說明"
          icon={<Info size={20} className="text-brand" />}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
            <ServiceLogo serviceId={infoService.id} size={64} className="rounded-logo border-line-strong" />
            <h2 className="text-lg font-black text-ink">{infoService.name}</h2>
            <p className="text-sm leading-relaxed text-ink-3">
              {infoService.description || "尚無服務說明"}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
