import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useAnimationFrame, useMotionValue } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { GroupCard } from "../../../shared/modules/groups/components/GroupCard.jsx";
import { normalizeLoopValue } from "../../../shared/utils/carousel.js";

const GAP_PX = 16;
const AUTOPLAY_RESUME_DELAY_MS = 2200;
const AUTO_SPEED_DESKTOP = 34;
const AUTO_SPEED_MOBILE = 28;
const MotionDiv = motion.div;

function getCardWidth(viewportWidth) {
  if (!viewportWidth) return 0;
  if (viewportWidth >= 1100) return (viewportWidth - GAP_PX * 2) / 3;
  if (viewportWidth >= 680) return (viewportWidth - GAP_PX) / 2;
  return viewportWidth;
}


export function ExploreFeaturedCarousel({ groups = [], onViewGroup }) {
  const viewportRef = useRef(null);
  const firstSetRef = useRef(null);
  const firstItemRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const manualAnimationRef = useRef(null);
  const autoPausedRef = useRef(false);

  const trackX = useMotionValue(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [setWidth, setSetWidth] = useState(0);
  const [stepWidth, setStepWidth] = useState(0);

  const featuredGroups = useMemo(() => {
    return [...groups]
      .filter((group) => {
        const remaining = (group.totalSlots ?? 0) - (group.takenSlots ?? 0);
        return remaining > 0 && group.status !== "expired";
      })
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
      .slice(0, 8);
  }, [groups]);

  const cardWidth = useMemo(() => getCardWidth(viewportWidth), [viewportWidth]);
  const autoSpeed = viewportWidth < 680 ? AUTO_SPEED_MOBILE : AUTO_SPEED_DESKTOP;

  useEffect(() => {
    if (!viewportRef.current || !firstSetRef.current || !firstItemRef.current) {
      return undefined;
    }

    const viewportNode = viewportRef.current;
    const setNode = firstSetRef.current;
    const itemNode = firstItemRef.current;

    const observer = new ResizeObserver(() => {
      setViewportWidth(viewportNode.getBoundingClientRect().width);
      setSetWidth(setNode.getBoundingClientRect().width);
      setStepWidth(itemNode.getBoundingClientRect().width);
    });

    observer.observe(viewportNode);
    observer.observe(setNode);
    observer.observe(itemNode);

    setViewportWidth(viewportNode.getBoundingClientRect().width);
    setSetWidth(setNode.getBoundingClientRect().width);
    setStepWidth(itemNode.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [featuredGroups.length]);

  useEffect(() => {
    if (!setWidth) return;
    trackX.set(-setWidth);
  }, [setWidth, trackX]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
      manualAnimationRef.current?.stop?.();
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (!setWidth || autoPausedRef.current) return;

    const next = normalizeLoopValue(
      trackX.get() - autoSpeed * (delta / 1000),
      setWidth,
    );

    trackX.set(next);
  });

  function pauseAutoplay(delay = AUTOPLAY_RESUME_DELAY_MS) {
    autoPausedRef.current = true;

    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = window.setTimeout(() => {
      autoPausedRef.current = false;
      resumeTimerRef.current = null;
    }, delay);
  }

  function nudgeTrack(direction) {
    if (!setWidth || !stepWidth) return;

    pauseAutoplay();
    manualAnimationRef.current?.stop?.();

    const distance = direction === "next" ? -stepWidth : stepWidth;
    const target = trackX.get() + distance;

    manualAnimationRef.current = animate(trackX, target, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        trackX.set(normalizeLoopValue(trackX.get(), setWidth));
      },
    });
  }

  if (!featuredGroups.length) {
    return (
      <div className="rounded-3xl bg-white p-2">
        <p className="text-sm text-black/60">目前沒有可推薦的群組</p>
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={() => nudgeTrack("prev")}
        className="absolute left-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/94 text-black shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:bg-white sm:left-0 sm:h-10 sm:w-10 sm:-translate-x-1/2"
        aria-label="上一組精選群組"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => nudgeTrack("next")}
        className="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/94 text-black shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:bg-white sm:right-0 sm:h-10 sm:w-10 sm:translate-x-1/2"
        aria-label="下一組精選群組"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      <div
        ref={viewportRef}
        className="overflow-hidden pt-1 pb-2"
        style={{ touchAction: "pan-y" }}
      >
        <MotionDiv className="flex" style={{ x: trackX }}>
          {[0, 1, 2].map((setIndex) => (
            <div
              key={`loop-set-${setIndex}`}
              ref={setIndex === 0 ? firstSetRef : undefined}
              className="flex shrink-0"
            >
              {featuredGroups.map((group, groupIndex) => (
                <div
                  key={`${setIndex}-${group.id}`}
                  ref={setIndex === 0 && groupIndex === 0 ? firstItemRef : undefined}
                  className="shrink-0"
                  style={{
                    width: cardWidth || undefined,
                    marginRight: GAP_PX,
                  }}
                >
                  <GroupCard
                    group={group}
                    onClick={() => onViewGroup?.(group)}
                  />
                </div>
              ))}
            </div>
          ))}
        </MotionDiv>
      </div>
    </div>
  );
}
