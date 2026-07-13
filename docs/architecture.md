# 架構與資料層

## 架構分層

```
React 19 + React Router v7
          │
    Feature Modules (src/features/)     ← UI 與頁面
          │
    Shared Stores (src/shared/stores/)  ← 記憶體快取 + 業務邏輯
          │
    API Layer (src/shared/api/)         ← REST API 封裝（axios）
          │
  Express 後端 (server/src/)
          │
    MySQL（Prisma ORM）+ Redis（快取 / Session）
```

讀取走 Store（同步），寫入走 API（非同步）。App 啟動時的兩階段初始化見下方「Store 設計」。

---

## 資料夾結構

```txt
src/
├── main.jsx                    # React app 進入點
├── index.css                   # Tailwind v4 theme tokens 與 component primitives
├── app/
│   ├── App.jsx                 # 兩階段初始化 stores 並掛載 RouterProvider
│   ├── ProtectedRoute.jsx      # 需登入路由守衛
│   ├── PublicOnlyRoute.jsx     # 已登入則重導的路由守衛
│   ├── redirects.jsx           # Modal 型路由重導
│   └── router.jsx              # React Router 設定
├── assets/                     # Logo 與本地服務 icon（KKBOX、masterclass PNG）
├── features/
│   ├── account/                # 帳號中心
│   │   ├── AccountPage.jsx
│   │   └── components/
│   │       ├── AccountSidebar.jsx
│   │       ├── ProfileHeaderCard.jsx
│   │       └── tabs/
│   │           ├── NotificationTab.jsx
│   │           ├── PaymentMethodsTab.jsx
│   │           ├── PersonalInfoTab.jsx
│   │           ├── SecurityTab.jsx
│   │           └── SettingsTab.jsx
│   ├── auth/                   # 登入、註冊、忘記密碼
│   │   ├── components/
│   │   │   ├── AuthIllustration.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── forgot-password/
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── login/
│   │   │   └── LoginPage.jsx
│   │   └── register/
│   │       └── RegisterPage.jsx
│   ├── create/                 # 建立群組（全螢幕步驟流程頁，/create-group）
│   │   ├── CreateGroupPage.jsx
│   │   └── components/
│   │       ├── LivePreviewPanel.jsx
│   │       └── steps/
│   │           ├── Step1Service.jsx
│   │           ├── Step2PlanSettings.jsx
│   │           └── Step3Preview.jsx
│   ├── explore/                # 探索群組
│   │   ├── ExplorePage.jsx
│   │   └── components/
│   │       ├── ExploreGroupCard.jsx
│   │       └── FilterBar.jsx
│   ├── favorites/              # 我的收藏
│   │   └── FavoritesPage.jsx
│   ├── group/                  # 群組詳情與申請加入
│   │   ├── GroupDetailModal.jsx
│   │   └── components/
│   │       └── ApplyJoinModal.jsx
│   ├── home/                   # 首頁
│   │   ├── HomePage.jsx
│   │   ├── components/
│   │   │   ├── ExtraFeatures.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── FeatureCards.jsx
│   │   │   ├── HostGuide.jsx
│   │   │   └── HowItWorks.jsx
│   │   └── data/
│   │       └── homeContent.js
│   ├── legal/                  # 法務頁
│   │   ├── DisclaimerPage.jsx
│   │   ├── PrivacyPage.jsx
│   │   └── TermsPage.jsx
│   ├── my-groups/              # 我的群組（成員 + 團主合併頁）
│   │   └── MyGroupsPage.jsx   # tab wrapper；?view=member / ?view=host 切換子頁面
│   ├── manage/                 # 團主管理（團主邏輯，內嵌於 my-groups host tab）
│   │   ├── ManagePage.jsx
│   │   ├── components/
│   │   │   ├── ActivateGroupModal.jsx
│   │   │   ├── ActivateServiceModal.jsx
│   │   │   ├── ApplicationsModal.jsx
│   │   │   ├── ApplicationsTab.jsx
│   │   │   ├── GroupHistoryModal.jsx
│   │   │   ├── HostGroupView.jsx      # 團主視角群組 Modal
│   │   │   ├── HostedGroupCard.jsx
│   │   │   ├── RenewalModal.jsx
│   │   │   ├── ReportPaymentModal.jsx
│   │   │   └── ReportServiceIssueModal.jsx
│   │   ├── data/
│   │   │   └── paymentIssueTypes.js
│   │   └── utils/
│   │       └── groupActionMap.js
│   ├── match/                  # 快速搜尋（全螢幕步驟流程頁，/quick-match）
│   │   ├── QuickMatchPage.jsx
│   │   └── components/
│   │       ├── MatchConditionBar.jsx
│   │       ├── MatchSummaryPanel.jsx
│   │       ├── ServiceSelectionGrid.jsx
│   │       └── steps/
│   │           ├── Step1Services.jsx
│   │           ├── Step2Plans.jsx
│   │           ├── Step3Filters.jsx
│   │           └── Step4Results.jsx
│   ├── messages/               # 訊息中心
│   │   ├── MessagesModal.jsx   # 狀態管理與 orchestration
│   │   ├── utils.js            # formatTime 共用工具
│   │   └── components/
│   │       ├── ChatWindow.jsx
│   │       ├── ConversationAvatar.jsx
│   │       ├── ConversationList.jsx
│   │       └── ConversationMenu.jsx
│   └── subscriptions/          # 成員訂閱（成員邏輯，內嵌於 my-groups member tab）
│       ├── SubscriptionsPage.jsx
│       └── components/
│           ├── MemberGroupView.jsx    # 成員視角群組 Modal
│           └── SubscriptionCard.jsx
├── shared/
│   ├── api/                    # REST API 封裝（axios）
│   │   ├── axiosClient.js      # axios instance + JWT interceptor
│   │   ├── applicationsApi.js
│   │   ├── favoritesApi.js
│   │   ├── groupsApi.js
│   │   ├── membersApi.js
│   │   ├── messagesApi.js
│   │   ├── notificationsApi.js
│   │   ├── servicesApi.js
│   │   ├── storageApi.js
│   │   ├── subscriptionsApi.js
│   │   └── usersApi.js
│   ├── constants/              # nav 等常數
│   │   └── nav.js
│   ├── data/
│   │   └── serviceCatalog.js   # 30 種訂閱服務定義（API 失敗時的 fallback）
│   ├── layout/                 # 全域版面元件
│   │   ├── AppFooter.jsx
│   │   ├── AppLayout.jsx
│   │   ├── AppNav.jsx
│   │   ├── FloatingMessages.jsx
│   │   ├── PageHeader.jsx
│   │   └── ScrollToTop.jsx
│   ├── stores/                 # 前端業務邏輯與資料快取（Zustand）
│   │   ├── useApplicationStore.js
│   │   ├── useAuthStore.js
│   │   ├── useConversationStore.js
│   │   ├── useFavoriteStore.js
│   │   ├── useGroupStore.js
│   │   ├── useMemberStore.js
│   │   ├── useNotificationStore.js
│   │   ├── useServiceStore.js
│   │   └── useSubscriptionStore.js
│   ├── ui/                     # 共用 UI 元件
│   │   ├── Avatar.jsx
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── CategoryPills.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── CountdownConfirmDialog.jsx
│   │   ├── CreditScoreBadge.jsx
│   │   ├── CustomSelect.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FilterTabsBar.jsx
│   │   ├── GroupModalShell.jsx
│   │   ├── GroupOverviewContent.jsx
│   │   ├── GroupViewModal.jsx
│   │   ├── LoginPromptModal.jsx
│   │   ├── Modal.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── RevealSection.jsx
│   │   ├── ServiceLogo.jsx
│   │   ├── Tabs.jsx
│   │   ├── ToastContainer.jsx
│   │   ├── Toggle.jsx
│   │   └── TokenAmount.jsx     # PM 代幣金額顯示（TokenBadge + TokenAmount）
│   └── utils/                  # 工具函式
│       ├── creditScore.js
│       ├── date.js
│       ├── groupDisplay.js
│       ├── hooks.js
│       ├── modelNormalizers.js
│       ├── pricingUtils.js
│       ├── searchUtils.js
│       ├── serviceUtils.js
│       ├── storage.js
│       ├── subscriptionStatus.js
│       └── toast.js
```

