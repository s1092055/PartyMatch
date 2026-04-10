import { useEffect, useRef, useState } from "react";
import { useModalOpen } from "../../../shared/hooks/useModalOpen.js";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  SERVICES,
  getPlanById,
  getServiceById,
} from "../../../data/services.config.js";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { formatMoney } from "../../../shared/utils/format.js";
import { getPricePerSeatLabel } from "../../../shared/modules/groups/utils/groupSummary.js";

const MotionDiv = motion.div;

const modalShellTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };
const modalContentTransition = { duration: 0.14, ease: [0.22, 1, 0.36, 1] };

const sortOptions = [
  { value: "newest", label: "最新上架", description: "優先顯示最近建立的群組" },
  { value: "remaining", label: "剩最多", description: "優先顯示空位較多的群組" },
  { value: "priceAsc", label: "價格低到高", description: "先看每位分攤較低的方案" },
];

const SERVICE_TAB_GRADIENTS = {
  netflix: "linear-gradient(135deg, #e50914 0%, #b20710 100%)",
  spotify: "linear-gradient(135deg, #1db954 0%, #138a3d 100%)",
  nintendo: "linear-gradient(135deg, #e60012 0%, #b0000e 100%)",
  youtube: "linear-gradient(135deg, #ff0033 0%, #c70039 100%)",
  disney: "linear-gradient(135deg, #113ccf 0%, #6c3cf0 100%)",
  google: "linear-gradient(135deg, #4285f4 0%, #34a853 55%, #fbbc05 100%)",
  apple: "linear-gradient(135deg, #111111 0%, #4b5563 100%)",
  notion: "linear-gradient(135deg, #111111 0%, #2f2f2f 100%)",
  canva: "linear-gradient(135deg, #00c4cc 0%, #7b61ff 100%)",
};

function getServiceTabStyle(serviceId, active) {
  if (!serviceId) {
    return {
      backgroundImage: "none",
      backgroundColor: "#000000",
      color: "#ffffff",
      opacity: active ? 1 : 0.84,
      borderColor: active ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.18)",
    };
  }

  if (serviceId === "netflix") {
    return {
      backgroundImage: "none",
      backgroundColor: "#111111",
      color: "#e50914",
      opacity: active ? 1 : 0.88,
      borderColor: active ? "rgba(229,9,20,0.28)" : "rgba(229,9,20,0.16)",
    };
  }

  const backgroundImage =
    SERVICE_TAB_GRADIENTS[serviceId] ??
    "#000000";

  return {
    backgroundImage,
    color: "#ffffff",
    opacity: active ? 1 : 0.78,
    borderColor: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
  };
}

