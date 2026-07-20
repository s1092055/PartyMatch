import { useNavigate } from "react-router-dom";
import { VideoOff, ChevronRight } from "lucide-react";
import RevealSection from "../../../shared/ui/primitives/RevealSection";
import { HOME_FEATURES } from "../data/homeContent";

function FeatureMedia({ icon: Icon, videoSrc }) {
  if (videoSrc) {
    return (
      <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
        <source src={videoSrc} />
      </video>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-raised">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle">
        <Icon size={32} className="text-brand" />
      </div>
      <div className="flex items-center gap-1.5 text-ink-4">
        <VideoOff size={14} />
        <span className="text-xs font-medium">功能示範影片即將推出</span>
      </div>
    </div>
  );
}

export default function FeatureCards() {
  const navigate = useNavigate();

  function handleAction(action) {
    if (action.type === "navigate") {
      navigate(action.path);
    } else {
      window.dispatchEvent(new CustomEvent(action.event));
    }
  }

  return (
    <section>
      <div className="mb-10 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">核心功能</p>
        <h2 className="text-3xl font-extrabold text-ink">可以做到哪些事？</h2>
        <p className="mt-3 text-base text-ink-3">
          從找群組到管理訂閱，五大功能覆蓋合購的每個環節。
        </p>
      </div>

      <div className="space-y-20">
        {HOME_FEATURES.map(({ icon: Icon, title, desc, videoSrc, badge, action, cta }, i) => {
          const isEven = i % 2 === 0;
          return (
            <RevealSection key={title}>
              <div
                className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-12 ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
              >
                <div className="aspect-video w-full overflow-hidden rounded-2xl md:w-1/2 md:shrink-0">
                  <FeatureMedia icon={Icon} videoSrc={videoSrc} />
                </div>
                <div className="flex flex-col items-center md:w-1/2 md:items-start">
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-extrabold text-brand">
                    <Icon size={12} />
                    {badge}
                  </span>
                  <h3 className="text-center text-2xl font-extrabold text-ink md:text-left">{title}</h3>
                  <p className="mt-3 text-center text-base leading-relaxed text-ink-3 md:text-left">{desc}</p>
                  <button
                    onClick={() => handleAction(action)}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover"
                  >
                    {cta}
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </RevealSection>
          );
        })}
      </div>
    </section>
  );
}