---

## Store 設計

App 啟動時分兩階段初始化（`App.jsx`）：

**第一階段**（不需 token，公開資料）：`authStore`、`serviceStore`、`groupStore`、`notificationStore`

**第二階段**（已登入才執行）：`applicationStore`、`subscriptionStore`、`memberStore`、`favoriteStore`、`conversationStore`

登入 / 註冊成功後，`authStore` 呼叫 `initPrivateStores()` 動態 import 並初始化第二階段 stores，避免循環依賴。

```javascript
// Store 基本結構
init: async () => {
  const data = await readAllRecords()   // GET /api/xxx
  set({ items: data })
}
```

| Store | REST 端點 | 主要職責 |
|-------|-----------|----------|
| `useAuthStore` | `/auth/*`、`/users/me` | 登入、註冊、登出、更新個人資料、JWT token 管理 |
| `useServiceStore` | `/services` | 30 種服務清單、方案價格、Logo；API 失敗時 fallback 本地 catalog |
| `useGroupStore` | `/groups` | 群組 CRUD、狀態推進、啟用 / 續訂 / 結束 |
| `useApplicationStore` | `/applications` | 申請建立與審核狀態 |
| `useMemberStore` | `/members` | 群組成員、付款狀態、移除成員 |
| `useSubscriptionStore` | `/subscriptions` | 成員訂閱、標記付款、確認付款、啟用訂閱 |
| `usePaymentStore` | `/payments` | 付款紀錄統計 |
| `useNotificationStore` | `/notifications` | 個人通知、公開系統公告、未讀數；`startPolling(userId)` 每 10 秒輪詢，偵測到新 `member_removed`/`member_left` 時廣播 `pm:refresh-member-stores`，偵測到新 `new_application` 時廣播 `pm:refresh-application-store` |
| `useFavoriteStore` | `/favorites` | 收藏群組 |
| `useConversationStore` | `/conversations`（polling） | 對話列表快取、計算未讀訊息數；每 5 秒輪詢；登出時 `teardown()` |

