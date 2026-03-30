import { SERVICES } from "../../../../data/services.config.js";

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
    .map((service) => {
      const serviceGroups = groupsByService.get(service.id) ?? [];
      if (!serviceGroups.length) return null;

      return {
        serviceId: service.id,
        serviceLabel: service.name,
        serviceShortLabel: service.shortLabel ?? service.name,
        groups: serviceGroups,
      };
    })
    .filter(Boolean);
}
