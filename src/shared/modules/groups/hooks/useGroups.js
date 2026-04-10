import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllGroups, getGroups } from "../api/groupApi.js";
import { getPlanById, getServiceById, normalizeServiceId } from "../../../../data/services.config.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { isExploreVisibleGroup } from "../state/groupsSelectors.js";
import { SORT_KEYS } from "../state/groupsTypes.js";

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

async function fetchGroupsByScope(scope, userId) {
  if (scope === "owned" && !userId) return [];
  return scope === "discover" ? getAllGroups() : getGroups(userId);
}

export function useGroups(initialSort = SORT_KEYS.NEWEST, options = {}) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const scope = options.scope ?? "owned";
  const [sourceGroups, setSourceGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState(initialSort);

  const reloadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextGroups = await fetchGroupsByScope(scope, currentUserId);
      setSourceGroups(nextGroups);
      return nextGroups;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, scope]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchGroupsByScope(scope, currentUserId)
      .then((nextGroups) => { if (isMounted) setSourceGroups(nextGroups); })
      .catch(() => {})
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [currentUserId, scope]);

  const visibleGroups = useMemo(
    () =>
      scope === "discover"
        ? sourceGroups.filter((group) => isExploreVisibleGroup(group, currentUserId))
        : sourceGroups,
    [currentUserId, scope, sourceGroups],
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
  }, [platform, search, searchIndex, sort, visibleGroups]);

  return {
    currentUserId,
    groups: visibleGroups,
    filteredGroups,
    isLoading,
    reloadGroups,
    search,
    setSearch,
    platform,
    setPlatform,
    sort,
    setSort,
  };
}
