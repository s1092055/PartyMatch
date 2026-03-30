import { HorizontalScroller } from "../../../../shared/components/ui/HorizontalScroller.jsx";
import { GroupCard } from "../../../../shared/modules/groups/components/GroupCard.jsx";

export function ExploreGroupSection({ section, onCardClick }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-black">
            {section.serviceLabel}
          </h2>
          <p className="mt-1 text-sm text-black/52">
            共 {section.groups.length} 個可加入群組
          </p>
        </div>
      </div>

      <HorizontalScroller
        controlsVisibility="overflow"
        className="gap-0 lg:gap-3"
        controlsClassName="hidden lg:flex"
        contentClassName="scrollbar-none pb-2 -mb-2"
      >
        <div className="flex gap-4 pr-4">
          {section.groups.map((group) => (
            <div
              key={group.id}
              className="w-[248px] shrink-0 sm:w-[272px] lg:w-[296px]"
            >
              <GroupCard
                group={group}
                onClick={() => onCardClick(group)}
              />
            </div>
          ))}
        </div>
      </HorizontalScroller>
    </section>
  );
}