function SearchResultsList({ groups, onSelectGroup }) {
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

/* ─── Unified search / filter modal ─── */
function SearchFilterModal({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  selectedServiceId,
  onSelectServiceId,
  filteredGroups,
  onSelectGroup,
  onClose,
}) {
  useModalOpen();
  const inputRef = useRef(null);
  const tabsScrollRef = useRef(null);
  const serviceTabs = [
    { id: "", label: "全部" },
    ...SERVICES.map((service) => ({
      id: service.id,
      label: service.shortLabel,
    })),
  ];
  const [tabScrollState, setTabScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function updateTabScrollState() {
      const node = tabsScrollRef.current;
      if (!node) return;

      const maxScrollLeft = node.scrollWidth - node.clientWidth;
      setTabScrollState({
        hasOverflow: maxScrollLeft > 8,
        canScrollLeft: node.scrollLeft > 8,
        canScrollRight: node.scrollLeft < maxScrollLeft - 8,
      });
    }

    updateTabScrollState();

    const node = tabsScrollRef.current;
    if (!node) return undefined;

    node.addEventListener("scroll", updateTabScrollState, { passive: true });
    window.addEventListener("resize", updateTabScrollState);

    return () => {
      node.removeEventListener("scroll", updateTabScrollState);
      window.removeEventListener("resize", updateTabScrollState);
    };
  }, [selectedServiceId]);

  function scrollTabs(direction) {
    const node = tabsScrollRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <motion.button
        type="button"
        aria-label="關閉搜尋與篩選"
        className="absolute inset-0 h-full w-full cursor-default bg-black/28 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <MotionDiv
          role="dialog"
          aria-modal="true"
          aria-label="探索群組搜尋與篩選"
          className="relative flex h-[min(82vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.98))] shadow-[0_34px_90px_rgba(15,23,42,0.18)]"
          initial={{ opacity: 0, scale: 0.985, y: -12, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.992, y: -8, filter: "blur(8px)" }}
          transition={modalShellTransition}
          style={{ transformOrigin: "top center" }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-b-[32px] bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_72%)]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ delay: 0.02, duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MotionDiv
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 0.02, ...modalContentTransition }}
            >

              <div className="px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold tracking-tight text-black">搜尋群組</div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/45 transition hover:bg-black/[0.04] hover:text-black"
                    aria-label="關閉搜尋"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <motion.div
                className="px-5 pt-5 sm:px-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: 0.04, ...modalContentTransition }}
              >
                <div className="border-b border-black/6 pb-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative min-w-0 flex-1">
                      <div className="relative flex h-12 items-center rounded-[20px] border border-black/6 bg-[#f4f3ef] pl-4 pr-[4.5rem]">
                        <input
                          ref={inputRef}
                          value={searchValue}
                          onChange={(e) => onSearchChange(e.target.value)}
                          placeholder="搜尋平台、方案或團主"
                          className="w-full min-w-0 bg-transparent text-sm text-black outline-none placeholder:text-black/40"
                        />
                        {searchValue ? (
                          <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute right-14 top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/10 text-black/50 transition hover:bg-black/15"
                            aria-label="清除搜尋"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        <div className="absolute right-2 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.24)]">
                          <MagnifyingGlassIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="relative shrink-0 md:w-[172px]">
                      <select
                        value={sortValue}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="h-12 w-full appearance-none rounded-[20px] border border-black/10 bg-white pl-4 pr-10 text-sm font-medium text-black outline-none transition hover:border-black/14 focus:border-black/30"
                        aria-label="選擇群組排序"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/38">
                        <ChevronUpDownIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="group relative mt-4 min-w-0">
                    {tabScrollState.canScrollLeft || tabScrollState.canScrollRight ? (
                      <>
                        {tabScrollState.canScrollLeft ? (
                          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[rgba(248,247,243,0.98)] to-transparent md:block" />
                        ) : null}
                        {tabScrollState.canScrollRight ? (
                          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-[rgba(248,247,243,0.98)] to-transparent md:block" />
                        ) : null}
                      </>
                    ) : null}

                    {tabScrollState.hasOverflow && tabScrollState.canScrollLeft ? (
                      <button
                        type="button"
                        onClick={() => scrollTabs("left")}
                        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/96 text-black/58 shadow-[0_10px_24px_rgba(15,23,42,0.08)] opacity-0 transition hover:text-black group-hover:opacity-100 md:flex"
                        aria-label="向左切換服務類型"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                    ) : null}

                    {tabScrollState.hasOverflow && tabScrollState.canScrollRight ? (
                      <button
                        type="button"
                        onClick={() => scrollTabs("right")}
                        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/96 text-black/58 shadow-[0_10px_24px_rgba(15,23,42,0.08)] opacity-0 transition hover:text-black group-hover:opacity-100 md:flex"
                        aria-label="向右切換服務類型"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ) : null}

                    <div
                      ref={tabsScrollRef}
                      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {serviceTabs.map((tab) => {
                        const active = selectedServiceId === tab.id;

                        return (
                          <button
                            key={tab.id || "all"}
                            type="button"
                            onClick={() => onSelectServiceId(tab.id)}
                            style={getServiceTabStyle(tab.id, active)}
                            className={[
                            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                            active
                              ? "text-white"
                              : "text-white hover:opacity-95",
                          ].join(" ")}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-6 sm:px-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ delay: 0.07, ...modalContentTransition }}
              >
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <SearchResultsList
                    groups={filteredGroups}
                    onSelectGroup={(group) => {
                      onSelectGroup?.(group);
                      onClose();
                    }}
                  />
                </div>
              </motion.div>

            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Main export ─── */
export function ExploreFilterCardNav({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  selectedServiceId,
  onSelectServiceId,
  filteredGroups = [],
  onSelectGroup,
  className = "",
  compact = false,
  navbarStyle = false,
  isExpanded = false,
  buttonClassName = "",
  triggerIcon: TriggerIcon = null,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const CompactIcon = TriggerIcon ?? MagnifyingGlassIcon;

  return (
    <section className={["relative z-20", navbarStyle ? "" : "pb-1", className].join(" ").trim()}>
      <motion.button
        type="button"
        className={
          navbarStyle
            ? [
                "inline-flex shrink-0 items-center justify-center rounded-full border transition",
                compact ? (isExpanded ? "h-10 w-10" : "h-9 w-9") : (isExpanded ? "h-10" : "h-9"),
                modalOpen
                  ? "border-black/20 bg-black text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)]"
                  : "border-black/10 bg-white/82 text-black/62 hover:bg-white hover:text-black",
                buttonClassName,
              ].join(" ")
            : [
                "group relative inline-flex items-center rounded-full border border-black/10 bg-white text-sm font-medium text-black/75 shadow-[0_10px_26px_rgba(15,23,42,0.08)] outline-none transition duration-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)]",
                compact ? "h-10 w-10 justify-center p-0" : "h-10 gap-3 px-4 pr-2",
                buttonClassName,
              ].join(" ")
        }
        aria-label="開啟搜尋群組"
        onClick={() => setModalOpen(true)}
        whileTap={{ scale: 0.985 }}
        animate={navbarStyle ? undefined : modalOpen ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        style={navbarStyle ? undefined : { pointerEvents: modalOpen ? "none" : "auto" }}
      >
        {navbarStyle ? (
          <>
            {!compact ? <span className="whitespace-nowrap">搜尋群組</span> : null}
            <CompactIcon className={compact ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
          </>
        ) : (
          <>
            {!compact ? <span className="whitespace-nowrap">搜尋群組</span> : null}
            <span
              className={[
                "flex shrink-0 items-center justify-center rounded-full bg-black text-white shadow-[0_10px_22px_rgba(0,0,0,0.24)] transition duration-200 group-hover:scale-[1.02] group-hover:bg-black/80",
                compact ? "h-10 w-10" : "h-8 w-8",
              ].join(" ")}
            >
              <CompactIcon className="h-4 w-4" />
            </span>
          </>
        )}
      </motion.button>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen ? (
          <SearchFilterModal
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            sortValue={sortValue}
            onSortChange={onSortChange}
            selectedServiceId={selectedServiceId}
            onSelectServiceId={onSelectServiceId}
            filteredGroups={filteredGroups}
            onSelectGroup={onSelectGroup}
            onClose={() => setModalOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
