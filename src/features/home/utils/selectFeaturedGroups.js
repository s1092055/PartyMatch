export function selectFeaturedGroups(groups, excludeHostId, limit = 8) {
  const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.hostId !== excludeHostId)
  return [...recruiting]
    .sort((a, b) => {
      const filledA = (a.maxMembers ?? 0) - (a.openSeats ?? 0)
      const filledB = (b.maxMembers ?? 0) - (b.openSeats ?? 0)
      const ratioA = a.maxMembers ? filledA / a.maxMembers : 0
      const ratioB = b.maxMembers ? filledB / b.maxMembers : 0
      if (ratioB !== ratioA) return ratioB - ratioA
      return filledB - filledA
    })
    .slice(0, limit)
}
