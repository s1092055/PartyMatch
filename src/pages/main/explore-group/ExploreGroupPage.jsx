import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";
import { PageHeader } from "../../../shared/components/layout/PageHeader.jsx";
import { ExploreFeaturedCarousel } from "./components/ExploreFeaturedCarousel.jsx";
import { ExploreFilterCardNav } from "./components/ExploreFilterCardNav.jsx";
import { ExploreGroupedSections } from "./components/ExploreGroupedSections.jsx";
import { ExploreServiceLogoLoop } from "./components/ExploreServiceLogoLoop.jsx";
import { useGroups } from "../../../shared/modules/groups/hooks/useGroups.js";
import { buildExploreGroupSections } from "./utils/exploreGroupSections.js";

export function ExploreGroupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    groups,
    filteredGroups,
    search,
    setSearch,
    platform,
    setPlatform,
    sort,
    setSort,
  } = useGroups("newest");

  useEffect(() => {
    const q = searchParams.get("q");
    setSearch(q ?? "");
  }, [searchParams, setSearch]);

  const groupedSections = useMemo(
    () => buildExploreGroupSections(filteredGroups),
    [filteredGroups],
  );

  return (
    <>
      <section className="pt-12 sm:pt-16">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <PageHeader
            eyebrow="Explore Groups"
            title="探索群組"
            description="探索適合你的共享方案與群組，快速比較名額、價格與加入條件。"
          />
        </SmartContainer>
      </section>

      <section className="pt-2 pb-1 sm:pt-3 sm:pb-2">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <ExploreServiceLogoLoop />
        </SmartContainer>
      </section>

      <section className="pt-1 pb-0 sm:pt-2">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <ExploreFilterCardNav
            searchValue={search}
            onSearchChange={setSearch}
            sortValue={sort}
            onSortChange={setSort}
            selectedServiceId={platform}
            onSelectServiceId={setPlatform}
            groups={groups}
            totalCount={groups.length}
            filteredCount={filteredGroups.length}
            onSelectGroup={(group) => navigate(`/groups/${group.id}`)}
            onSearchAction={() => {
              document.getElementById("explore")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          />
        </SmartContainer>
      </section>

      <section className="pt-6 pb-8 sm:pt-7 sm:pb-10">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <ExploreFeaturedCarousel
            groups={groups}
            onViewGroup={(group) => navigate(`/groups/${group.id}`)}
          />
        </SmartContainer>
      </section>

      <ExploreGroupedSections
        sections={groupedSections}
        sectionId="explore"
        className="pt-0 pb-12"
        onCardClick={(group) => navigate(`/groups/${group.id}`)}
      />
    </>
  );
}
