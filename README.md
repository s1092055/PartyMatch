# PartyMatch

共享訂閱群組媒合平台，幫助使用者找到可信任的夥伴一起分攤 Spotify、Netflix、YouTube Premium 等服務費用。

內建 **SubTrack** 模組負責訂閱管理——加入後的付款狀態、帳單提醒、付款紀錄都在這裡處理。

> 目前是 MVP 展示版，群組 / 成員 / 申請 / 訂閱 / 通知等核心資料已全面串接 Firebase Firestore；驗證仍使用 localStorage 模擬。  
> Demo 帳號：`demo@partymatch.tw` / `demo1234`（資料由 `scripts/seedDemo.mjs` 種入 Firestore，並以 `_demo: true` 標記，可安全重置）。

---

## 功能

- 探索群組：Marketplace 瀏覽版面；分類 Pills 篩選（影音、音樂、AI 工具、辦公、雲端、學習、遊戲、VPN）+ 次要篩選列（加入方式、價格、排序）；群組以 3 欄卡片網格呈現；共 30 種服務、26 個 Mock 群組；Sidebar 與手機版 Drawer 搜尋按鈕皆可搜尋並導向探索頁篩選結果；自己是團主的群組不顯示在探索頁
- 快速配對：選服務 + 設定預算偏好，自動推薦最適合的群組
- 申請加入（審核制）或立即加入
- 建立自己的共享群組（4 步驟表單）；方案費用依官方定價自動計算，名額上限依方案限制，不開放團主自訂價格；名額顯示開放給成員的席位數（不含團主）；可設定加入條件與規則
- 管理群組：直式卡片（Badge → Logo → 服務名稱 → 2×2 資訊格：待處理申請 / 本期收款 / 付款狀態 / 每月收入）；點擊「待處理申請」格開啟該群組專屬審核視窗（每個群組獨立）；次要操作（準備續訂、查看歷史）收折至 ⋯ 選單；統一透過 GroupViewModal 管理成員付款、啟用服務；支援篩選分頁（全部 / 招募中 / 待啟用 / 已啟用 / 已停止 / 已取消）
- 訂閱管理：直式卡片（Badge → Logo → 服務名稱 → 帳單週期 chip + 下次扣款日 chip → 團主資訊 / 付款狀態 → 金額）；付款狀態追蹤、標記已付款、聯絡團主（在 GroupViewModal 內操作）、查看付款歷史紀錄、申請紀錄（含審核中／已核准／已拒絕）；管理端與訂閱端共用 GroupViewModal 查看群組詳情
- 訊息中心：通知分類（付款、申請、系統）、標記已讀
- 收藏感興趣的群組
- 帳號中心：個人資料、付款方式、通知偏好、安全驗證、設定
- 手機版右滑抽屜導航（點選右上角漢堡選單展開），抽屜內含搜尋按鈕可開啟搜尋底頁

---

## 安裝

```bash
npm install
npm run dev
```

開在 `http://localhost:5173`。

```bash
npm run build   # 打包
npm run lint    # 程式碼檢查
```

---

## 技術棧

- React 19 + Vite
- React Router v7
- Tailwind CSS v4（含自訂 design token）
- lucide-react
- 狀態管理：Firebase Firestore（群組、申請、成員、訂閱、通知、收藏）+ localStorage（驗證）+ sessionStorage（快速配對條件）

---

## 路由

### 公開頁面

| 路徑 | 頁面 |
|------|------|
| `/` | Landing Page（已登入者自動導向 `/explore`） |
| `/login` | 登入 |
| `/register` | 註冊 |
| `/forgot-password` | 忘記密碼 |
| `/explore` | 探索群組（無需登入可瀏覽） |
| `/explore?q=keyword` | 探索群組（關鍵字篩選，無需登入） |
| `/groups/:groupId` | 群組詳情（無需登入可瀏覽，加入需登入） |
| `/about` | 說明中心 |

### 登入後（需登入）

