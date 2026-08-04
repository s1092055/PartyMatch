# 前端架構

## 技術基礎

- **React 19** + **Vite**（`@vitejs/plugin-react` + `@tailwindcss/vite`，見 `vite.config.js`；沒有額外的 alias 或 proxy 設定）
- **React Router v7**（`react-router-dom` 的 `createBrowserRouter`），路由定義集中於 `src/app/router.jsx`
- 所有頁面元件皆以 `lazy()` + `Suspense` 動態載入（`router.jsx` 的 `routeElement()` helper 統一包裝，fallback 為 `<div className="min-h-screen bg-canvas" />`）
- **Zustand** 管理跨頁面共享狀態（`src/common/stores/`），資料讀取一律走 Store 層模式（見下方「Store 層」一節）
- 進入點 `src/main.jsx` → `src/app/App.jsx`（兩階段初始化見「Store 層」一節）→ `RouterProvider`

---

## 資料夾結構原則：`features/` vs `common/`

```
src/
├── app/           # 路由、路由守衛、啟動流程（不屬於任何 feature）
├── components/ui/ # shadcn/ui 風格的通用元件（Button、Dialog、Select…），見下方「元件分層」一節
├── lib/           # `cn()` helper（clsx + tailwind-merge），供 components/ui/ 與其餘元件組 className
├── features/      # 依「使用者看到的功能」切分，每個 feature 自成一個資料夾
│   └── <feature>/
│       ├── <Feature>Page.jsx 或 <Feature>Modal.jsx   # 該 feature 的進入點
│       ├── components/       # 只給這個 feature 用的子元件
│       ├── hooks/            # 只給這個 feature 用的自訂 hook（非必要，視複雜度而定）
│       └── utils/            # 只給這個 feature 用的純函式
└── common/        # 兩個以上 feature 共用，或不屬於任何特定 feature 的程式碼（不含 ui/，共用 UI 元件統一放 components/ui/，見下方「元件分層」一節）
    ├── api/        # REST API 封裝
    ├── stores/     # Zustand store
    ├── layout/     # 全域版面元件（AppLayout、AppNav、FlowLayout、導覽項目設定 nav.js…）
    ├── data/       # 靜態資料（serviceCatalog）
    └── utils/      # 共用工具函式
```

判斷準則：一個元件/hook/工具函式只被單一 feature 使用 → 留在該 feature 的 `components/`／`hooks/`／`utils/`；被兩個以上 feature 使用，或本身是與具體業務頁面無關的版面骨架 → 移至 `common/`。

`features/` 底下常見的次層結構（非強制，依 feature 複雜度而定）：
- 單頁 feature（如 `explore/`、`favorites/`）：`<Feature>Page.jsx` + `components/`
- 多步驟流程（如 `create/`、`match/`）：`<Feature>Page.jsx` + `components/steps/` 存放各步驟元件
- 雙身分獨立成頁（如 `subscriptions/`、`manage-groups/`）：兩個資料夾各自獨立、互不巢狀，各自擁有自己的 `<Feature>Page.jsx`、`components/`、`hooks/`、`utils/`；曾經合併成單一 `MyGroupsPage.jsx` tab wrapper，後來拆回兩個獨立路由頁面（見 [歷史異動](../history/flows-history.md)）

---

## 元件分層：全部收斂在 `src/components/ui/` 底下

全站共用 UI 元件統一放在單一資料夾 `src/components/ui/`，內部依「有沒有業務邏輯」與「是否為 shadcn/ui 對應元件」分層。這個資料夾原本跟 `src/shared/ui/` 是各自獨立的兩個頂層資料夾，因為「兩個都叫 ui」在瀏覽專案時容易誤以為沒整理乾淨，後來合併成一個（`shared/ui/` 底下的檔案原封不動搬進 `components/ui/`，只調整了引用路徑，元件本身沒有重寫）：

