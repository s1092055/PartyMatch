# 架構與資料層

## 資料夾結構

```txt
src/
├── app/
│   ├── App.jsx                 # 初始化 stores 並掛載 RouterProvider
│   ├── firebase.js             # Firebase app / db / auth
│   ├── redirects.jsx           # Modal 型路由重導
│   └── router.jsx              # React Router 設定
├── assets/                     # Logo 與本地服務 icon
├── features/
│   ├── account/                # 帳號中心
│   ├── auth/                   # 登入、註冊、忘記密碼
│   ├── create/                 # 建立群組 Modal
│   ├── explore/                # 探索群組
│   ├── favorites/              # 我的收藏
│   ├── group/                  # 群組詳情與申請加入
│   ├── home/                   # 首頁與首頁文案資料
│   ├── legal/                  # 法務頁
│   ├── manage/                 # 團主管理
│   │   └── components/
│   │       └── HostGroupView.jsx   # 團主視角群組 Modal
│   ├── match/                  # 快速配對
│   ├── messages/               # 訊息中心
│   │   ├── MessagesModal.jsx   # 狀態管理與 orchestration
│   │   ├── utils.js            # formatTime 共用工具
│   │   └── components/         # ConversationList、ChatWindow、ConfirmDialog 等
│   └── subscriptions/          # 我的訂閱
│       └── components/
│           ├── MemberGroupView.jsx    # 成員視角群組 Modal
│           └── PaymentStatusBadge.jsx # 付款狀態 badge
├── shared/
│   ├── api/                    # Firestore 資料存取
│   ├── constants/              # nav、paymentStatus 等常數
│   ├── data/                   # services.mock.js（30 種訂閱服務）
│   ├── layout/                 # AppLayout、AppNav、FloatingMessages、MobileSearch
│   ├── route/                  # ProtectedRoute、PublicOnlyRoute
│   ├── stores/                 # 前端業務邏輯與資料快取
│   ├── ui/                     # 共用 UI 元件（GroupModalShell、GroupViewModal 等）
│   └── utils/                  # 日期、搜尋、配對、狀態、toast 等工具
└── index.css                   # Tailwind v4 theme tokens 與 component primitives
```

---

## Store 設計

8 個 Store 均遵循相同結構：

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
| `src/app/App.jsx` | `router.jsx`、所有 `init*Store()`、`ToastContainer` | App 啟動時並行初始化所有 Store |
| `src/app/router.jsx` | `AppLayout`、`ProtectedRoute`、`PublicOnlyRoute`、`redirects.jsx` | 定義公開頁、受保護頁、Modal 型 redirect route |
| `src/shared/layout/AppLayout.jsx` | `AppNav`、`MobileSearch`、`FloatingMessages`、`MessagesModal`、`CreateGroupModal`、`GroupDetailModal`、`QuickMatchModal` | 統一掛載跨頁共用導覽與全域 Modal |
| `src/shared/layout/AppNav.jsx` | `NAV_SECTIONS`、`authStore`、`notificationStore`、`conversationStore` | 未登入項目顯示鎖頭；`pm:open-*` 事件開啟各 Modal；監聽 `pm:notif-changed` / `pm:convs-changed` 更新未讀 badge |
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
| `ModalShell` | 快速配對、建立群組、訊息共用 Modal 外殼 |
| `GroupModalShell` | 探索、管理、訂閱三處共用的兩欄佈局殼；`subPanel` prop 實現子 Modal 滑動動畫 |
| `FilterTabsBar` | 管理群組、我的訂閱等頁面的可重用分頁篩選列 |
| `ToastContainer` / `toast.js` | 全域提示訊息（含 `aria-live="polite"` 無障礙支援） |
| `ServiceLogo` | 依 serviceId 顯示本地或服務資料中的 Logo |
