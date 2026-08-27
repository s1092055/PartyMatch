# PartyMatch

共享訂閱群組媒合平台，幫助使用者找到可信任的夥伴一起分攤 Spotify、Netflix、YouTube Premium 等服務費用。

內建 **SubTrack** 模組負責訂閱管理——加入後的付款狀態、帳單提醒、付款紀錄都在這裡處理。

> 目前是 MVP 展示版，所有資料用 mock data + localStorage 模擬，尚未串接 Firebase。

---

## 功能

- 探索群組：全寬單欄式版面，含關鍵字搜尋、服務篩選、排序、自訂下拉選單；頁面頂部顯示優良團主排行榜（HostLeaderboard）
- 快速配對：選服務 + 設定預算偏好，自動推薦最適合的群組
- 申請加入（審核制）或立即加入
- 建立自己的共享群組（4 步驟表單）
- 管理群組：審核申請、管理成員（含移除）、查看收款狀態、傳送催款通知、續訂管理；卡片底部顯示兩個主要操作，其餘功能收進右上角 dropdown
- 訂閱管理：付款狀態追蹤、標記已付款、查看歷史紀錄；卡片操作與管理端共用 GroupCardShell 殼層
- 訊息中心：通知分類（付款、申請、系統）、標記已讀
- 收藏感興趣的群組
- 帳號中心：個人資料、付款方式、通知偏好、安全驗證、設定
- 手機版右滑抽屜導航（點選右上角漢堡選單展開）

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
- 狀態管理：localStorage（驗證、群組、申請等）+ sessionStorage（快速配對條件）

---

## 路由

### 公開頁面

| 路徑 | 頁面 |
|------|------|
| `/login` | 登入 |
| `/register` | 註冊 |
| `/forgot-password` | 忘記密碼 |

### 登入後

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 Dashboard |
| `/explore` | 探索群組 |
| `/quick-match` | 快速配對設定 |
| `/quick-match/results` | 配對結果 |
| `/groups/:groupId` | 群組詳情 |
| `/create-group` | 建立群組 |
| `/manage-groups` | 管理群組 |
| `/my-subscriptions` | 我的訂閱 |
| `/favorites` | 收藏清單 |
| `/messages` | 訊息中心 |
| `/account` | 帳號中心 |
| `/about` | 說明中心 |

---

## 專案結構

```
src/
├── app/
│   ├── App.jsx
│   └── router.jsx
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
│   │   ├── layout/      # AppLayout、Sidebar（含 SVG Logo）、Topbar
│   │   ├── auth/        # AuthLayout
│   │   ├── route/       # ProtectedRoute、PublicOnlyRoute
│   │   ├── ui/          # Button、Badge、Avatar、Modal、Toggle、CustomSelect、Tabs…
│   │   ├── modals/      # ApplyJoinModal、InstantJoinModal、LogoutConfirmModal
│   │   └── cards/       # GroupCard（探索用）、GroupCardShell（管理 / 訂閱共用殼層）
│   ├── data/            # mock 種子資料（唯讀）
│   ├── stores/          # localStorage 資料層
│   ├── services/        # serviceTypes（服務圖示、顏色）
│   ├── constants/       # nav.js（Sidebar / Topbar 導航結構）
│   └── utils/           # date、storage、matchGroups、subscriptionStatus…
└── index.css            # Tailwind v4 design token + 元件原始類別
```

---

## 資料層

### Mock 種子資料（`src/shared/data/`）

唯讀，僅供展示。新功能請透過 Store 層寫入。

- 當前登入用戶為 `user_001`（林宥廷）——同時是一般成員與 Amazon 群組的團主
- 群組日期設在 2026 年，讓「即將到期」邏輯正常運作

### Store 層（`src/shared/stores/`）

| Store | localStorage 金鑰 | 用途 |
|-------|-----------------|------|
| `authStore` | `pm_auth_user` | 登入 / 登出 / 註冊 |
| `groupStore` | `pm_created_groups` | 群組 CRUD |
| `applicationStore` | `pm_applications` | 申請狀態 |
| `memberStore` | `pm_members` + `pm_removed_members` + `pm_member_overrides` | 成員管理（含移除黑名單與付款狀態覆寫） |
| `subscriptionStore` | `pm_subscriptions` + `pm_subscription_overrides` | 訂閱與付款狀態 |
| `paymentStore` | `pm_payment_records` | 付款紀錄 |
| `notificationStore` | `pm_notifications` | 通知 |
| `favoriteStore` | `pm_favorites` | 收藏群組 |

### 主要流程

| 流程 | 說明 |
|------|------|
| 申請加入 | `createApplication` → ApplyJoinModal → localStorage |
| 立即加入 | `createMember` + `createSubscription` + `updateGroup` + `createNotification` |
| 團主審核 | 核准：建立 member + subscription + notification；拒絕：更新申請狀態 |
| 建立群組 | 4 步驟 → `mapFormToGroup()` → `createGroup()` → 導向管理頁 |
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
| `recruiting` | 審核申請、管理成員、編輯群組、暫停招募、解散群組 |
| `full` | 管理成員、查看收款狀態 |
| `pending_confirmation` | 管理成員、確認收款、傳送催款通知 |
| `pending_activation` | 管理成員、啟用服務 |
| `active`（一般） | 管理成員、群組設定、停止服務 |
| `active`（到期 ≤7 天） | 管理成員、準備續訂（開始新一期 / 結束服務） |
| `paused / cancelled / ended` | 查看紀錄 |

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

## 已知限制

- Mock 種子申請（`APPLICATIONS`）的審核結果只改 local state，重新整理後 mock 申請會回到 pending
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