| 層級 | 內容 | 範例 |
|------|------|------|
| `components/ui/`（最外層，shadcn 純元件） | shadcn/ui 風格的通用元件，底層為 Radix UI primitives（`radix-ui` 套件）+ `class-variance-authority` 管理 variant，命名／組合方式對齊 shadcn 官方慣例（如 `Dialog`/`DialogContent`/`DialogHeader` 這種 compound component 寫法），檔名 kebab-case | `button.jsx`、`dialog.jsx`（一般置中 Dialog／堆疊在另一個 Dialog 上方的 `variant="panel"` 次層 Dialog 共用同一組件）、`alert-dialog.jsx`、`avatar.jsx`、`badge.jsx`、`card.jsx`、`drawer.jsx`（`@base-ui/react` 實作，僅通知中心使用）、`input.jsx`（`Input`/`Textarea`，取代舊版 `.field` CSS class）、`progress.jsx`、`slider.jsx`、`switch.jsx`、`sonner.jsx`（toast，取代舊版 `ToastContainer.jsx`） |
| `components/ui/`（最外層，業務組合元件） | 跟上面 shadcn 純元件放在同一層，但綁定特定業務概念（PM幣、信用分數、服務 Logo、確認對話框的倒數規則…），組合 shadcn 純元件實作，檔名 PascalCase 跟純元件的 kebab-case 明確區分 | `TokenAmount.jsx`、`TopupModal.jsx`、`CreditScoreBadge.jsx`、`ServiceLogo.jsx`、`FilterTabsBar.jsx`、`FavoriteToggleButton.jsx`（收藏愛心切換鈕，探索卡片／群組詳情／手機底部操作列共用同一套已收藏/未收藏配色）、`LoginPromptModal.jsx`、`PriceRangeAmount.jsx`、`StatusBadge.jsx`（業務狀態字串 → `Badge` 視覺 variant 的對照層）、`ConfirmActionDialog.jsx`（重要操作確認＋倒數秒數解鎖，包在 `alert-dialog.jsx` 之上） |
| `components/ui/primitives/` | 完全不帶業務邏輯、但沒有對應 shadcn 元件的專案特有通用元件 | `CategoryPills.jsx`、`CountdownText.jsx`、`CredentialWatermark.jsx`、`EmptyState.jsx`、`RevealSection.jsx`、`ScrollHint.jsx`、`StarRating.jsx` |
| `components/ui/group/` | 群組詳情 Modal 家族專用元件，被 `HostGroupView`／`MemberGroupView`／`GroupDetailModal` 三處共用 | `GroupModalShell.jsx`（三層滑動軌道殼）、`GroupViewModal.jsx`（依 `isHost` 分流的薄殼）、`GroupOverviewContent.jsx`、`GroupHistoryModal.jsx`、`GroupModalSideBarItem.jsx` |

新增共用元件時依此準則放置：shadcn 官方有對應元件 → kebab-case 放最外層；完全通用但 shadcn 沒有對應物 → `primitives/`；綁定業務邏輯 → PascalCase 放最外層；群組 Modal 家族專用 → `group/`。

兩個已知例外，維持手刻實作、不強制套用 shadcn：
- 探索頁的服務／金額／排序篩選下拉框（`features/explore/components/FilterSelect.jsx`）：因為 Radix Select 在「同時有多個下拉框」情境下，切換到另一個下拉框需要點兩下才能開啟（`disableOutsidePointerEvents` 內部機制導致），改為自製、不依賴 Radix 的 combobox（含完整鍵盤導覽：方向鍵／Home／End／Enter／Tab／首字快速跳轉），只作為該 feature 的區域元件，不放進 `components/ui/`
- 首頁截圖放大燈箱（`features/home/components/DeviceShowcase.jsx` 的 `Lightbox`）：`Dialog`／`DialogContent` 的內容區固定 `overflow-x-hidden` 並以視窗寬度為準把內容「縮」進去，手機上放大後會跟縮圖一樣大、失去放大意義，改為真正全螢幕、不限制寬度的 `createPortal` 實作

---

## 深色模式（`src/components/theme-provider.jsx`）

