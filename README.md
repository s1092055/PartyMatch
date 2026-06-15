# PartyMatch

共享訂閱群組媒合平台，幫助使用者找到可信任的夥伴一起分攤 Spotify、Netflix、YouTube Premium 等服務費用。

內建 **SubTrack** 模組負責訂閱管理——加入後的付款狀態、帳單提醒、付款紀錄都在這裡處理。

> 目前是 MVP 展示版，所有核心資料（群組、成員、申請、訂閱、通知、收藏、驗證）已全面串接 Firebase。
> Demo 帳號：`demo@partymatch.tw` / `demo1234`（資料由 `scripts/seedDemo.mjs` 種入 Firestore，並以 `_demo: true` 標記，可安全重置）。

---

## 功能

- **首頁（Landing Page）**：行銷首頁，展示核心功能（FeatureCards 左右交錯排版，5 大功能）、附加功能（ExtraFeatures：訊息中心、通知中心、收藏、信用分數，影片上方卡片版型）、使用教學（HowItWorks 幻燈片，5 步驟）、團主指南（HostGuide：申請流程 / 日常任務 / 注意事項三 Tab 各含幻燈片）、FAQ（手風琴，標題置中）、頁尾（含法律文件連結）；頂部浮動 AppNav（top variant）；Logo 點擊回首頁；各區塊採 RevealSection 滾動觸發淡入動畫；服務跑馬燈（全部 30 種服務無限循環，CSS @keyframes marquee）
- **探索群組**：Marketplace 瀏覽版面；分類圖示 Grid 篩選（影音、音樂、AI 工具、辦公、雲端、學習、遊戲、VPN）+ 次要篩選列（服務、價格、排序）；卡片顯示價格 → 分隔線 → 團主名稱（不顯示信用評分）+ 剩餘名額；共 30 種服務；Sidebar 與手機版 Drawer 搜尋按鈕皆可搜尋並導向探索頁篩選結果；自己是團主的群組不顯示在探索頁；卡片採 RevealSection 滾動入場動畫
- **快速配對**（Modal）：以 `pm:open-match` 事件觸發；**無需登入即可使用**；四步驟精靈（選擇服務 → 選擇方案 → 篩選條件 → 配對結果）+ 右側配對條件摘要；Step2 針對每個已選服務選擇欲加入的方案（同建立群組的選方案邏輯）；Step3 設定預算上限、最低信用分數、群組年資；配對結果顯示所有符合條件的群組（依推薦分數排序），前三名標示金銀銅排名徽章；結果頁底部可「重新配對」或「調整條件」退回
- **群組詳情**（Modal）：以 `pm:open-group` 事件觸發；無頂部標題列，關閉按鈕浮於右上角；桌機版左右雙欄：左欄為合併卡片（服務 Logo、名稱、方案、每席價格、名額進度條、申請 CTA），右欄垂直捲動顯示服務介紹／方案說明（description + features 統一列點）／加入條件與規則／團主信用評價，最下方為「其他推薦」幻燈片（同服務優先，左右箭頭翻頁，每次 2 張 ExploreGroupCard）；手機版線性排列，申請 CTA 固定於畫面底部；已移除「已驗證團主」功能；右欄 SectionCard 使用 `flat` 無外框樣式；探索卡片、收藏卡片、快速配對結果、MobileSearch 搜尋結果與「建立群組成功後」皆 dispatch 事件開啟 Modal（已無獨立頁面路由）
- **申請加入**（審核制，所有群組統一採用審核加入）：送出申請後建立申請紀錄，並同步建立團主通知；送出成功後保留成功確認畫面
- **建立群組**（Modal）：以 `pm:open-create` 事件觸發；4 步驟表單（選服務→選方案→加入設定→最後確認）；方案費用依官方定價自動計算；選服務步驟支援分類 Grid 篩選；≥1280px 左右雙欄布局（表單 + 即時預覽卡）；＜1280px 可點擊「顯示預覽」按鈕以 Overlay 方式查看預覽卡
- **管理群組**：直式卡片（Badge → Logo → 服務名稱 → 2×2 資訊格：待處理申請 / 本期收款 / 付款狀態 / 每月收入）；點擊「待處理申請」格開啟該群組專屬審核視窗（每個群組獨立）；次要操作（準備續訂、查看歷史）收折至 ⋯ 選單；統一透過 GroupViewModal 管理成員付款、啟用服務；支援篩選分頁（全部 / 招募中 / 待啟用 / 已啟用 / 已停止 / 已取消）
- **訂閱管理**：直式卡片（Badge → Logo → 服務名稱 → 帳單週期 chip + 下次扣款日 chip → 團主資訊 / 付款狀態 → 金額）；付款狀態追蹤、標記已付款、**聯絡團主**（點擊後自動開啟訊息中心並切換至對應群組對話）、查看付款歷史紀錄、申請紀錄（含審核中／已核准／已拒絕）；管理端與訂閱端共用 GroupViewModal
- **通知中心**（Slide-over）：以 `pm:open-notify` 事件觸發；已登入顯示個人付款、申請與系統通知；未登入可開啟，但只顯示公開系統公告，不顯示會員個人通知或未讀狀態
- **訊息中心**（Modal）：以 `pm:open-messages` 事件觸發；Modal 頂部全寬 header（訊息中心標題 + 關閉按鈕），左欄對話列表，右欄聊天室名稱置於訊息上方；對話列表即時同步 Firestore（`onSnapshot`）；選取對話後即時訂閱訊息 subcollection；訊息傳送寫入 Firestore 並更新最後訊息；切換對話 / 關閉 Modal 自動取消訂閱並釋放監聽器；未讀數紅點 badge；時間戳自動格式化（今天顯示時間，其他顯示日期）；**群組建立時自動建立群組對話**（`groupStore.createGroup` → `createGroupConversation`）；**申請核准時自動將成員加入對話並送出系統訊息**（`applicationStore.updateApplicationStatus` → `addParticipantToConversation` + `sendSystemMessage`）
- **收藏**：收藏感興趣的群組；分類 Grid 篩選；取消收藏即時從清單移除
- **帳號中心**：個人資料可寫回 Firebase users 文件；付款方式、通知偏好、設定偏好支援本機持久化；安全驗證為展示型流程
- **登入 / 註冊 / 忘記密碼**：支援 Email / Password 與 Google popup 登入；左上角「返回」按鈕導回首頁
- **導航（AppNav）**：統一導航元件；應用頁顯示左側浮動側欄（side variant，收合 / 展開），首頁顯示頂部浮動橫列（top variant，僅含 Logo + 漢堡按鈕）；兩種 variant 的漢堡按鈕皆開啟右側抽屜（含導覽選單、使用者區塊）；手機版均以頂部 Header + 右滑抽屜呈現，抽屜內含搜尋按鈕可開啟 MobileSearch；快速配對 / 建立群組均以事件觸發 Modal 方式開啟（`pm:open-match` / `pm:open-create`）；**通知 / 訊息按鈕**電腦版垂直排列固定於頁面右上角（樣式與 ScrollToTop 一致），手機版通知按鈕位於 Header 漢堡按鈕左側；未登入時「我的訂閱、我的收藏、帳號中心、群組管理、建立群組」與訊息中心會顯示鎖頭並停用，hover 提醒「請先登入會員」；**帳號中心**直接列於側欄導覽，使用者頭像 dropdown 僅保留登出選項
- **CategoryPills**：共用分類篩選元件，支援 `pills`（水平膠囊列）與 `grid`（圖示格）兩種樣式；用於探索群組、收藏、快速配對、建立群組
- **ModalShell**：三大全螢幕 Modal（快速配對、建立群組、訊息中心）的共用殼元件，封裝 backdrop、header（icon + 標題 + `headerEnd` slot + 關閉按鈕）、ESC 鍵、scroll lock 與可選 footer；支援 `maxWidth`、`height`、`outerPadding` 等 props 客製尺寸
- **LoginPromptModal**：需要登入的功能（建立群組、訊息中心）在未登入狀態下觸發時，顯示此共用提示元件；提供「取消」與「前往登入」兩個操作，支援 ESC 關閉；登入後自動導回觸發時的原始頁面（`redirectTo` 參數）
- **首頁 Landing**：統計數字（活躍群組數）動態從 groupStore 讀取，反映真實招募中且有空位的群組數量
- **首頁內容資料**：核心功能、附加功能、使用流程與團主指南文案集中於 `src/features/home/data/homeContent.js`，元件只負責呈現與互動

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
- 狀態管理：Firebase Auth（驗證）+ Firebase Firestore（群組、申請、成員、訂閱、通知、收藏、**訊息（即時監聽）**）
- **RevealSection**：共用滾動動畫元件，基於 IntersectionObserver，支援 viewport 初始檢測避免已可見元素重複播放

