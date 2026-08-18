// 首頁每個整頁 Section 的 id，順序即畫面上的實際順序。SectionNav.jsx（右側導覽選單）跟
// HomePage.jsx（捲動吸附）都要用同一份清單，找同一批 Section 元素，避免兩邊各自維護
// 一份、之後新增/刪除 Section 忘記同步更新其中一邊
export const HOME_SECTION_IDS = [
  'section-hero',
  'section-why-us',
  'section-audience',
  'section-featured-groups',
  'section-benefits',
  'section-identity',
  'section-cta',
  'section-faq',
]
