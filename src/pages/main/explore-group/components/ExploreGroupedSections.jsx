import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SmartContainer } from "../../../../shared/components/layout/SmartContainer.jsx";
import { ExploreGroupSection } from "./ExploreGroupSection.jsx";

export function ExploreGroupedSections({
  sections = [],
  className = "",
  sectionId = "explore",
  onCardClick,
}) {
  return (
    <section id={sectionId} className={className}>
      <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
        {!sections.length ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-black/10 bg-black/[0.015] px-6 text-center">
            <MagnifyingGlassIcon className="h-10 w-10 text-black/20" />
            <div className="mt-4 text-xl font-bold tracking-tight text-black">
              未搜尋到符合條件的群組
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-black/55">
              試試其他平台名稱，或調整篩選條件。
            </p>
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {sections.map((section) => (
              <ExploreGroupSection
                key={section.serviceId}
                section={section}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </SmartContainer>
    </section>
  );
}