---

## 路由

### 公開頁面

| 路徑 | 頁面 |
|------|------|
| `/` | 首頁 Landing Page（訪客 / 已登入皆可瀏覽） |
| `/login` | 登入 |
| `/register` | 註冊 |
| `/forgot-password` | 忘記密碼 |
| `/explore` | 探索群組（無需登入可瀏覽） |
| `/explore?q=keyword` | 探索群組（關鍵字篩選） |
| `/disclaimer` | 免責聲明 |
| `/terms` | 服務條款 |
| `/privacy` | 隱私政策 |

### 登入後（需登入）

| 路徑 | 頁面 |
|------|------|
| `/quick-match` | 快速配對（重導並觸發 Modal） |
| `/create-group` | 建立群組（重導並觸發 Modal） |
| `/manage-groups` | 管理群組 |
| `/my-subscriptions` | 我的訂閱 |
| `/favorites` | 收藏清單 |
| `/account` | 帳號中心 |

---

## 專案結構

```
src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   └── firebase.js           # Firebase 初始化設定
├── assets/                   # 靜態資源（Logo.svg、KKBOX-icon.png、masterclass-icon.png）
├── features/                # 依功能分類（每個功能自包含頁面或 Modal + 專屬元件）
│   ├── auth/                 # 登入 / 註冊 / 忘記密碼（pages + components/AuthLayout、AuthIllustration）
│   ├── home/                 # 首頁 Landing（FeatureCards、ExtraFeatures、HowItWorks、HostGuide、FAQ）
│   ├── explore/              # 探索群組
│   ├── group/                # 群組詳情 Modal（GroupDetailModal + GroupHeroCard、StickyJoinSummary、ApplyJoinModal）
│   ├── match/                # 快速配對 Modal
│   ├── create/               # 建立群組 Modal（多步驟表單）
│   ├── manage/               # 群組管理（團主端）；utils/groupActionMap.js
│   ├── subscriptions/        # 訂閱管理 SubTrack（成員端）
│   ├── favorites/            # 收藏
│   ├── account/              # 帳號中心
│   ├── messages/             # 訊息中心 Modal
│   └── legal/                # 免責聲明 / 服務條款 / 隱私政策
├── shared/
│   ├── layout/               # AppLayout、AppNav（top / side variant）、MobileSearch、FloatingMessages（訊息中心懸浮元件）
│   ├── route/                # ProtectedRoute、PublicOnlyRoute
│   ├── ui/                   # Button、Badge、Avatar、Modal、**ModalShell**（三大 Modal 共用殼）、Toggle、CustomSelect、ServiceLogo、RevealSection、GroupViewModal（跨功能共用 Modal）…
│   ├── api/                  # 資料存取層（Firebase Firestore）
│   ├── data/                 # mock 種子資料（services.mock.js 唯讀）
│   ├── stores/               # 業務邏輯層，呼叫 api/ 取得資料
│   ├── constants/            # nav.js（AppNav 導航結構）、paymentStatus.js
│   └── utils/                # date、storage、matchGroups、subscriptionStatus、serviceUtils（服務圖示、顏色、官方定價）、hooks（useClickOutside、useScrollLock）…
└── index.css                 # Tailwind v4 design token + 元件原始類別
```