---

## 主要檔案連動

| 主要檔案 | 連動對象 | props / event / function |
|----------|----------|--------------------------|
| `src/app/App.jsx` | `router.jsx`、所有 Store | 兩階段初始化；未登入只載入公開資料，避免呼叫受保護端點；監聽 `pm:refresh-member-stores`（成員異動後同步 group/member/subscription/application）與 `pm:refresh-application-store`（新申請到達後同步申請資料） |
| `src/app/router.jsx` | `AppLayout`、`ProtectedRoute`、`PublicOnlyRoute`、`redirects.jsx`、`CreateGroupPage`、`QuickMatchPage` | 定義公開頁、`AppLayout` 內的受保護頁、Modal 型 redirect route；`/create-group`、`/quick-match` 是獨立於 `AppLayout` 之外、由頂層 `ProtectedRoute` 包裹的全螢幕頁面 |
| `src/shared/api/axiosClient.js` | 所有 API 模組 | 自動帶 JWT header；401 + 有 token 時跳登入；無 token 的 401 靜默處理 |
| `src/shared/layout/AppLayout.jsx` | `AppNav`、`AppFooter`、`FloatingMessages`、`MessagesModal`、`GroupDetailModal` | 統一掛載跨頁共用導覽、全域 Modal 與頁尾；主要內容容器於 `lg:` 以上寬度用 `clamp()` 取代固定 `max-w-7xl`，避免超寬螢幕（>1280px）留白暴增 |
| `src/shared/layout/FlowLayout.jsx` | `CreateGroupPage`、`QuickMatchPage` | 無 sidebar/dock 的全螢幕步驟流程殼：左上角 PartyMatch logo（一般 `<a href="/">`，非 `navigate()`，點擊回首頁會觸發整頁重新載入）、頂部細進度條、置中標題（absolute 定位，不受左右內容寬度不對稱影響）、固定高度 header/footer（`h-16`/`md:h-20`）、內容區 `min-h-0 + overflow-hidden` 搭配子層各自 `overflow-y-auto`，避免頁面本身垂直捲動、底部固定 Prev/Next 導覽列；容器寬度於 `lg:` 以上用 `clamp()` 隨螢幕寬度連續放大（非固定 `max-w`），避免超寬螢幕留白暴增 |
| `src/shared/utils/hooks.js`（`useScrollEdge`） | `CreateGroupPage`、`QuickMatchPage`、`Step2PlansAndFilters` | 共用捲動邊界偵測 hook：回報 `canScroll`/`atBottom`，並提供 `scrollToTop`/`scrollDown` 控制函式；可選 `withMutationObserver` 監看內容子樹異動。`CreateGroupPage` 僅在第 3 步（確認送出）依 `!canScroll` 切換 `lg:justify-center`，第 2 步（方案與設定）固定頂部對齊——因為該步驟的群組規則列表可動態增減，若隨 `canScroll` 切換置中會在新增規則跨過捲動門檻時造成整體內容跳動 |
| `src/shared/ui/ScrollHintButton.jsx` | `CreateGroupPage`、`QuickMatchPage`、`Step2PlansAndFilters` | 共用浮動捲動提示按鈕，取代原本三處重複的 chevron 按鈕實作 |
| `src/shared/layout/AppNav.jsx` | `NAV_SECTIONS`、`authStore`、`notificationStore`、`conversationStore`、`toast` | **桌機版**：左側 sidebar（白底，收合 64px / 展開 224px，hover/focus-within 觸發）；通知與訊息為長型矩形按鈕（附文字標籤）；sidebar 底部使用者按鈕上方顯示 PM 幣餘額列（收合隱藏、展開顯示，含加值按鈕）；頭像按鈕點擊直接導向 `/account`（不經中間選單），開啟 PM 儲值 Modal 時 blur 讓 sidebar 自動收合。**手機版**：頂部 header（Logo + 通知 + 頭像按鈕；未登入時頭像按鈕為純圖示無底色）+ 底部 Dock（快速搜尋、建立群組、探索中央圓形按鈕、我的 dropdown、訊息）；「我的」向上展開橫排 dropdown（我的群組 / 我的收藏）；未登入點擊鎖定項目發 Toast（附「前往登入」按鈕）；Dock 透過 `useHideOnScroll`（`shared/utils/hooks.js`）往下捲動時滑出隱藏、往上捲或接近頁面頂端時顯示，`ScrollToTop` 按鈕位置隨 Dock 顯示狀態連動避免重疊；監聽 `pm:open-topup` 事件開啟 `TopupModal`（供其他元件如 `GroupDetailModal` 在代幣不足時，透過 toast 的 `action` 按鈕觸發儲值） |
| `src/shared/layout/FloatingMessages.jsx` | `notificationStore`、`conversationStore`、`applicationStore` | 監聽 `pm:open-notify` 顯示通知 panel；通知點擊後依類型 dispatch 對應 `pm:open-*` 事件；`new_application` 點擊時先 await `applicationStore.init()` 再開 Modal，確保資料已更新；`member_left`（成員退出）host 端點擊前廣播 `pm:refresh-member-stores` |
| `src/shared/ui/GroupModalShell.jsx` | `GroupOverviewContent`、`Badge`、`ProgressBar`、`ServiceLogo` | 三個群組詳情 Modal 共用的滑動軌道殼（300% 寬、三層 panel）；`subPanel` 滑入第二層、`subSubPanel` 滑入第三層，支援 `headerRight` slot；管理 scroll lock、Escape 逐層關閉 |
| `src/features/group/GroupDetailModal.jsx` | `GroupModalShell`、`favoriteStore`、`applicationStore` | 接收 `pm:open-group`；依使用者狀態顯示申請、收藏、付款 CTA；申請加入流程以 `subPanel` 翻書動畫呈現（填寫留言 → 送出成功兩格水平滑動），不再開啟獨立 Modal |
| `src/shared/ui/GroupViewModal.jsx` | `HostGroupView`、`MemberGroupView` | 薄殼：依 `isHost` 決定渲染 HostGroupView 或 MemberGroupView |
| `src/features/manage/components/HostGroupView.jsx` | `GroupModalShell`、子 Modal | 團主視角；成員名單（含移除成員）、申請管理（僅待審核）→ 審核紀錄（第三層 panel，含篩選）/ 收款管理（收款階段）、啟用 CTA |
| `src/features/subscriptions/components/MemberGroupView.jsx` | `GroupModalShell`、`CombinedServicePaymentModal` | 成員視角；填寫帳號 + 上傳憑證合併為單步驟 Modal |
| `src/features/messages/MessagesModal.jsx` | `conversationStore`、`messagesApi`、`ConversationList`、`ChatWindow` | 接收 `pm:open-messages` / `pm:open-dm`；透過 `subscribeToMessages` polling 同步訊息 |
| `src/shared/stores/*` | `src/shared/api/*`、`src/shared/utils/*` | Stores 保存前端快取並封裝業務流程，api 只做 REST CRUD |

