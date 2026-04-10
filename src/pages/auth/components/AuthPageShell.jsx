import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";

const MotionDiv = motion.div;

const PANEL_SERVICES = [
  { id: "netflix", label: "Netflix" },
  { id: "spotify", label: "Spotify" },
  { id: "notion", label: "Notion" },
  { id: "canva", label: "Canva" },
  { id: "youtube", label: "YouTube" },
  { id: "disney", label: "Disney+" },
];

export function AuthPageShell({ formTitle, children }) {
  const location = useLocation();
  return (
    <div className="flex min-h-dvh">
      <div
        className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between overflow-hidden px-12 py-12 xl:px-16 xl:py-14"
        style={{ backgroundColor: "#050816" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-violet-600/15 blur-[140px]" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden border border-white/12 bg-white/8">
              <img src="/imgs/logo.png" alt="PartyMatch" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">PartyMatch</span>
          </Link>
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex gap-2.5">
            {PANEL_SERVICES.map(({ id, label }) => (
              <div
                key={id}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"
              >
                <ServiceIcon
                  serviceId={id}
                  platform={id}
                  iconKey={id}
                  alt={label}
                  className="h-5 w-5 object-contain"
                />
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-snug tracking-tight text-white xl:text-3xl">
              共享訂閱，找到<br />最適合你的方案。
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/48">
              探索數十種熱門服務的共享群組，一起分攤費用，輕鬆享受完整服務。
            </p>
          </div>
        </div>

        <div className="relative">
          <p className="text-xs text-white/28">© 2026 PartyMatch</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white">
        <div className="flex items-center border-b border-black/8 px-5 py-4 lg:hidden">
          <Link to="/" className="text-sm font-bold tracking-tight text-black">PartyMatch</Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <MotionDiv
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-[400px]"
            >
              <h1 className="text-2xl font-bold tracking-tight text-black sm:text-[1.75rem]">
                {formTitle}
              </h1>
              <div className="mt-12">{children}</div>
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
