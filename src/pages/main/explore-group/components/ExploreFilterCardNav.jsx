import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  SERVICES,
  getPlanById,
  getServiceById,
  normalizeServiceId,
} from "../../../../data/services.config.js";
import { ServiceIcon } from "../../../../shared/components/ui/ServiceIcon.jsx";
import { formatMoney } from "../../../../utils/format.js";
import { getPricePerSeatLabel } from "../../../../shared/modules/groups/utils/groupSummary.js";

const sortOptions = [
  { value: "newest", label: "最新上架", description: "優先顯示最近建立的群組" },
  { value: "remaining", label: "剩最多", description: "優先顯示空位較多的群組" },
  { value: "priceAsc", label: "價格低到高", description: "先看每位分攤較低的方案" },
];

function matchesGroup(group, query, serviceId) {
  const normalizedServiceId = normalizeServiceId(group.serviceId ?? group.platform);
  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);

  if (serviceId && normalizedServiceId !== serviceId) return false;
  if (!query) return true;

  const keyword = query.toLowerCase();
  const candidate = [
    group.title,
    group.description,
    group.platform,
    service?.shortLabel,
    service?.name,
    ...(service?.aliases ?? []),
    plan?.name,
    group.plan,
    group.hostName,
    ...(group.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return candidate.includes(keyword);
}

function getSuggestionGroups(groups, query, serviceId) {
  const trimmedQuery = query.trim();
  const matched = groups.filter((group) => matchesGroup(group, trimmedQuery, serviceId));

  if (trimmedQuery) {
    return matched.slice(0, 4);
  }

  return [...matched]
    .sort((a, b) => {
      const scoreA =
        (a.tags?.includes("熱門") ? 2 : 0) +
        (a.tags?.includes("快滿") ? 2 : 0) +
        ((a.totalSlots ?? 0) - (a.takenSlots ?? 0) <= 1 ? 1 : 0);
      const scoreB =
        (b.tags?.includes("熱門") ? 2 : 0) +
        (b.tags?.includes("快滿") ? 2 : 0) +
        ((b.totalSlots ?? 0) - (b.takenSlots ?? 0) <= 1 ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);
}

function SearchSuggestionList({ groups, onSelectGroup }) {
  if (!groups.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-black/12 bg-black/[0.015] px-4 py-8 text-center text-sm text-black/50">
        目前沒有符合條件的群組，試試其他關鍵字或服務類型。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const service = getServiceById(group.serviceId ?? group.platform);
        const plan = getPlanById(group.serviceId, group.planId);
        const serviceLabel = service?.name ?? service?.shortLabel ?? group.platform;
        const planLabel = plan?.name ?? group.plan ?? "未設定方案";
        const priceLabel =
          getPricePerSeatLabel(group.serviceId, group.planId) ??
          plan?.priceLabel ??
          (group.pricePerMonth != null
            ? `${group.currency === "USD" ? "US$" : "NT$"}${formatMoney(group.pricePerMonth, group.currency)}`
            : "價格待補充");

        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectGroup(group)}
            className="flex w-full items-center gap-3 rounded-[20px] border border-black/8 bg-white px-3 py-2.5 text-left transition hover:border-black/12 hover:bg-black/[0.02]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.03]">
              <ServiceIcon
                serviceId={group.serviceId}
                platform={group.platform}
                iconKey={group.iconKey}
                alt={serviceLabel}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-black">{serviceLabel}</div>
              <div className="mt-0.5 truncate text-xs text-black/55">
                {planLabel} · {priceLabel}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SearchSectionButton({
  label,
  value,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-w-0 items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-left transition",
        active ? "bg-[#edede9] text-black" : "hover:bg-[#f4f3ef]",
      ].join(" ")}
    >
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">
          {label}
        </span>
        <div className="mt-1 truncate text-sm font-medium text-black/78">{value}</div>
      </div>
      <ChevronDownIcon
        className={[
          "h-4 w-4 shrink-0 text-black/38 transition-transform duration-200",
          active ? "rotate-180" : "",
        ].join(" ")}
      />
    </button>
  );
}

export function ExploreFilterCardNav({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  selectedServiceId,
  onSelectServiceId,
  groups = [],
  filteredCount = 0,
  totalCount = 0,
  onSelectGroup,
  onSearchAction,
}) {
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const [activePanel, setActivePanel] = useState(null);

  const selectedSort = sortOptions.find((option) => option.value === sortValue);
  const selectedService = SERVICES.find((service) => service.id === selectedServiceId);

  const suggestionGroups = useMemo(
    () => getSuggestionGroups(groups, searchValue, selectedServiceId),
    [groups, searchValue, selectedServiceId],
  );

  const hasActiveFilters =
    searchValue.trim().length > 0 || selectedServiceId || sortValue !== "newest";

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setActivePanel(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <section className="relative z-20 overflow-visible pb-1" ref={rootRef}>
      <div className="relative rounded-[34px] border border-black/8 bg-white/98 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto] lg:items-center">
          <div
            className={[
              "relative min-w-0 rounded-[26px] px-4 py-3 transition",
              activePanel === "search" ? "bg-[#edede9]" : "hover:bg-[#f4f3ef]",
              "sm:col-span-2 lg:col-span-1",
            ].join(" ")}
            onClick={() => {
              setActivePanel("search");
              window.setTimeout(() => searchInputRef.current?.focus(), 0);
            }}
          >
            <div className="pointer-events-none text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">
              Search
            </div>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-[34px] h-4 w-4 text-black/32" />
            <input
              ref={searchInputRef}
              value={searchValue}
              onChange={(event) => {
                onSearchChange(event.target.value);
                setActivePanel("search");
              }}
              onFocus={() => setActivePanel("search")}
              placeholder="搜尋平台、方案或團主"
              className="mt-1 w-full border-0 bg-transparent p-0 pl-6 text-sm text-black outline-none placeholder:text-black/38"
            />
          </div>

          <SearchSectionButton
            label="Sort"
            value={selectedSort?.label ?? "最新上架"}
            active={activePanel === "sort"}
            onClick={() => setActivePanel((current) => (current === "sort" ? null : "sort"))}
          />

          <SearchSectionButton
            label="Service Type"
            value={selectedService?.shortLabel ?? "全部服務"}
            active={activePanel === "service"}
            onClick={() => setActivePanel((current) => (current === "service" ? null : "service"))}
          />

          <div className="flex items-center gap-2 rounded-[26px] px-2 py-2">
            <button
              type="button"
              onClick={() => {
                onSearchAction?.();
                setActivePanel(null);
              }}
              className="inline-flex h-12 min-w-[126px] items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-[#1d4ed8]"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              搜尋群組
            </button>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onSelectServiceId("");
                  onSortChange("newest");
                  setActivePanel(null);
                }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-black/55 transition hover:bg-black/[0.03] hover:text-black"
                aria-label="清除篩選"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={[
          "absolute left-2 right-2 top-[calc(100%+8px)] z-30 origin-top rounded-[30px] border border-black/[0.06] bg-white px-4 pb-4 pt-5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition-all duration-200 ease-out sm:px-5 sm:pb-5 sm:pt-6",
          activePanel
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        ].join(" ")}
      >
        {activePanel === "search" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">
                  Quick Find
                </div>
                <div className="mt-1 text-base font-semibold tracking-tight text-black">
                  {searchValue.trim() ? "快速找到對的群組" : "熱門推薦與快速查找"}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8]">
                <SparklesIcon className="h-4 w-4" />
                顯示 {filteredCount} / {totalCount}
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto pr-1">
              <SearchSuggestionList
                groups={suggestionGroups}
                onSelectGroup={(group) => {
                  onSelectGroup?.(group);
                  setActivePanel(null);
                }}
              />
            </div>
          </div>
        ) : null}

        {activePanel === "sort" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">
                Sort
              </div>
              <div className="mt-1 text-base font-semibold tracking-tight text-black">
                選擇你想先看的群組排序
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {sortOptions.map((option) => {
                const active = option.value === sortValue;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSortChange(option.value);
                      setActivePanel(null);
                    }}
                    className={[
                      "rounded-[20px] border px-4 py-3 text-left transition",
                      active
                        ? "border-black/10 bg-[#edede9] text-black shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                        : "border-black/8 bg-black/[0.015] text-black/72 hover:bg-black/[0.03]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className={["mt-1 text-xs leading-5", active ? "text-black/55" : "text-black/45"].join(" ")}>
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {activePanel === "service" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">
                Service Type
              </div>
              <div className="mt-1 text-base font-semibold tracking-tight text-black">
                選擇想探索的平台服務
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  onSelectServiceId("");
                  setActivePanel(null);
                }}
                className={[
                  "inline-flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition",
                  selectedServiceId === ""
                    ? "border-black/10 bg-[#edede9] text-black shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                    : "border-black/8 bg-black/[0.015] text-black/72 hover:bg-black/[0.03]",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    selectedServiceId === "" ? "bg-white/70" : "bg-black/[0.04]",
                  ].join(" ")}
                >
                  <MagnifyingGlassIcon className={["h-5 w-5", selectedServiceId === "" ? "text-black/72" : "text-black/55"].join(" ")} />
                </div>
                <div>
                  <div className="text-sm font-semibold">全部服務</div>
                  <div className={["mt-1 text-xs", selectedServiceId === "" ? "text-black/55" : "text-black/45"].join(" ")}>
                    顯示所有共享群組
                  </div>
                </div>
              </button>

              {SERVICES.map((service) => {
                const active = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      onSelectServiceId(active ? "" : service.id);
                      setActivePanel(null);
                    }}
                    className={[
                      "inline-flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition",
                      active
                        ? "border-black/10 bg-[#edede9] text-black shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                        : "border-black/8 bg-black/[0.015] text-black/72 hover:bg-black/[0.03]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-11 w-11 items-center justify-center rounded-full",
                        active ? "bg-white/70" : "bg-black/[0.04]",
                      ].join(" ")}
                    >
                      <ServiceIcon
                        serviceId={service.id}
                        alt={service.shortLabel}
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{service.shortLabel}</div>
                      <div className={["mt-1 text-xs", active ? "text-black/55" : "text-black/45"].join(" ")}>
                        查看可加入方案
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
