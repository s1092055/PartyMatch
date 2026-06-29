# 架構與資料層

## 資料夾結構

```txt
src/
├── main.jsx                    # React app 進入點
├── index.css                   # Tailwind v4 theme tokens 與 component primitives
├── app/
│   ├── App.jsx                 # 初始化 stores 並掛載 RouterProvider
│   ├── firebase.js             # Firebase app / db / auth
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
│   ├── create/                 # 建立群組 Modal
│   │   ├── CreateGroupModal.jsx
│   │   └── components/
│   │       ├── CreateGroupStepper.jsx
│   │       ├── LivePreviewPanel.jsx
│   │       └── steps/
│   │           ├── Step1Service.jsx
│   │           ├── Step2Plan.jsx
│   │           ├── Step3Settings.jsx
│   │           └── Step4Preview.jsx
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
│   ├── manage/                 # 團主管理
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
│   ├── match/                  # 快速配對
│   │   ├── QuickMatchModal.jsx
│   │   └── components/
│   │       ├── MatchConditionBar.jsx
│   │       ├── MatchSummaryPanel.jsx
│   │       └── ServiceSelectionGrid.jsx
│   ├── messages/               # 訊息中心
│   │   ├── MessagesModal.jsx   # 狀態管理與 orchestration
│   │   ├── utils.js            # formatTime 共用工具
│   │   └── components/
│   │       ├── ChatWindow.jsx
│   │       ├── ConversationAvatar.jsx
│   │       ├── ConversationList.jsx
│   │       └── ConversationMenu.jsx
│   └── subscriptions/          # 我的訂閱
│       ├── SubscriptionsPage.jsx
│       └── components/
│           ├── CombinedServicePaymentModal.jsx
│           ├── MemberGroupView.jsx    # 成員視角群組 Modal
│           ├── PaymentStatusBadge.jsx
│           └── SubscriptionCard.jsx
├── shared/
│   ├── api/                    # Firestore 資料存取
│   │   ├── applicationsApi.js
│   │   ├── demoCollection.js   # demo / prod collection 切換
│   │   ├── favoritesApi.js
│   │   ├── firestoreUtils.js
│   │   ├── groupsApi.js
│   │   ├── membersApi.js
│   │   ├── messagesApi.js
│   │   ├── notificationsApi.js
│   │   ├── paymentsApi.js
│   │   ├── servicesApi.js
│   │   ├── storageApi.js
│   │   ├── subscriptionsApi.js
│   │   └── usersApi.js
│   ├── constants/              # nav、paymentStatus 等常數
│   │   ├── nav.js
│   │   └── paymentStatus.js
│   ├── data/
│   │   └── serviceCatalog.js   # 30 種訂閱服務定義
│   ├── layout/                 # 全域版面元件
│   │   ├── AppFooter.jsx
│   │   ├── AppLayout.jsx
│   │   ├── AppNav.jsx
│   │   ├── FloatingMessages.jsx
│   │   ├── MobileSearch.jsx
│   │   ├── PageHeader.jsx
│   │   └── ScrollToTop.jsx
│   ├── stores/                 # 前端業務邏輯與資料快取
│   │   ├── applicationStore.js
│   │   ├── authStore.js
│   │   ├── conversationStore.js
│   │   ├── favoriteStore.js
│   │   ├── groupStore.js
│   │   ├── memberStore.js
│   │   ├── notificationStore.js
│   │   ├── paymentStore.js
│   │   ├── serviceStore.js
│   │   └── subscriptionStore.js
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
│   │   └── Toggle.jsx
│   └── utils/                  # 工具函式
│       ├── creditScore.js
│       ├── date.js
│       ├── groupDisplay.js
│       ├── hooks.js
│       ├── leaveGroupFlow.js
│       ├── matchGroups.js
│       ├── modelNormalizers.js
│       ├── searchUtils.js
│       ├── serviceUtils.js
│       ├── storage.js
│       ├── subscriptionStatus.js
│       └── toast.js
```

---

## Store 設計

10 個 Store（含 `conversationStore`）+ `messagesApi` 均遵循相同結構：

```javascript
let _data = []

export async function initModule() {
  _data = await readAllRecords()
}

export function getRecords() { return _data }        // 同步，讀取記憶體
export async function createRecord(data) { ... }     // 非同步，寫入 Firestore + 更新記憶體
export function updateRecord(id, patch) { ... }      // 同步回傳，fire-and-forget 寫入 Firestore
```

| Store | Firestore collection | 主要職責 |
|-------|----------------------|----------|
| `authStore` | Firebase Auth + `users` | 登入、註冊、Google popup、密碼重設、信用分數 |
| `serviceStore` | `services` + `services.mock.js` | 30 種服務清單、方案價格、Logo |
| `groupStore` | `groups` | 群組 CRUD、狀態推進、啟用 / 續訂 / 結束 |
| `applicationStore` | `applications` | 申請建立與審核狀態 |
| `memberStore` | `members` | 群組成員、付款狀態、移除成員 |
| `subscriptionStore` | `subscriptions` | 成員訂閱、標記付款、確認付款、啟用訂閱 |
| `paymentStore` | `paymentRecords` | 付款紀錄統計 |
| `notificationStore` | `notifications` | 個人通知、公開系統公告、未讀數 |
| `favoriteStore` | `favorites` | 收藏群組 |
| `conversationStore` | `conversations`（即時監聽） | 對話列表快取、計算未讀訊息數 |
| `messagesApi` | `conversations` + subcollection `messages` | 即時對話、DM、未讀數 CRUD |

