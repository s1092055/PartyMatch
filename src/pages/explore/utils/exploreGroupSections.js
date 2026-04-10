import { SERVICES, getServiceCategoryById } from "../../../data/services.config.js";

function getExploreSectionScore(group) {
  const remaining = Math.max(0, (group.totalSlots ?? 0) - (group.takenSlots ?? 0));
  const recency = new Date(group.createdAt ?? 0).getTime() || 0;

  return (
    (group.tags?.includes("熱門") ? 20 : 0) +
    (group.status === "almost_full" ? 12 : 0) +
    (group.status === "open" ? 8 : 0) +
    (remaining === 1 ? 10 : 0) +
    (remaining > 1 ? 4 : 0) +
    recency / 1000000000000
  );
}

export function buildExploreGroupSections(groups) {
  const groupsByService = groups.reduce((map, group) => {
    const serviceId = group.serviceId ?? "unknown";
    if (!map.has(serviceId)) {
      map.set(serviceId, []);
    }
    map.get(serviceId).push(group);
    return map;
  }, new Map());

  return SERVICES
    .map((service, index) => {
      const serviceGroups = groupsByService.get(service.id) ?? [];
      if (!serviceGroups.length) return null;

      return {
        layoutIndex: index,
        serviceId: service.id,
        serviceLabel: service.name,
        serviceShortLabel: service.shortLabel ?? service.name,
        categoryLabel: getServiceCategoryById(service.category)?.label ?? "訂閱共享",
        description: service.description,
        iconKey: service.brand ?? service.id,
        groups: [...serviceGroups].sort((a, b) => getExploreSectionScore(b) - getExploreSectionScore(a)),
      };
    })
    .filter(Boolean);
}