`ThemeProvider` + `useTheme()`：預設跟隨系統 `prefers-color-scheme`，使用者在帳號中心「其他設定」手動切換後寫入 `localStorage`（key `pm_theme`），之後優先套用手動設定，不再跟著系統變化；只要沒有手動設定過，系統偏好變動時（例如作業系統排程切換深色模式）會即時反映。

- **切換機制**：class 掛在 `<html>`（`document.documentElement.classList.toggle('dark', ...)`），不是 CSS media query，因為要支援手動覆蓋系統偏好
- **避免閃爍（FOUC）**：`src/main.jsx` 在 `createRoot().render()` 之前，同步讀一次 `localStorage`/系統偏好並掛上 class，不等 React 掛載跟 `ThemeProvider` 的 `useEffect` 才套用，避免深色模式使用者短暫看到亮色畫面再跳深色
- **配色範圍是「實用版」，不是逐一重新設計**：`src/index.css` 的 `:root.dark` 只翻轉中性色階（`canvas`/`surface`/`line`/`ink`/`slate`）跟各狀態色的淺底 chip 色（`*-subtle`/`*-text`），確保可讀性；`danger`/`success`/`warning`/`info` 等狀態「實色」與陰影大致沿用原色碼。`--color-brand` 是唯一額外調整的實色：它同時當背景色（搭白字按鈕）跟文字色（`text-brand` 全站上百處用到）用，深色背景下原本的深藏青文字幾乎看不見；改色時刻意保留品牌色原本的色相（藏青偏青色系），只調高明度/微調飽和度，避免變成一個色相完全不相干、像是換了品牌的顏色
- **已知限制**：全站有少數元件（服務 Logo 白底方塊、裝置外框/首頁截圖燈箱、`Switch`/`Slider` 的圓形把手）刻意維持寫死的白色，這些是設計上就需要固定底色的情境（Logo 需要白底才能正常顯示、把手在任何底色軌道上都要清楚可辨），不是遺漏
- 因為色彩系統本來就是 CSS 變數（`@theme` 產生的 `--color-*` token），`.dark` 底下重新宣告同名變數就能讓全站既有的 `bg-canvas`／`text-ink` 等 utility class 自動套用新值，不需要在每個元件額外加 `dark:` 前綴

---

## Store 層（`common/stores/`）

### 為什麼選 Zustand 不是 Redux 或純 Context

這個專案的 store 本質上是「伺服器資料的記憶體快取」（群組、申請、通知…都是後端資料的本地副本），不是複雜的前端純 UI 狀態機，所以評估點不是「哪個框架功能最完整」，而是「哪個框架跟這種用途最貼合」：

- **對比 Redux**：Redux 的 action/reducer/dispatch 三層樣板碼，是為了讓「狀態怎麼變化」可追蹤、可時間旅行除錯而設計的，這在牽涉複雜使用者互動狀態機（例如編輯器的 undo/redo）時很有價值；但這裡的 store 大多是「呼叫 API → 把回應塞進 state」，額外的樣板碼換不到對應的除錯價值。Zustand 的 `set()` 直接改 state，一個 store 檔案就能看完「有哪些欄位、怎麼變化」，不用在 action type、reducer、selector 三個地方來回找
- **對比純 Context**：Context 適合作用範圍明確、變化不頻繁的狀態（主題、語系），但這裡的 store 資料是**跨頁面共享、且頻繁被多個不相關元件同時讀取**（例如 `groupStore` 同時被探索頁、我的訂閱／群組管理頁、通知點擊導向都要用到）。Context 沒有內建的訂閱粒度控制，任何一個值變化，所有 consume 這個 Context 的元件都會重新渲染；Zustand 的 `useXxxStore(s => s.field)` 讓元件只訂閱自己真正用到的欄位，其他欄位變化不會觸發這個元件重新渲染，不需要額外包 `useMemo`/`useCallback` 或拆多層 Context 來緩解效能問題

10 個 Zustand store，全部透過 `common/api/` 呼叫後端 REST API，採「記憶體快取」模式：

```javascript
init: async () => {
  const data = await readAllRecords()   // GET /api/xxx
  set({ items: data })
}
create: async (payload) => { ... }      // POST /api/xxx，成功後更新本地快取
update: async (id, patch) => { ... }    // PATCH /api/xxx/:id
```

