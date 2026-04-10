import { useMemo } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { SERVICES } from "../../../data/services.config.js";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { normalizeLoopValue } from "../../../shared/utils/carousel.js";

const LOOP_SPEED = 22;
const GAP_PX = 28;
const MotionDiv = motion.div;


export function ExploreServiceLogoLoop() {
  const trackX = useMotionValue(0);

  const services = useMemo(() => SERVICES.map((service) => service), []);
  const setWidth = useMemo(
    () => services.length * 88 + Math.max(services.length - 1, 0) * GAP_PX,
    [services.length],
  );

  useAnimationFrame((_, delta) => {
    const next = normalizeLoopValue(
      trackX.get() - LOOP_SPEED * (delta / 1000),
      setWidth,
    );

    trackX.set(next);
  });

  return (
    <div className="relative overflow-hidden py-2" aria-hidden="true">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/92 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/92 to-transparent sm:w-16" />

      <MotionDiv className="flex items-center" style={{ x: trackX }}>
        {[0, 1, 2].map((setIndex) => (
          <div
            key={`service-logo-set-${setIndex}`}
            className="flex shrink-0 items-center"
            style={{ width: setWidth }}
          >
            {services.map((service, index) => (
              <div
                key={`${setIndex}-${service.id}`}
                className="flex h-[88px] w-[88px] shrink-0 items-center justify-center"
                style={{
                  marginRight: index === services.length - 1 ? 0 : GAP_PX,
                }}
              >
                <ServiceIcon
                  serviceId={service.id}
                  alt=""
                  className="h-12 w-12 object-contain opacity-95 drop-shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:h-14 sm:w-14"
                />
              </div>
            ))}
          </div>
        ))}
      </MotionDiv>
    </div>
  );
}