---

## 主要檔案連動

| 主要檔案 | 連動對象 | props / event / function |
|----------|----------|--------------------------|
| `src/app/App.jsx` | `router.jsx`、所有 `init*Store()`、`ToastContainer` | Promise.all 並行初始化前 9 個 Store；`initConversations` 需等 `initNotifications` 完成後才依序呼叫（避免冷啟動通知重複），接著呼叫 `checkMissedApplicationNotifications` |
| `src/app/router.jsx` | `AppLayout`、`ProtectedRoute`、`PublicOnlyRoute`、`redirects.jsx` | 定義公開頁、受保護頁、Modal 型 redirect route |
| `src/shared/layout/AppLayout.jsx` | `AppNav`、`AppFooter`、`MobileSearch`、`FloatingMessages`、`BackToTopButton`、`MessagesModal`、`CreateGroupModal`、`GroupDetailModal`、`QuickMatchModal` | 統一掛載跨頁共用導覽、全域 Modal 與頁尾 |
| `src/shared/layout/AppNav.jsx` | `NAV_SECTIONS`、`authStore`、`notificationStore`、`conversationStore`、`hooks` | 未登入項目顯示鎖頭；dispatch `pm:open-create` / `pm:open-match` / `pm:open-messages` / `pm:open-notify` / `pm:open-search`；監聽 `pm:notif-changed` / `pm:convs-changed` 更新未讀 badge |
| `src/shared/layout/FloatingMessages.jsx` | `notificationStore`、`conversationStore`、`MessagesModal`（inline） | 監聽 `pm:open-notify` 顯示通知 panel；監聽 `pm:notif-changed` 更新通知列表；通知點擊後依類型 dispatch 對應 `pm:open-*` 事件 |
| `src/shared/ui/GroupModalShell.jsx` | `GroupOverviewContent`、`Badge`、`ProgressBar`、`ServiceLogo` | 三個群組詳情 Modal 共用的兩欄佈局殼；管理 scroll lock、Escape 關閉、左右欄高度同步 |
| `src/features/group/GroupDetailModal.jsx` | `GroupModalShell`、`ApplyJoinModal`、`favoriteStore`、`applicationStore` | 接收 `pm:open-group`；依使用者狀態顯示申請、收藏、付款 CTA；含推薦群組輪播 |
| `src/shared/ui/GroupViewModal.jsx` | `HostGroupView`、`MemberGroupView` | 薄殼：依 `isHost` 決定渲染 HostGroupView 或 MemberGroupView |
| `src/features/manage/components/HostGroupView.jsx` | `GroupModalShell`、子 Modal | 團主視角；成員名單、申請管理（招募中）/ 收款管理（收款階段）、啟用 CTA |
| `src/features/subscriptions/components/MemberGroupView.jsx` | `GroupModalShell`、`CombinedServicePaymentModal` | 成員視角；填寫帳號 + 上傳憑證合併為單步驟 Modal |
| `src/features/messages/MessagesModal.jsx` | `conversationStore`、`messagesApi`、`ConversationList`、`ChatWindow` | 接收 `pm:open-messages` / `pm:open-dm`；透過 `subscribeToMessages` 訂閱即時訊息 |
| `src/shared/stores/*` | `src/shared/api/*`、`src/shared/utils/*` | Stores 保存前端快取並封裝業務流程，api 只做 Firestore CRUD |

---

## 路由

### 公開頁面

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 Landing Page |
| `/explore` | 探索群組 |
| `/explore?q=keyword` | 探索搜尋 |
| `/groups/:groupId` | 群組詳情重導（轉到探索頁並開啟 Modal） |
| `/login` | 登入（PublicOnlyRoute） |
| `/register` | 註冊（PublicOnlyRoute） |
| `/forgot-password` | 忘記密碼（PublicOnlyRoute） |
| `/disclaimer` / `/terms` / `/privacy` | 法務頁 |

### 需登入頁面

| 路徑 | 頁面 |
|------|------|
| `/quick-match` | 快速配對重導（觸發 `pm:open-match`） |
| `/create-group` | 建立群組重導（觸發 `pm:open-create`） |
| `/manage-groups` | 群組管理 |
| `/my-subscriptions` | 我的訂閱 |
| `/favorites` | 我的收藏 |
| `/account` | 帳號中心 |

---

## 共用 UI 元件

| 元件 | 用途 |
|------|------|
| `AppNav` | 桌機側欄、手機 Header、通知 / 訊息按鈕、未讀 badge |
| `MobileSearch` | 手機 / 側欄搜尋入口 |
| `Modal` | 通用 Modal 外殼；支援 `sub` prop（子 modal 模式，z-index 提升、左上角返回鍵）；`isOpen` 為 undefined 時為非受控模式 |
| `GroupModalShell` | 探索、管理、訂閱三處共用的兩欄佈局殼；`subPanel` prop 實現子 Modal 滑動動畫 |
| `FilterTabsBar` | 管理群組、我的訂閱等頁面的可重用分頁篩選列 |
| `ToastContainer` / `toast.js` | 全域提示訊息（含 `aria-live="polite"` 無障礙支援） |
| `ServiceLogo` | 依 serviceId 顯示本地或服務資料中的 Logo |