| Store | 對應 REST 資源 | 職責 |
|-------|----------------|------|
| `useAuthStore` | `/auth/*`、`/users/me` | 登入、註冊、登出、更新個人資料、JWT token 管理、觸發兩階段私人 store 初始化 |
| `useServiceStore` | `/services` | 服務清單、方案價格、Logo；API 失敗時 fallback 至 `common/data/serviceCatalog.js` |
| `useGroupStore` | `/groups` | 群組 CRUD、狀態推進、啟用／續訂／結束 |
| `useApplicationStore` | `/applications` | 申請建立與審核狀態 |
| `useMemberStore` | `/members` | 群組成員、付款狀態、移除成員 |
| `useSubscriptionStore` | `/subscriptions` | 成員訂閱、標記付款、確認付款、啟用訂閱 |
| `useNotificationStore` | `/notifications` | 個人通知、系統公告、未讀數；`startPolling(userId)` 每 10 秒輪詢 |
| `useFavoriteStore` | `/favorites` | 收藏群組 |
| `useConversationStore` | `/conversations`（polling） | 對話列表快取、未讀訊息數；每 5 秒輪詢，登出時 `teardown()` |
| `useReviewStore` | `/reviews` | 依 `hostId` 快取團主評價（`byHostId`），`fetchForHost` 防重複請求 |

付款方式（`paymentMethodsApi`）與PM幣餘額／儲值（`tokensApi`）沒有獨立 store，由使用到的元件（`PaymentMethodsTab`、`TopupModal`）直接呼叫 API。

### 兩階段初始化

`App.jsx` 啟動時分兩階段呼叫 store 的 `init()`：

1. **第一階段**（不需 token）：`authStore.init()`、`serviceStore.init()`、`groupStore.init({ all: false })`（訪客只拿招募中群組）、`notificationStore.init()`
2. **第二階段**（僅已登入執行）：`groupStore.init({ all: true })`（換成含全部狀態的群組）、`applicationStore`、`subscriptionStore`、`memberStore`、`favoriteStore`，接著啟動 `conversationStore.init(userId)` 與 `notificationStore.startPolling(userId)`

登入／註冊成功後，`useAuthStore` 呼叫內部的 `initPrivateStores(userId)`，以動態 `import()` 載入第二階段 store 並執行相同初始化，避免 `useAuthStore` 與這些 store 之間形成循環依賴。登出時呼叫 `clearPrivateStores()`：清空 applications/subscriptions/members/favorites、teardown conversation 與 notification 輪詢；`groupStore` 因登入時讀的是全狀態群組，登出不能只清空，必須重新 `init({ all: false })` 換回訪客視角，避免同分頁下一位使用者看到前一位使用者的完整群組列表。

### 跨 Store 同步

`useNotificationStore` 輪詢期間偵測到新的 `member_removed`/`member_left` 通知時廣播 `pm:refresh-member-stores`，偵測到 `new_application` 時廣播 `pm:refresh-application-store`；`App.jsx` 監聽這兩個事件，分別呼叫對應 store 的 `init()` 重新拉取資料。三處輪詢（`useNotificationStore`、`messagesApi` 的 `subscribeToConversations`/`subscribeToMessages`）共用 `src/common/utils/poller.js` 的 `startPolling(pollOnce, intervalMs)` helper。

---

## API 層（`common/api/`）

每個後端資源對應一個 `xxxApi.js` 檔案，只做 REST CRUD 呼叫（不含業務邏輯，業務邏輯留在 store 層）：`applicationsApi.js`、`favoritesApi.js`、`groupsApi.js`、`membersApi.js`、`messagesApi.js`、`notificationsApi.js`、`paymentMethodsApi.js`、`reviewsApi.js`、`servicesApi.js`、`storageApi.js`、`subscriptionsApi.js`、`tokensApi.js`、`usersApi.js`。