| 路徑 | 頁面 |
|------|------|
| `/quick-match` | 快速配對設定 |
| `/quick-match/results` | 配對結果 |
| `/create-group` | 建立群組 |
| `/manage-groups` | 管理群組 |
| `/my-subscriptions` | 我的訂閱 |
| `/favorites` | 收藏清單 |
| `/messages` | 訊息中心 |
| `/account` | 帳號中心 |

---

## 專案結構

```
src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   └── firebase.js      # Firebase 初始化設定
├── assets/              # 靜態資源（Logo.svg 等）
├── pages/
│   ├── auth/            # 登入 / 註冊 / 忘記密碼
│   ├── explore/
│   ├── group-detail/
│   ├── quick-match/
│   ├── my-subscriptions/
│   ├── favorites/
│   ├── create-group/
│   ├── manage-groups/
│   ├── messages/
│   ├── account/
│   └── about/
├── shared/
│   ├── components/
│   │   ├── layout/      # AppLayout、Sidebar（含搜尋面板）、Topbar、MobileSearch（搜尋底頁）
│   │   ├── auth/        # AuthLayout
│   │   ├── route/       # ProtectedRoute、PublicOnlyRoute
│   │   ├── ui/          # Button、Badge、Avatar、Modal、Toggle、CustomSelect、Tabs…
│   │   ├── modals/      # ApplyJoinModal、InstantJoinModal、LogoutConfirmModal、GroupViewModal（管理 / 訂閱共用）
│   │   └── cards/       # GroupCard（探索用）、GroupCardShell（管理頁共用殼層）
│   ├── api/             # 資料存取層（Firebase 遷移切換點）
│   ├── data/            # mock 種子資料（services.mock.js 唯讀；群組 / 申請 / 訂閱資料已移至 Firestore）
│   ├── stores/          # 業務邏輯層，呼叫 api/ 取得資料
│   ├── services/        # serviceTypes（服務圖示、顏色、官方定價）
│   ├── constants/       # nav.js（Sidebar / Topbar 導航結構）、paymentStatus.js（CONFIRMED_STATUSES、READY_TO_ACTIVATE_STATUSES）
│   └── utils/           # date（含 formatMonthDay）、storage、matchGroups、subscriptionStatus、billingChip…
└── index.css            # Tailwind v4 design token + 元件原始類別
```

---

## 資料層

### Mock 種子資料（`src/shared/data/`）

- `services.mock.js`：30 種訂閱服務定義（唯讀），每個服務方案含官方月費與人數上限
- 群組、申請、訂閱等動態資料已移至 Firebase Firestore，不再使用本地 mock 檔案

### Store 層（`src/shared/stores/`）

所有動態資料已遷移至 Firebase Firestore，Store 層透過 `src/shared/api/` 存取。

| Store | Firestore 集合 | 用途 |
|-------|--------------|------|
| `authStore` | localStorage `pm_auth_user` | 登入 / 登出 / 註冊（驗證仍為模擬） |
| `groupStore` | `groups` | 群組 CRUD |
| `applicationStore` | `applications` | 申請狀態 |
| `memberStore` | `members` | 成員管理（含移除與付款狀態覆寫） |
| `subscriptionStore` | `subscriptions` | 訂閱與付款狀態 |
| `paymentStore` | `paymentRecords` | 付款紀錄 |
| `notificationStore` | `notifications` | 通知 |
| `favoriteStore` | `favorites` | 收藏群組 |

### 主要流程