---

## 路由

### 公開頁面

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 Landing Page |
| `/explore` | 探索群組 |
| `/explore?category=streaming&service=netflix&maxPrice=150&sortBy=rating` | 探索群組（含分類 / 價格 / 排序篩選，狀態存於 URL query params） |
| `/groups/:groupId` | 群組詳情重導（轉到探索頁並開啟 Modal） |
| `/login` | 登入（PublicOnlyRoute） |
| `/register` | 註冊（PublicOnlyRoute） |
| `/forgot-password` | 忘記密碼（PublicOnlyRoute） |
| `/disclaimer` / `/terms` / `/privacy` | 法務頁 |

### 需登入頁面（`AppLayout` 子路由，含 sidebar/dock）

| 路徑 | 頁面 |
|------|------|
| `/my-groups` | 我的群組（`?view=member` 成員訂閱、`?view=host` 團主管理） |
| `/my-subscriptions` | redirect → `/my-groups?view=member` |
| `/manage-groups` | redirect → `/my-groups?view=host` |
| `/favorites` | 我的收藏 |
| `/account` | 帳號中心 |

### 需登入頁面（獨立於 `AppLayout` 之外，無 sidebar/dock 的全螢幕流程）

| 路徑 | 頁面 |
|------|------|
| `/create-group` | 建立群組（3 步驟：選服務 → 方案與設定 → 確認送出，+ 成功畫面，`key={step}` 重新掛載 + CSS slide-up 動畫） |
| `/quick-match` | 快速搜尋（3 步驟：選擇服務 → 方案與條件 → 配對結果，`key={step}` 重新掛載 + CSS slide-up 動畫） |

