import { useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import {
  selectVisibleExploreGroups,
  useGroupsStore,
} from "../state/index.js";
import { SORT_KEYS } from "../state/groupsTypes.js";
import { getPlanById, getServiceById, normalizeServiceId } from "../../../../data/services.config.js";

function buildSearchIndex(groups) {
  return groups.map((group) => {
    const service = getServiceById(group.serviceId);
    const plan = getPlanById(group.serviceId, group.planId);
    const text = [
      group.title,
      group.description,
      group.platform,
      service?.shortLabel,
      service?.name,
      ...(service?.aliases ?? []),
      plan?.name,
      group.plan,
      group.hostName,
      ...(group.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return { group, text };
  });
}

export function useGroups(initialSort = SORT_KEYS.NEWEST) {
  const { state } = useGroupsStore();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState(initialSort);
  const visibleGroups = useMemo(
    () => selectVisibleExploreGroups(state, user?.uid),
    [state, user?.uid],
  );

  const searchIndex = useMemo(() => buildSearchIndex(visibleGroups), [visibleGroups]);

  const filteredGroups = useMemo(() => {
    let result = visibleGroups;
    const normalizedPlatform = normalizeServiceId(platform);

    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = searchIndex
        .filter(({ text }) => text.includes(keyword))
        .map(({ group }) => group);
    }

    if (normalizedPlatform) {
      result = result.filter((group) => normalizeServiceId(group.serviceId) === normalizedPlatform);
    }

    const sorted = [...result];

    if (sort === SORT_KEYS.NEWEST) {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === SORT_KEYS.REMAINING) {
      sorted.sort((a, b) => (b.totalSlots - b.takenSlots) - (a.totalSlots - a.takenSlots));
    } else if (sort === SORT_KEYS.PRICE_ASC) {
      sorted.sort((a, b) => {
        const priceA = a.pricePerMonth ?? Number.POSITIVE_INFINITY;
        const priceB = b.pricePerMonth ?? Number.POSITIVE_INFINITY;
        return priceA - priceB;
      });
    }

    return sorted;
  }, [search, searchIndex, platform, sort, visibleGroups]);

  return {
    groups: visibleGroups,
    filteredGroups,
    search,
    setSearch,
    platform,
    setPlatform,
    sort,
    setSort,
  };
}
