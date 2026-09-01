export const GROUP_AGE_LABEL = { any: '不限', new: '三個月內', established: '三個月至一年', veteran: '一年以上' }

export function getMatchSummaryRows({ filtersChosen, keyword, minRating, groupAge }) {
  return {
    keywordText: filtersChosen && keyword?.trim() ? keyword.trim() : '未輸入',
    keywordMuted: !filtersChosen || !keyword?.trim(),
    ratingText: !filtersChosen ? '尚未選擇' : minRating > 0 ? `${minRating} 分以上` : '不限',
    ratingMuted: !filtersChosen || minRating === 0,
    groupAgeText: filtersChosen ? (GROUP_AGE_LABEL[groupAge] ?? '不限') : '尚未選擇',
    groupAgeMuted: !filtersChosen || groupAge === 'any',
  }
}