| 流程 | 說明 |
|------|------|
| 申請加入 | `createApplication` → ApplyJoinModal → localStorage |
| 立即加入 | `createMember` + `createSubscription` + `updateGroup` + `createNotification` |
| 團主審核 | 核准：建立 member + subscription + notification；拒絕：更新申請狀態 |
| 建立群組 | 4 步驟 → `mapFormToGroup()` → `createGroup()` → 導向管理頁；費用由官方定價 ÷ 名額自動計算 |
| 標記已付款 | `markSubscriptionPaid()` + 同步 `updateMember()` + `createNotification()` 通知待確認 |
| 團主逐筆確認收款 | `updateMember(confirmed)` + `confirmSubscriptionPayment()` + 自動偵測全員確認後推進群組狀態 |
| 確認收款完成 | `confirmGroupPayments()` → 群組狀態轉 `pending_activation` |
| 移除成員 | `removeMember()` → 更新 `usedSeats / openSeats` |
| 傳送催款通知 | `createNotification()` → 成員收到付款提醒（單筆或批次） |
| 暫停招募 / 解散群組 | `pauseGroup()` / `cancelGroup()` → 需二次確認 modal |
| 停止服務 | `pauseGroup()` → 群組狀態轉為 `paused`，需二次確認 |
| 啟用服務 | `activateGroup()` + `activateGroupSubscriptions()` → 計算 `nextBillingDate`，狀態轉 `active`，通知所有成員 |
| 傳送到期提醒 | `createNotification()` → 通知所有成員即將續訂 |
| 開始新一期收款 | `startRenewalCycle()` → 狀態轉 `pending_confirmation`，下期帳單日自動延後一個週期 |
| 結束服務 | `endGroup()` → 狀態轉 `ended` |

---

## 群組狀態機

```
draft → recruiting → full → pending_confirmation → pending_activation → active → paused / cancelled / ended
```

| 群組狀態 | 可用操作 |
|----------|---------|
| `recruiting` | 審核申請、查看成員付款、查看歷史 |
| `full` | 查看成員付款 |
| `pending_confirmation` | 確認收款、傳送催款通知 |
| `pending_activation` | 啟用服務 |
| `active`（一般） | 查看成員付款、查看歷史 |
| `active`（到期 ≤7 天） | 準備續訂（開始新一期 / 結束服務）、查看歷史 |
| `paused / cancelled / ended` | 查看歷史 |

---

## 付款狀態流程

### 成員端（`subscription.paymentStatus`）

| 狀態 | 說明 | 使用者操作 |
|------|------|-----------|
| `pending` | 待付款 | 標記已付款 |
| `markedPaid` | 已標記，等待團主確認 | — |
| `confirmed` | 團主已確認收款 | — |
| `paid` | 已付款（舊格式，等同 confirmed） | 查看紀錄 |
| `overdue` | 逾期（由 effectiveStatus 計算） | 補繳款項 |

### 團主端（`member.paymentStatus`）

| 狀態 | 說明 | 團主操作 |
|------|------|---------|
| `pending` | 尚未付款 | 發送催款通知 |
| `markedPaid` | 成員已標記，待確認 | 確認收款（逐筆） |
| `confirmed` | 已確認 | — |
| `paid` | 已付款（舊格式） | — |

所有成員達到 `confirmed` 或 `paid` 後，群組自動推進至 `pending_activation`。

---

## Demo 資料

`scripts/seedDemo.mjs` 以 Demo 帳號身份種入資料（需在 `.env` 設定 Firebase 服務帳號或 emulator）：

- **我的訂閱**：涵蓋 pending / markedPaid / confirmed / upcoming（7 天內扣款）等狀態
- **申請紀錄**：pending + rejected 各一筆
- **管理群組**：涵蓋 recruiting / full / pending_confirmation / active / paused / ended 等狀態

```bash
node scripts/seedDemo.mjs   # 種入 demo 資料（自動清除舊的 _demo 資料後重建）
```

---

## 已知限制

- 密碼明文存 localStorage（展示用，正式版須換 Firebase Auth）
- 手機版小螢幕部分 modal overflow 尚未處理
- 開始新一期收款後，成員付款狀態不會自動重設（展示模式限制）
- 一般使用者標記付款時，若該使用者在群組中無 member 記錄（僅有訂閱記錄），成員狀態不會同步至團主端

---

## 打包

```bash
zip -r partymatch.zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/.git/*" \
  --exclude "*/.DS_Store"
```
