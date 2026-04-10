import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SmartContainer } from "../../shared/components/layout/SmartContainer.jsx";
import { PageHeader } from "../../shared/components/layout/PageHeader.jsx";
import { LoadingSpinner } from "../../shared/components/feedback/LoadingSpinner.jsx";
import { ExploreGroupedSections } from "./components/ExploreGroupedSections.jsx";
import { ExploreServiceLogoLoop } from "./components/ExploreServiceLogoLoop.jsx";

import { useGroups } from "../../shared/modules/groups/hooks/useGroups.js";
import { buildExploreGroupSections } from "./utils/exploreGroupSections.js";

export function ExploreGroupPage() {
  const navigate = useNavigate();
  const {
    groups,
    isLoading,
  } = useGroups("newest", { scope: "discover" });

  const groupedSections = useMemo(
    () => buildExploreGroupSections(groups),
    [groups],
  );

  if (isLoading) {
    return <LoadingSpinner label="正在載入你的群組..." />;
  }

  return (
    <>
      <section className="pt-12 sm:pt-16">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="探索群組"
            description="探索適合你的共享方案與群組，快速比較名額、價格與加入條件。"
            className="mx-auto text-center"
          />
        </SmartContainer>
      </section>

      <section className="pt-2 pb-6 sm:pt-3 sm:pb-8">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <ExploreServiceLogoLoop />
        </SmartContainer>
      </section>

      <ExploreGroupedSections
        sections={groupedSections}
        sectionId="explore"
        className="pt-2 sm:pt-3 pb-12 sm:pb-16"
        onCardClick={(group) => navigate(`/groups/${group.id}`)}
      />

    </>
  );
}