`axiosClient.js` 是所有 API 模組共用的 axios instance：
- `tokenManager`：集中管理 `pm_access_token` 的存取（`localStorage`），方便日後改用 httpOnly cookie 時只改這一處
- Request interceptor 自動帶入 `Authorization: Bearer <token>`
- Response interceptor：成功時只回傳 `res.data`；401 且無 token 時靜默拒絕（未登入呼叫受保護端點的預期行為）；401 且有 token 且尚未 retry 時，嘗試以 `pm_refresh_token` 呼叫 `/auth/refresh` 換發新 token 後重放原請求（多個請求同時 401 時以 `_isRefreshing`/`_refreshQueue` 排隊，避免重複 refresh）；refresh 失敗則清除 token 並 `window.location.replace('/login')`

詳細 token 生命週期見 [認證機制文件](./authentication.md)。

---

## Modal 管理：事件驅動 + 共用殼

全域 Modal（群組詳情、訊息中心、PM幣儲值…）不透過 React props 逐層傳遞開啟狀態，而是用 `window.dispatchEvent(new CustomEvent('pm:open-xxx', { detail }))` 觸發，對應 Modal 元件在掛載時 `window.addEventListener('pm:open-xxx', handler)` 監聽。這個模式解決兩個問題：避免跨路由層級傳遞 props，以及 `location.state`/`location.key` 在同一頁面內重複觸發時不可靠的問題。