---

## 共用 UI 元件

| 元件 | 用途 |
|------|------|
| `AppNav` | 桌機側欄（含頭像 Modal）、手機 Header（含頭像 dropdown）+ 底部 Dock、通知 / 訊息圓形按鈕、未讀 badge |
| `Modal` | 通用 Modal 外殼；支援 `sub` prop（子 modal 模式，z-index 提升、左上角返回鍵）；`isOpen` 為 undefined 時為非受控模式 |
| `GroupModalShell` | 探索、管理、訂閱三處共用的滑動軌道殼；`subPanel`（第二層）+ `subSubPanel`（第三層）prop 實現翻書滑動動畫；支援各層 `headerRight` slot |
| `FilterTabsBar` | 我的群組（成員 / 團主）頁面的分頁篩選列；手機版為 `CustomSelect` dropdown，桌機版為左側垂直 nav（樣式比照帳號設定頁的左側選單：`bg-brand-subtle text-brand` 表示選中），`ManagePage`／`SubscriptionsPage` 用 `md:flex` 把這個左側 nav 跟右側的群組/訂閱卡片 grid 排成左右兩欄，右側 grid 固定 `md:grid-cols-2`（不再依 `lg:` 加到 3 欄）；成員端分頁為「全部 / 處理中 / 啟用中 / 即將續訂 / 已結束」（「已結束」取代舊版「申請紀錄」分頁）；篩選後當前分類無資料時僅顯示提示文字，不提供「清除篩選」等跳回其他分頁的操作 |
| `ToastContainer` / `toast.js` | 全域提示訊息（含 `aria-live="polite"` 無障礙支援） |
| `ServiceLogo` | 依 serviceId 顯示本地或服務資料中的 Logo |

