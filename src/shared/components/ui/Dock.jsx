import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const MotionDiv = motion.div;

export function Dock({
  children,
  className = "",
}) {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);

  return (
    <MotionDiv
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
      className={className}
    >
      {typeof children === "function" ? children(mouseX) : children}
    </MotionDiv>
  );
}

export function DockIcon({
  children,
  mouseX,
  baseSize = 46,
  magnification = 74,
  distance = 170,
  disableMagnification = false,
  className = "",
}) {
  const iconRef = useRef(null);

  const width = useTransform(mouseX, (value) => {
    if (disableMagnification) return baseSize;

    const bounds = iconRef.current?.getBoundingClientRect();

    if (!bounds || !Number.isFinite(value)) return baseSize;

    const center = bounds.x + bounds.width / 2;
    const delta = Math.abs(value - center);

    if (delta > distance) return baseSize;

    const progress = 1 - delta / distance;
    return baseSize + (magnification - baseSize) * progress;
  });

  const size = useSpring(width, {
    mass: 0.18,
    stiffness: 240,
    damping: 18,
  });

  return (
    <MotionDiv
      ref={iconRef}
      style={{ width: size, height: size }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}