---

## 資料層

### Mock 種子資料（`src/shared/data/`）

- `services.mock.js`：30 種訂閱服務定義（唯讀），每個服務方案含官方月費與人數上限；支援 `iconSrc`（本地圖片）或 `iconId`（Iconify）

### Store 層（`src/shared/stores/`）

所有動態資料已遷移至 Firebase Firestore，Store 層透過 `src/shared/api/` 存取。

| Store | Firestore 集合 | 用途 |
|-------|--------------|------|
| `authStore` | Firebase Auth + `users` | 登入 / 登出 / 註冊 / 密碼重設 / 個人資料更新；匯出 `getCurrentUser`、`getActiveUserProfile` |
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
| 申請加入 | `createApplication` → ApplyJoinModal |
| 立即加入 | `createMember` + `createSubscription` + `updateGroup` + `createNotification` |
| 團主審核 | 核准：建立 member + subscription + notification；拒絕：更新申請狀態 |
| 建立群組 | 4 步驟 → `mapFormToGroup()` → `createGroup()` → 導向管理頁；費用由官方定價 ÷ 名額自動計算；所有群組一律採審核加入 |
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

seed 腳本透過 `scripts/utils/getRate.mjs` 自動從 ExchangeRate-API 取得即時 USD/TWD 匯率，所有 `pricePerSeat` 以 `twd()` 換算為新台幣（網路不通時回退至 NT$31.5 備用匯率）。

---

## 已知限制

- 手機版小螢幕部分 modal overflow 尚未處理
- 開始新一期收款後，成員付款狀態不會自動重設（展示模式限制）
- 一般使用者標記付款時，若該使用者在群組中無 member 記錄（僅有訂閱記錄），成員狀態不會同步至團主端
- 帳號中心的付款方式與安全驗證仍屬展示流程，尚未串接金流或 2FA 供應商

---

## 打包

```bash
zip -r partymatch.zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/dist/*" \
  --exclude "*/.git/*" \
  --exclude "*/.DS_Store"
```
