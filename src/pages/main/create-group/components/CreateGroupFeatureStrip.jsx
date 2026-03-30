import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getFeatureIcon } from "../../../../shared/utils/serviceTheme.js";

export function CreateGroupFeatureStrip({
  features = [],
  tone = "dark",
  className = "",
  showEdgeHint = false,
}) {
  const scrollerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setHasOverflow(maxScrollLeft > 2);
    setCanScrollLeft(node.scrollLeft > 2);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 2);
  }

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return undefined;

    updateScrollState();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateScrollState);
      observer.observe(node);
      window.addEventListener("resize", updateScrollState);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateScrollState);
      };
    }

    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [features]);

  if (!features.length) return null;

  const iconColor = tone === "dark" ? "text-white" : "text-[#2563eb]";
  const textColor = tone === "dark" ? "text-white/80" : "text-black/66";
  const edgeHintColor =
    tone === "dark"
      ? "from-black/14 via-black/6 to-transparent"
      : "from-white via-white/88 to-transparent";

  function scrollByDir(direction) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.round(node.clientWidth * 0.72);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div className={["group/feature relative min-w-0", className].join(" ").trim()}>
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="overflow-x-auto overflow-y-hidden scrollbar-none scroll-smooth"
      >
        <div className="flex w-max gap-4 pb-1 pr-12">
          {features.map((feature) => {
            const FeatureIcon = getFeatureIcon(feature);

            return (
              <div
                key={feature}
                className="flex w-[112px] shrink-0 flex-col items-center px-2 py-2 text-center sm:w-[120px]"
              >
                <FeatureIcon className={["h-7 w-7", iconColor].join(" ")} />
                <div
                  className={[
                    "mt-3 line-clamp-3 text-sm leading-6",
                    textColor,
                  ].join(" ")}
                >
                  {feature}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEdgeHint && hasOverflow ? (
        <div
          className={[
            "pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l",
            edgeHintColor,
          ].join(" ")}
        />
      ) : null}

      {hasOverflow ? (
        <>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/92 text-black/70 opacity-0 shadow-sm transition group-hover/feature:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 lg:flex"
            aria-label="向左查看方案內容"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/92 text-black/70 opacity-0 shadow-sm transition group-hover/feature:opacity-100 disabled:cursor-not-allowed disabled:opacity-0 lg:flex"
            aria-label="向右查看方案內容"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}
