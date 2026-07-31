import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import RevealSection from "../../../components/ui/primitives/RevealSection";
import DeviceShowcase from "./DeviceShowcase";
import { HOME_FEATURES } from "../data/homeContent";

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
        <h2 className="text-3xl font-extrabold text-ink">平台核心功能</h2>
        <p className="mt-3 text-base text-ink-3">
          從尋找群組到管理訂閱，五大核心功能涵蓋合購流程的每個環節。
        </p>
      </div>

      <div className="space-y-20">
        {HOME_FEATURES.map(({ title, desc, screenshots, action, cta }, i) => {
          const isEven = i % 2 === 0;
          return (
            <RevealSection key={title}>
              <div
                className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-12 ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
              >
                <div className="w-full md:w-1/2 md:shrink-0">
                  <DeviceShowcase screenshots={screenshots} title={title} desc={desc} />
                </div>
                <div className="flex flex-col items-center md:w-1/2 md:items-start">
                  <h3 className="text-center text-2xl font-extrabold text-ink md:text-left">{title}</h3>
                  <p className="mt-3 text-center text-base leading-relaxed text-ink-3 md:text-left">{desc}</p>
                  <Button
                    onClick={() => handleAction(action)}
                    className="mt-6 w-fit rounded-xl shadow-sm"
                  >
                    {cta}
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </RevealSection>
          );
        })}
      </div>
    </section>
  );
}