主要事件：`pm:open-group`（開啟群組詳情）、`pm:open-messages`／`pm:open-dm`（訊息中心）、`pm:open-topup`（PM幣儲值）、`pm:open-notify`（通知面板）；成員異動類事件 `pm:refresh-member-stores`、`pm:refresh-application-store` 則是用於 store 同步而非開啟 Modal。完整事件清單見 [資料庫 Schema 文件](./database-schema.md#事件驅動清單)。

群組詳情 Modal 家族（`GroupDetailModal`／`HostGroupView`／`MemberGroupView`）共用 `components/ui/group/GroupModalShell.jsx` 作為殼：內部是 300% 寬的滑動軌道，支援主面板 → `subPanel`（第二層）→ `subSubPanel`（第三層）三層滑入動畫，取代疊加多個獨立 Modal；殼本身管理 scroll lock 與 Escape 逐層關閉。底層的通用 Dialog 外殼是 `components/ui/dialog.jsx`（Radix Dialog 為基礎的 compound component：`Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogBody`/`DialogFooter`/`DialogCloseButton`），`DialogContent` 支援 `variant="panel"`（z-index 提升至群組詳情 Modal 之上，用於「從另一個 Dialog 疊出的次層 Dialog」情境，例如群組詳情 → 啟用服務／回報問題）；`GroupModalShell` 與其餘一次性 Modal（`ActivateServiceModal`、`RenewalModal`…）皆建立在它之上，header 一律用 `DialogHeader`（icon+標題置左、`DialogCloseButton` 置右）維持視覺一致。

---

## 路由設計

路由定義於 `src/app/router.jsx`，分三大類：

### 1. 公開路由（無需登入）

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 |
| `/explore` | 探索群組 |
| `/groups/:groupId` | 重導至探索頁並開啟群組詳情 Modal |
| `/login`、`/register`、`/forgot-password` | 登入／註冊／忘記密碼，由 `PublicOnlyRoute` 包裹 |
| `/disclaimer`、`/terms`、`/privacy` | 法務頁 |
| `/account` | 帳號中心；訪客也可瀏覽，個人資料相關區塊顯示佔位內容，點擊需登入才能做的操作（如編輯資料、儲值）會跳出登入提示 Toast，不直接導頁 |

`PublicOnlyRoute`（`src/app/PublicOnlyRoute.jsx`）邏輯簡單：已登入直接 `<Navigate to="/" replace />`，否則渲染子路由。

### 2. 需登入路由（`AppLayout` 子路由，含 sidebar/dock）

| 路徑 | 頁面 |
|------|------|
| `/my-subscriptions` | 我的訂閱（成員視角） |
| `/manage-groups` | 群組管理（團主視角） |
| `/my-groups` | 舊版合併頁相容路由，依 `?view=host`／其餘 redirect 到 `/manage-groups`／`/my-subscriptions` |
| `/favorites` | 我的收藏 |

皆巢狀於 `AppLayout` 內，並由 `ProtectedRoute` 包裹。`ProtectedRoute`（`src/app/ProtectedRoute.jsx`）未登入時不直接導頁，而是疊一層「需要登入才能繼續」的確認 Modal，使用者可選擇取消（留在原頁但視為未通過）或前往 `/login`；登入後一律導向首頁（不記住原本想去的頁面）。

### 3. 獨立於 `AppLayout` 之外的全螢幕步驟流程頁

| 路徑 | 頁面 |
|------|------|
| `/create-group` | 建立群組（4 步驟，由頂層 `ProtectedRoute` 包裹） |
| `/quick-match` | 快速搜尋（3 步驟，公開路由，僅在搜尋結果頁點擊申請加入群組時才會被導向登入頁） |

這兩者共用 `common/layout/FlowLayout.jsx` 作為版面殼（無 sidebar/dock，翻書式步驟切換），而非 `AppLayout`。

---

## 導覽列設計（`AppNav`）

`common/layout/AppNav.jsx` 依裝置寬度切換成兩套完全不同的 UI（拆成獨立元件，不是同一份 markup 用 CSS 調整外觀），切換點是 `lg:`（1280px）而不是 `md:`（768px）——因為桌機版 sidebar 靠 `:hover`／`:focus-within` 展開顯示文字標籤，iPad（不論直向 768px+ 或橫向 1024px+）雖然寬度落在 `md` 區間，但是觸控裝置沒有真正的 hover，若切換點設在 `md:` 會讓 iPad 顯示出永遠收合、看不到文字標籤的側邊欄（見 [歷史異動](../history/flows-history.md)）：

- **桌機版**（≥1280px，`DesktopSidebar.jsx`）：左側浮動 sidebar，預設收合為 icon bar，hover/focus-within 展開顯示文字標籤；右上角固定通知按鈕與 PM幣餘額顯示；sidebar 底部是使用者頭像按鈕（點擊直接導向 `/account`），信用分數以按鈕形式疊在頭像右側。
- **手機與平板版**（<1280px，含 iPad）：頂部 `MobileHeader.jsx`（Logo + 通知 + 頭像／登入按鈕，點頭像展開 dropdown）+ 底部 `MobileDock.jsx`（快速搜尋、建立群組、探索置中圓形按鈕、我的 dropdown、訊息），往下捲動時 Dock 會滑出隱藏、往上捲或接近頁面頂端時顯示；這一版全部靠點擊觸發，文字標籤本來就一直可見，不受觸控裝置無法 hover 影響。

未登入時，需要登入才能用的項目會顯示鎖頭圖示，點擊觸發 `preventLockedAction`（提示前往登入，不直接導頁）。

---

## 大型元件的拆分方式

幾個核心 orchestrator 元件（管 state/effects/handler）把 UI 拆給子元件或 panel builder，子元件多以明確參數傳入取代閉包依賴：

| Orchestrator | 拆分方式 |
|---------|---------|
| `common/layout/AppNav.jsx` | 桌機 sidebar / 手機 header / 手機 dock 各自獨立元件 |
| `features/manage-groups/ManageGroupsPage.jsx` | 抽出 `hooks/useHostActions.js` 自訂 hook |
| `features/manage-groups/components/HostGroupView.jsx` | 4 個 panel builder（成員/申請/審核紀錄/收款） |
| `features/messages/components/ChatWindow.jsx` | 抽出 `useParticipantNames`/`useMessageScroll` hook + `MessageBubble`/`ChatMembersPanel` 元件 |
| `features/group/GroupDetailModal.jsx` | 抽出 `ApplyModal`/`HostReviews` 元件與 panel builder |

判斷該不該拆不是看行數，是看有沒有清楚的職責邊界；拆完要避免 props drilling，狀態留在 orchestrator，子元件盡量做成 presentational。更完整的討論見 [專案亮點](../portfolio/project-highlights.md)。
