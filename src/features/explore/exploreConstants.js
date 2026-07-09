export const DEFAULT_FILTERS = {
  category: 'all',
  service:  'all',
  maxPrice: 'any',
  sortBy:   'recommended',
}

export const PRICE_OPTIONS = [
  { value: 'any',  label: '不限價格' },
  { value: '100',  label: 'NT$100 以下' },
  { value: '150',  label: 'NT$150 以下' },
  { value: '200',  label: 'NT$200 以下' },
]

export const SORT_OPTIONS = [
  { value: 'recommended', label: '最新上架' },
  { value: 'rating',      label: '評分最高' },
  { value: 'price_asc',   label: '價格最低' },
  { value: 'seats',       label: '名額快滿' },
]
