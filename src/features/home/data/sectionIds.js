// 首頁每個 Section 的 id，順序即畫面上的實際順序。SectionNav.jsx（右側導覽選單）跟
// ScrollCue.jsx（判斷是否捲到最後一節）都要用同一份清單，找同一批 Section 元素，避免
// 各自維護一份、之後新增/刪除 Section 忘記同步更新
export const HOME_SECTION_IDS = [
  'section-hero',
  'section-intro',
  'section-audience',
  'section-identity',
  'section-why-us',
  'section-featured-groups',
  'section-faq',
  'section-cta',
]
