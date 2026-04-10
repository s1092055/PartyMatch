import { HorizontalScroller } from "../../../shared/components/ui/HorizontalScroller.jsx";
import { GroupDetailSection } from "./GroupDetailSection.jsx";

export function GroupDetailFeatureStrip({ featureWidgets }) {
  return (
    <GroupDetailSection
      eyebrow="方案內容"
      title="你加入後會得到什麼？"
    >
      <div className="min-w-0 max-w-full lg:hidden">
        <div className="max-w-full overflow-x-auto scrollbar-none scroll-smooth">
          <div className="grid min-w-full grid-flow-col auto-cols-[minmax(92px,1fr)] gap-4 pb-2">
            {featureWidgets.map((widget, index) => {
              const FeatureIcon = widget.Icon;

              return (
                <div
                  key={`feature-mobile-${index}-${widget.feature}`}
                  className="flex min-w-0 flex-col items-center justify-start px-1 py-2 text-center"
                >
                  <FeatureIcon className="h-7 w-7 text-black" />
                  <p className="mt-3 text-sm leading-6 text-black/66">{widget.feature}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 max-w-full lg:block">
        <HorizontalScroller
          scrollAmountRatio={0.72}
          controlsVisibility="overflow"
          contentClassName="pb-2"
        >
          <div className="grid min-w-full grid-flow-col auto-cols-[minmax(132px,1fr)] gap-6">
            {featureWidgets.map((widget, index) => {
              const FeatureIcon = widget.Icon;

              return (
                <div
                  key={`feature-desktop-${index}-${widget.feature}`}
                  className="flex min-w-0 flex-col items-center justify-start px-2 py-3 text-center"
                >
                  <FeatureIcon className="h-8 w-8 text-black" />
                  <p className="mt-3 text-sm leading-6 text-black/66">{widget.feature}</p>
                </div>
              );
            })}
          </div>
        </HorizontalScroller>
      </div>
    </GroupDetailSection>
  );
}
