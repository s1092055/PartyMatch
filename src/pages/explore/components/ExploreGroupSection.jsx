import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { GroupCard } from "../../../shared/modules/groups/components/GroupCard.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { useModalOpen } from "../../../shared/hooks/useModalOpen.js";

const modalShellTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };
const MotionButton = motion.button;
const MotionDiv = motion.div;

function ServiceGroupsModal({ section, onCardClick, onClose }) {
  useModalOpen();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <MotionButton
        type="button"
        aria-label={`關閉 ${section.serviceShortLabel} 群組列表`}
        className="absolute inset-0 h-full w-full bg-black/32 backdrop-blur-[6px]"
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
          aria-label={`${section.serviceLabel} 共享群組`}
          className="relative flex h-[min(84vh,820px)] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.98))] shadow-[0_34px_90px_rgba(15,23,42,0.18)]"
          initial={{ opacity: 0, scale: 0.985, y: -12, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.992, y: -8, filter: "blur(8px)" }}
          transition={modalShellTransition}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-b-[36px] bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_72%)]" />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-black/6 px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-black/8 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                  <ServiceIcon
                    serviceId={section.serviceId}
                    platform={section.serviceLabel}
                    iconKey={section.iconKey}
                    alt={section.serviceLabel}
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                    {section.categoryLabel}
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-black">
                    {section.serviceLabel}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-black/56">
                    {section.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/45 transition hover:bg-black/[0.04] hover:text-black"
                aria-label="關閉群組列表"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-black/46">
                <span>共 {section.groups.length} 個已建立的共享群組</span>
                <span>選擇你想查看的群組進入詳情頁</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onClick={() => {
                        onCardClick(group);
                        onClose();
                      }}
                      className="h-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>,
    document.body,
  );
}

export function ExploreGroupSection({ section, onCardClick }) {
  const isReversed = (section.layoutIndex ?? 0) % 2 === 1;
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const previewGroups = section.groups.slice(0, 4);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-10">
        <div
          className={[
            "flex min-h-full flex-col items-center justify-center pb-2 text-center",
            isReversed ? "xl:order-2 xl:pl-6" : "xl:order-1 xl:pr-6",
          ].join(" ")}
        >
          <div className="max-w-xl">
            <div className="flex items-stretch justify-center gap-4">
              <div className="flex w-16 shrink-0 items-center justify-center sm:w-[72px]">
                <ServiceIcon
                  serviceId={section.serviceId}
                  platform={section.serviceLabel}
                  iconKey={section.iconKey}
                  alt={section.serviceLabel}
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                  {section.categoryLabel}
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-[2.15rem]">
                  {section.serviceLabel}
                </h2>
              </div>
            </div>

            <p className="mt-6 max-w-lg text-base leading-8 text-black/58">
              {section.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-black/46">
              <span>目前展示 4 個群組</span>
              <span>共 {section.groups.length} 個可加入群組</span>
            </div>

            <button
              type="button"
              onClick={() => setIsServiceModalOpen(true)}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-medium text-black/72 transition hover:border-black/18 hover:bg-black/[0.03] hover:text-black"
            >
              <span>探索 {section.serviceShortLabel} 服務的共享群組</span>
              <ArrowUpRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={[
            "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "md:grid md:grid-cols-2 md:overflow-visible md:pb-0 md:snap-none",
            isReversed ? "xl:order-1" : "xl:order-2",
          ].join(" ")}
        >
          {previewGroups.map((group) => (
            <div key={group.id} className="w-[76vw] max-w-[320px] shrink-0 snap-start md:w-auto md:max-w-none md:shrink">
              <GroupCard
                group={group}
                onClick={() => onCardClick(group)}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isServiceModalOpen ? (
          <ServiceGroupsModal
            section={section}
            onCardClick={onCardClick}
            onClose={() => setIsServiceModalOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