---

## 元件拆分

原本 5 個 600 行以上的大型元件已拆分為「orchestrator（state/effects/handler）+ 純 UI 子元件或 panel builder」的結構，子元件多以明確參數傳入取代閉包依賴：

| 原始檔案 | 行數變化 | 拆分方式 |
|---------|---------|---------|
| `shared/layout/AppNav.jsx` | 624 → 160 | 桌機 sidebar / 手機 header / 手機 dock 各自獨立元件 |
| `features/manage/ManagePage.jsx` | 619 → 126 | 抽出 `hooks/useManageActions.js` 自訂 hook |
| `features/manage/components/HostGroupView.jsx` | 625 → 297 | 4 個 panel builder（成員/申請/審核紀錄/收款） |
| `features/messages/components/ChatWindow.jsx` | 546 → 174 | 抽出 `useParticipantNames`/`useMessageScroll` hook + `MessageBubble`/`ChatMembersPanel` 元件 |
| `features/group/GroupDetailModal.jsx` | 545 → 256 | 抽出 `ApplyModal`/`HostReviews` 元件與 panel builder |

---

## 認證機制

- JWT accessToken + refreshToken 雙 token 設計
- accessToken 存於 `localStorage`，每次 request 自動帶入 `Authorization: Bearer` header
- 收到 401 且有 token 時自動導向 `/login`（session 過期）
- 未登入呼叫受保護端點的 401 靜默處理（不跳轉、不報錯）

---

## 成員異動規則

`recruiting` / `full` 狀態下，成員可自行退出、團主可移除成員：後端刪除 member 記錄、將 application 標為 `left` / `removed`、subscription 一併刪除，名額釋出（`full` 退回 `recruiting`）；被移除或自行退出的申請狀態允許再次申請同一群組。進入 `pending_confirmation` 後成員名單不可再變動，前後端均設有狀態守衛。

---

## 導覽設計

- **桌機版**：左側 floating sidebar，收合為 64px icon bar，hover 展開至 224px 顯示文字標籤；sidebar 底部使用者按鈕上方顯示 PM 幣餘額（含加值按鈕），收合時隱藏、展開後顯示；頭像按鈕點擊直接導向 `/account`（不再彈出中間 Modal），登出改為帳號設定頁底部的按鈕；開啟 PM 儲值 Modal 時，sidebar 自動收合（blur 移走焦點）。
- **手機版**：頂部 header + 底部 Dock；頂部右側以頭像取代漢堡選單，點擊展開 dropdown（頭像+名稱置中、帳號設定與登出左右並排）；未登入時顯示 UserCircle2 icon 點擊導向登入頁。底部 Dock 由左至右：快速搜尋、建立群組、探索（中央圓形主按鈕）、我的（dropdown：我的群組 + 我的收藏）、訊息。

---

## 帳號設定

帳號設定頁（`/account`）分頁包含：**個人資料**（基本資訊編輯）、**付款設定**（付款方式管理 + 交易紀錄）、**通知偏好**（開發中）、**安全驗證**（開發中）、**其他設定**（一般偏好、隱私設定、刪除帳號），管理員另有**管理員**分頁。付款方式最多儲存 2 種，存於後端 MySQL（`payment_methods` table）。PM 幣加值與交易紀錄整合於 TopupModal 的雙面板設計——主面板儲值、子面板查看交易紀錄，兩者以滑動動畫切換。桌機版為左右 sidebar 分頁佈局：右側內容區為固定高度（`calc(100vh - 16rem)`）容器，分頁內容過長時僅內部垂直捲動，登出按鈕（`AccountPage.jsx` 的 `LogoutButton`）固定顯示在該容器最底部、靠右對齊、brand 底色白字（不再收在「其他設定」分頁內）；手機版為 accordion 展開收合，登出按鈕同樣獨立置於 accordion 最底部，樣式與桌機版共用。頂部 `ProfileHeaderCard` 將信用分數（`CreditScoreBadge`）與「查看紀錄」按鈕移至卡片右側，點擊開啟信用分數異動紀錄 modal（目前為空狀態佔位，資料層尚未建立，見信用分數系統規劃）。

