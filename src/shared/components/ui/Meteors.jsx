import { useMemo } from "react";

function seededRange(seed, min, max) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  const normalized = value - Math.floor(value);
  return min + normalized * (max - min);
}

export function Meteors({
  number = 14,
  minDelay = 0.4,
  maxDelay = 1.5,
  minDuration = 3,
  maxDuration = 8,
  angle = 35,
  className = "",
}) {
  const meteors = useMemo(
    () => {
      const columns = Math.max(1, Math.ceil(Math.sqrt(number)));
      const rows = Math.max(1, Math.ceil(number / columns));

      return Array.from({ length: number }, (_, index) => {
        const columnIndex = index % columns;
        const rowIndex = Math.floor(index / columns);
        const baseLeft =
          columns === 1 ? 50 : (columnIndex / Math.max(columns - 1, 1)) * 92 - 4;
        const baseTop =
          rows === 1 ? 18 : (rowIndex / Math.max(rows - 1, 1)) * 62 - 10;

        return {
          id: index,
          left: baseLeft + seededRange(index + 1, -6, 6),
          top: baseTop + seededRange(index + 11, -7, 7),
          delay: seededRange(index + 21, minDelay, maxDelay),
          duration: seededRange(index + 31, minDuration, maxDuration),
          distanceX: seededRange(index + 41, 360, 620),
          distanceY: seededRange(index + 51, 220, 420),
          tail: seededRange(index + 61, 72, 132),
          size: seededRange(index + 71, 1.8, 2.8),
          opacity: seededRange(index + 81, 0.72, 1),
          angle,
        };
      });
    },
    [angle, maxDelay, maxDuration, minDelay, minDuration, number],
  );

  return (
    <div className={["pointer-events-none absolute inset-0 overflow-hidden", className].join(" ")}>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="animate-meteor absolute left-0 top-0 block rounded-full bg-gradient-to-r from-white/0 via-sky-100/45 to-sky-400/85 opacity-0 shadow-[0_0_16px_rgba(56,189,248,0.16)] after:absolute after:right-0 after:top-1/2 after:h-[6px] after:w-[6px] after:-translate-y-1/2 after:rounded-full after:bg-white after:shadow-[0_0_16px_rgba(255,255,255,0.92),0_0_30px_rgba(59,130,246,0.34)] after:content-['']"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
            "--meteor-angle": `${meteor.angle}deg`,
            "--meteor-distance-x": `${meteor.distanceX}px`,
            "--meteor-distance-y": `${meteor.distanceY}px`,
            "--meteor-tail": `${meteor.tail}px`,
            "--meteor-size": `${meteor.size}px`,
            opacity: meteor.opacity,
            width: `var(--meteor-tail)`,
            height: `var(--meteor-size)`,
          }}
        />
      ))}
    </div>
  );
}
