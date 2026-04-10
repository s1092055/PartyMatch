import { useNavigate } from "react-router-dom";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";

const HERO_SERVICES = [
  { id: "netflix", label: "Netflix" },
  { id: "spotify", label: "Spotify" },
  { id: "youtube", label: "YouTube" },
  { id: "disney", label: "Disney+" },
  { id: "apple", label: "Apple One" },
  { id: "notion", label: "Notion" },
  { id: "canva", label: "Canva" },
  { id: "google", label: "Google One" },
];

export function HeroBanner() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[calc(100svh-6rem)] flex-col items-center justify-center overflow-hidden bg-[#faf9f7] px-4 py-16 sm:min-h-[calc(100svh-5.5rem)] sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:px-8">
      <SmartContainer
        size="wide"
        className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left"
      >
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/36">
          共享訂閱平台
        </p>

        {/* Primary headline — the actual h1 */}
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-[#111110] sm:text-5xl lg:text-[3.75rem] lg:leading-[1.08]">
          找人均攤，
          <br />
          訂閱少付一半
        </h1>

        {/* Description — specific, not marketing fluff */}
        <p className="mt-5 max-w-[22rem] text-base leading-7 text-black/52 sm:max-w-md sm:text-[17px] lg:max-w-[36rem]">
          瀏覽 Netflix、Spotify、YouTube 等服務的共享群組，合理平分費用，幾分鐘內完成申請。
        </p>

        {/* CTAs */}
        <div className="mt-10 flex gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/explore")}
            className="inline-flex items-center justify-center rounded-full bg-[#111110] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#111110]/80 active:scale-[0.99] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            開始探索
          </button>
          <button
            type="button"
            onClick={() => navigate("/create-group")}
            className="inline-flex items-center justify-center rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/[0.04] active:scale-[0.99] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            建立群組
          </button>
        </div>

        {/* Service strip — purposeful: shows what's supported */}
        <div className="mt-14 flex flex-col items-center gap-3 lg:items-start">
          <p className="text-[11px] font-medium tracking-[0.12em] text-black/28 uppercase">
            支援服務
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {HERO_SERVICES.map(({ id, label }) => (
              <div
                key={id}
                title={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
              >
                <ServiceIcon
                  serviceId={id}
                  platform={label}
                  iconKey={id}
                  alt={label}
                  className="h-5 w-5 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </SmartContainer>
    </section>
  );
}