---

## 我的群組統計

`/my-groups` 頁面頂部的統計卡三個項目皆為下方 `FilterTabsBar` 分類數量看不到的資訊（避免與 chip 數字重複），依目前分頁（`?view=member` / `?view=host`）切換內容：**身為成員**「本月訂閱花費 / 平均每組 / 本月省下」（省下金額 = 反查 `serviceCatalog` 方案原價 − 實際分攤後的 `pricePerSeat`，年繳方案換算為月均後比較，邏輯在 `src/shared/utils/pricingUtils.js`）；**身為團主**「本月預估收入 / 平均每組 / 服務中成員」（純數量，不套用 PM 幣圖示）。統計卡寬度與下方 `FilterTabsBar`／內容區左右對齊（無額外 `max-width` 限制），手機／桌機皆全寬。

**switcher 按鈕**：手機版與桌機版是兩套完全不同的 UI（分別各自的 JSX block，`md:hidden` / `hidden md:flex` 切換），不是同一份 markup 用 CSS 調整外觀。**手機版**維持最原始的版本：「我是成員」「我是團主」左右並排兩顆 `flex-1` 全寬按鈕，點哪顆就直接切到那個分頁。**桌機版**則是單一 `bg-brand` 填色 pill（一次只顯示目前身分），pill 本身就是一顆 `<button onClick={toggleTab}>`：預設顯示 icon + 目前身分文字，hover 整個 pill 時改用絕對定位疊一層「切換身分」提示文字＋`ArrowLeftRight` icon（兩層用 `opacity` 淡入淡出交叉，`group-hover:opacity-0` / `group-hover:opacity-100`），點擊（不限游標位置，整個 pill 都可點）直接 toggle 到另一個身分 `?view=member`／`?view=host`。切換時只有預設層裡的文字（`key={activeView}` + `.animate-fade-in-up`，純 opacity 淡入）會重新播放動畫，pill 外框、底色都不跟著移動或重繪，避免整個按鈕跳動。不再帶分類篩選功能（曾經做過 hover 展開分類 dropdown、以及左右滑動切換的版本，因體驗不佳已移除）。桌機版 pill 與統計卡排成同一列（`md:flex md:items-stretch`）：pill 所在的欄寬度固定 `md:w-40` 對齊下方 `FilterTabsBar` 左側 nav 的寬度；**pill 本身刻意不設 `h-full`**，讓 flexbox 預設的 `align-items: stretch` 自然撐開（曾經在 pill 跟外層 wrapper 上明寫 `md:h-full`，結果對一個高度為 auto 的 flex row 而言，明寫的 `height:100%` 反而讓瀏覽器略過 stretch、退回內容自身高度，兩邊高度因此對不齊——移除顯式高度後才真正吃到 stretch 對齊右欄統計卡）；統計卡為右欄 `md:flex-1`。分類篩選改採 `FilterTabsBar` 桌機版的左側垂直 nav（見上）。統計卡內距 `py-7`（原本 `py-4`），讓整列高度更高；統計卡的 `AmountStatItem` 改用 `TokenAmount` 預設的 `align="baseline"`（不再傳 `align="center"`），移除原本 `leading-none` 造成的行高差異，讓金額項目跟純數字的 `CountStatItem`（如「服務中成員」）高度與間距一致。

切換身分時，統計卡內每個項目的文字（`AmountStatItem`/`CountStatItem` 內層包一個 `key={activeView}` + `.animate-step-slide-up` 的 wrapper，divide-x 仍作用在最外層維持分隔線）與下方 `FilterTabsBar` 左側 nav（`<nav>` 直接套用 `.animate-step-slide-up`，靠 `ManagePage`/`SubscriptionsPage` 整頁 remount 觸發，切換分類 tab 不會重播）都會一起播放淡入＋輕微上移的動畫，呼應右上角切換 icon 的操作回饋。

