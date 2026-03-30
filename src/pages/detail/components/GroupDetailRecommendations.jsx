import { GroupCard } from "../../../shared/modules/groups/components/GroupCard.jsx";
import { HorizontalScroller } from "../../../shared/components/ui/HorizontalScroller.jsx";
import { GroupDetailSection } from "./GroupDetailSection.jsx";

export function GroupDetailRecommendations({ recommendedGroups, onNavigate }) {
  if (!recommendedGroups.length) return null;

  return (
    <GroupDetailSection
      eyebrow="其他推薦群組"
      title="查看更多推薦的群組"
      description="依照相近服務與方案類型挑選，幫你快速延伸比較其他可加入的選項。"
      className="mt-12"
    >
      <div className="lg:hidden">
        <div className="overflow-x-auto scrollbar-none scroll-smooth">
          <div className="flex min-w-max gap-4 pb-2">
            {recommendedGroups.map((recommendedGroup) => (
              <div
                key={recommendedGroup.id}
                className="w-[288px] max-w-[78vw] shrink-0 pt-1"
              >
                <GroupCard
                  group={recommendedGroup}
                  onClick={() => onNavigate(recommendedGroup.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <HorizontalScroller
          scrollAmountRatio={0.8}
          controlsVisibility="overflow"
          contentClassName="pb-2"
        >
          <div className="flex min-w-max gap-5">
            {recommendedGroups.map((recommendedGroup) => (
              <div key={recommendedGroup.id} className="w-[320px] shrink-0 pt-1">
                <GroupCard
                  group={recommendedGroup}
                  onClick={() => onNavigate(recommendedGroup.id)}
                />
              </div>
            ))}
          </div>
        </HorizontalScroller>
      </div>
    </GroupDetailSection>
  );
}
