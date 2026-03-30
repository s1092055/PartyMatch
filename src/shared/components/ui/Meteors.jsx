import { useMemo } from "react";

export function Meteors({
  number = 14,
  minDelay = 0.4,
  maxDelay = 1.5,
  minDuration = 3,
  maxDuration = 8,
  angle = 215,
  className = "",
}) {
  const meteors = useMemo(
    () =>
      Array.from({ length: number }, (_, index) => {
        const progress = index / Math.max(number - 1, 1);

        return {
          id: index,
          left: 42 + progress * 50,
          top: 4 + ((index * 11) % 56),
          delay: minDelay + ((maxDelay - minDelay) * ((index * 17) % 100)) / 100,
          duration:
            minDuration + ((maxDuration - minDuration) * ((index * 29) % 100)) / 100,
          angle,
        };
      }),
    [angle, maxDelay, maxDuration, minDelay, minDuration, number],
  );

  return (
    <div className={["pointer-events-none absolute inset-0 overflow-hidden", className].join(" ")}>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="animate-meteor absolute left-0 top-0 h-[2px] w-32 rounded-full bg-gradient-to-r from-slate-200/0 via-sky-400/95 to-slate-400/85 shadow-[0_0_18px_rgba(125,211,252,0.55)]"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
            "--meteor-angle": `${meteor.angle}deg`,
            "--meteor-distance-x": "-360px",
            "--meteor-distance-y": "360px",
          }}
        />
      ))}
    </div>
  );
}