---

## 探索篩選與搜尋

探索頁以 **URL query params 為唯一狀態來源**：`ExplorePage` 直接從 `useSearchParams()` 衍生篩選物件（無獨立 `filters` state；`category`/`service`，`maxPrice`/`sortBy` 保留給 `applyFilters` 當預設值與 URL 深連結相容，但 `FilterBar` 已移除價格上限與排序的 `CustomSelect` UI，僅保留分類 `CategoryPills`），`handleFilterChange` 呼叫 `navigate(..., { replace: true })` 更新 URL；桌機版分類 pills 左右各有箭頭按鈕可平滑捲動。

---

## 跨元件通訊

全域 Modal 透過 `window.dispatchEvent` 以 `pm:open-*` 事件驅動，避免 React props 層層傳遞，也解決 `location.state` 在同頁面不可靠的問題。成員異動事件（退出、被移除）透過 `pm:refresh-member-stores` 事件通知 App.jsx 同步所有相關 Store。完整事件清單見 [資料庫 Schema 文件](database-schema.md#事件驅動清單)。

---

## 技術亮點（實作細節）

### 完整端對端資料流

申請 → 審核 → 成員建立 → 訂閱建立 → 付款確認 → 啟用服務，每一步由 Store 封裝業務邏輯，API 層只做 REST CRUD，兩層職責清楚分離。審核通過時後端自動核算名額並推進群組至 `full` 狀態；被拒絕的申請可重新提出（`rejected → pending`），無需刪除重建。核准流程（餘額檢查、名額與招募狀態條件式更新、申請狀態變更、成員/訂閱建立、代幣代管扣款）整包在單一 Prisma `$transaction` 內執行；名額檢查採條件式 `updateMany`（`status: 'recruiting'` + `currentMembers < maxMembers`）而非先讀後寫，避免併發核准導致超額或核准到已非招募中的群組；餘額不足或名額已滿時全部回滾，避免申請卡在 `approved` 但成員/代管資料未建立的不一致狀態。`subscriptions` API 一律以登入者身分為授權範圍：`GET` 只回傳本人訂閱或本人主持群組內的訂閱、`DELETE` 僅限訂閱本人或該群組團主可操作；已移除原本可被任意使用者呼叫、繞過申請審核流程建立訂閱的 `POST /subscriptions`（訂閱一律由 `applications.js` 核准流程以 transaction 建立）。`members` API 的 `GET ?groupId=` 現會先驗證請求人是否為該群組成員或團主，非相關人員回傳 403。`notifications` API 的 `POST` 不再信任前端傳入的 `isPublic`（一律視為 false），且通知其他使用者時須驗證請求人與目標使用者皆與 `meta.groupId` 指定的群組有關聯（成員／團主／曾送出申請），避免任意使用者對其他人偽造通知。

### 兩階段 App 啟動

未登入時只載入公開資料，避免受保護端點在未認證狀態下被呼叫。登入後才動態初始化私人 Store，並啟動通知 polling；登出時一律呼叫 `teardown()` 清除 polling 計時器與 Store 狀態，確保不會有殘留的 auth 請求。登出再登入（不重整頁面）時，`initPrivateStores` 會重新呼叫 `startPolling`，確保通知持續同步。

### 通知驅動的即時資料同步

通知採用 REST polling（每 10 秒）。偵測到新 `new_application` 通知時自動 refresh 申請 Store，讓團主點擊通知時申請資料已是最新狀態；偵測到成員異動通知時廣播 `pm:refresh-member-stores` 事件，同步更新群組、成員、訂閱、申請四個 Store。

### 訊息輪詢架構

聊天室採用 REST polling（每 5 秒），部署成本低、無需額外的長連線基礎設施，適合現階段規模。

### 三層滑動 Panel

群組 Modal（`GroupModalShell`）採用 300% 寬度的滑動軌道，支援主面板 → 子面板 → 子子面板三層滑入動畫。申請管理子面板右上角的「審核紀錄」按鈕觸發第三層面板，保持一致的「翻書」視覺效果，不需要額外的 overlay Modal。
