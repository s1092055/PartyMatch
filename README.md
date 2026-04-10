# PartyMatch

PartyMatch 是一個以 React + Vite 製作的共享訂閱群組平台原型。使用者可以探索現有共享群組、查看群組詳情、申請加入或自行建立新的共享群組，並在登入後管理自己加入、建立與追蹤的方案。

目前專案以前端 mock 資料 + `localStorage` 模擬完整資料流，沒有串接真實後端。

---

## 目前進度

| 功能 | 狀態 |
|------|------|
| 首頁品牌展示、說明內容與探索導流 | ✅ 完成 |
| 探索群組（服務分區、搜尋、排序、查看更多） | ✅ 完成 |
| 群組詳情頁（加入、申請、追蹤、團主操作） | ✅ 完成 |
| 建立群組流程（前導頁 + 4 步驟 + 草稿） | ✅ 完成 |
| 群組管理中心（已加入、主辦中、申請狀態、追蹤） | ✅ 完成 |
| Demo 認證（註冊、登入、登出、session persistence） | ✅ 完成 |
| 申請審核流程（送出、取消、通過、拒絕） | ✅ 完成 |
| 群組快速編輯 / 邀請成員 Dialog | ✅ 完成 |
| Toast / Modal / Navbar / Dock 互動整合 | ✅ 完成 |
| 通知中心 | 🚧 UI 為主 |
| 帳號中心 | 🚧 UI 為主 |

---

## 核心產品流程

### 1. 探索群組

- 探索頁以服務類型分區顯示群組
- 每個服務區主畫面固定顯示 4 張卡片
- 點擊「探索 XXX 服務的共享群組」可開啟對應服務的群組 modal
- Navbar 中央（探索頁）有搜尋欄，可開啟獨立搜尋 modal

### 2. 群組詳情

- 訪客可查看公開群組詳情
- 非團主可依加入方式進行立即加入或送出申請
- 即時加入 vs 申請加入的說明文字會根據群組設定動態切換
- 團主進入自己的群組詳情頁時，會顯示編輯 / 解散等操作

### 3. 建立群組

- `/create-group` 直接進入建立群組 flow
- 建立流程包含前導頁與 4 個步驟：
  1. 選擇服務
  2. 選擇方案
  3. 設定群組
  4. 預覽與建立
- 支援草稿儲存、草稿續編、退出前儲存確認

### 4. 管理群組

- `/manage-group` 管理中心，需登入才能訪問
- 四個子頁籤：已加入群組、主辦中群組、申請狀態、追蹤清單
- 團主可查看已建立群組、審核申請、快速編輯、邀請成員
- 探索者可查看已加入群組、申請紀錄、追蹤清單

---

## 技術堆疊

| 項目 | 版本 |
|------|------|
| React | 19 |
| Vite | 7 |
| React Router DOM | 7 |
| Tailwind CSS | 4 |
| Framer Motion | 12 |
| Headless UI | 2 |
| Heroicons | 2 |

### 字型系統

| 用途 | 字型 | 套用範圍 |
|------|------|----------|
| 主體（中文）| Noto Sans TC | 全局預設，所有中文文字 |
| Display（數字、強調）| Manrope | 金額、計數、強調數字；CSS class `.font-display` |

### 色彩 Token（CSS 自訂屬性）

| Token | 值 | 說明 |
|-------|----|------|
| `--color-surface` | `#faf9f7` | 頁面底色（暖米白，body 預設） |
| `--color-surface-alt` | `#f5f3ef` | 次要背景區塊 |
| `--font-display` | `"Manrope", sans-serif` | Display 字型 |

---

## 快速開始

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

預設開發網址：`http://localhost:5173`

---

## 資料來源與狀態管理

### 群組資料

群組狀態由 `src/shared/modules/groups/state/` 模組統一管理：

| 檔案 | 說明 |
|------|------|
| `groupsTypes.js` | Action 常數、GROUP_STATUS / APPLICATION_STATUS / JOIN_POLICY 列舉 |
| `groupsReducer.js` | 純函式，處理所有狀態變更（含申請審核流程） |
| `groupsSelectors.js` | 查詢函式（含申請相關 selectors） |
| `groupsHooks.js` | `useGroupsStore()` / `useGroupsActions()` |
| `groupsStorage.js` | localStorage 持久化，schema 版本驗證 |
| `groupsBootstrap.js` | 初始化合併 mock + localStorage 資料 |
| `GroupsContext.jsx` | Provider 實作 |

初始 seed 資料來自 `src/data/groups.mock.js`，啟動時與 localStorage 合併。

服務與方案資料的唯一來源：`src/data/services.config.js`

### 認證資料

認證是 demo 流程，實作在：

- `src/shared/modules/auth/services/authService.js`

支援：註冊、登入、登出、session persistence、跨分頁同步

登入可使用使用者名稱、Email 或手機號碼。登入成功後一律導向首頁（`/`）。

### Provider 堆疊順序

```text
AuthProvider → GroupsProvider → App
```

### Hook 分層

```text
UI
  → useGroups / useOwnedGroups / useDrafts
    → groupsHooks (useGroupsStore / useGroupsActions)
      → GroupsContext (groupsReducer + groupsStorage)
        → localStorage
```

---

## 目前 UI 狀態

### 首頁

- **HeroBanner**：eyebrow 標籤 + 文字主標（`<h1>`，價值主張）+ 說明文字 + CTA 按鈕（開始探索 / 建立群組）+ 支援服務 icon 列（含標籤說明）；桌機版左對齊排版，手機版置中；背景採暖調米白
- **HomeHelpSection**：功能介紹、操作步驟、常見問題，三個區塊各有不同排版語言，搭配 scroll-triggered 淡入動畫（Framer Motion `whileInView`）

### Navbar

- 採用浮動式頂部導航，向下捲動隱藏、向上捲動顯示（spring 動畫）
- 開啟 modal 時整個 navbar 同步淡出隱藏
- 所有頁面（含首頁）左側固定顯示 Logo 圖片 + "PartyMatch" 文字
- **桌機版**：右側顯示使用者選單；探索頁中央顯示搜尋欄
- **手機版**：右側為漢堡選單，展開後包含帳號操作
- 無 hover 展開效果

### Dock

- **桌機版**：浮動於頁面底部，向下捲動隱藏、向上捲動顯示；footer 出現或 modal 開啟時隱藏
- **手機版**：向下捲動隱藏、向上捲動顯示；footer 出現或 modal 開啟時同樣隱藏
- 群組詳情頁桌機版 Dock 正常顯示，手機版隱藏

### 認證頁（登入 / 註冊）

- 左右分割版型：左側深色品牌面板（`#050816`）+ 右側白色表單區
- 登入 ↔ 註冊頁切換時，僅右側有過場動畫（AnimatePresence keyed by pathname）
- 需登入才能訪問的頁面跳轉後，以 Toast 提示，不重複顯示
- 不顯示一般頁面的 navbar / footer / dock

### 探索群組頁

- 以服務分區 + 群組卡片排列為主
- 卡片排列：手機版水平捲動（snap），桌機版 2 欄 grid
- 搜尋、排序與服務篩選集中在搜尋 modal，開啟時 navbar 與 dock 同步隱藏
- 底部有 CTA 區塊引導使用者建立群組

### 群組名額顏色

| 剩餘名額 | 顏色 |
|---------|------|
| > 3 位 | 綠色 |
| 2–3 位 | 橙色 |
| ≤ 1 位 | 紅色 |
| 已過期 | 灰色 |

---

## 路由總覽

| 路徑 | 說明 | 需登入 |
|------|------|--------|
| `/` | 首頁（HeroBanner + 說明內容） | 否 |
| `/explore` | 探索群組 | 否 |
| `/groups/:id` | 群組詳情 | 否 |
| `/groups/:id/apply` | 申請加入頁 | 是 |
| `/create-group` | 建立群組 flow | 是 |
| `/create-group/new` | 建立群組 flow 相容路徑 | 是 |
| `/manage-group` | 群組管理中心 | 是 |
| `/manage-group/my-groups` | 已加入群組 | 是 |
| `/manage-group/hosted-groups` | 主辦中群組管理 | 是 |
| `/manage-group/pending` | 申請狀態 | 是 |
| `/manage-group/favorites` | 追蹤清單 | 是 |
| `/notifications` | 通知中心 | 否 |
| `/account` | 帳號中心 | 否 |
| `/help` | 重導向至首頁 `/` | 否 |
| `/login` | 登入頁 | 否 |
| `/register` | 註冊頁 | 否 |

---

## localStorage Key

| Key | 說明 |
|-----|------|
| `partymatch_groups_store` | 群組、草稿、申請的主資料庫（含 schema 版本） |
| `partymatch_demo_users` | 已註冊使用者 |
| `partymatch_demo_session` | 目前登入中的 session |
| `pm-dashboard-mode:<userId>` | 管理中心目前模式（團主 / 探索者） |

清除 `localStorage` 可重置所有資料回 mock 初始狀態。

---

## 專案結構

```text
src/
├── app/
│   ├── App.jsx
│   └── router.jsx
├── data/
│   ├── groups.mock.js
│   ├── notifications.mock.js
│   └── services.config.js          ← 服務與方案的唯一資料來源
├── pages/
│   ├── auth/
│   │   ├── components/AuthPageShell.jsx
│   │   ├── login/LoginPage.jsx
│   │   └── register/RegisterPage.jsx
│   ├── account/
│   │   └── AccountCenterPage.jsx
│   ├── create-group/
│   │   ├── CreateGroupFlowPage.jsx
│   │   ├── CreateGroupHomePage.jsx
│   │   ├── components/
│   │   └── utils/
│   ├── explore/
│   │   ├── ExploreGroupPage.jsx
│   │   ├── components/
│   │   └── utils/
│   ├── group-detail/
│   │   ├── GroupDetailPage.jsx
│   │   ├── ApplyGroupPage.jsx
│   │   └── components/
│   ├── home/
│   │   ├── HomePage.jsx
│   │   └── components/
│   │       ├── HeroBanner.jsx
│   │       └── HomeHelpSection.jsx
│   ├── manage-group/
│   │   ├── ManageGroupPage.jsx
│   │   └── components/
│   ├── notifications/
│   │   └── NotificationCenterPage.jsx
│   └── support/
│       └── not-found/
├── shared/
│   ├── components/
│   │   ├── feedback/      (EmptyState, LoadingSpinner)
│   │   ├── layout/        (Navbar, DockNav, Footer, AppLayout, …)
│   │   ├── route/         (ProtectedRoute)
│   │   └── ui/            (Button, Card, Toast, ServiceIcon, …)
│   ├── hooks/             (useModalOpen, useToast)
│   └── modules/
│       ├── auth/
│       │   ├── context/AuthContext.jsx
│       │   ├── hooks/     (useAuth, useRequireAuthAction)
│       │   ├── services/authService.js
│       │   └── utils/resolveAuthRedirect.js
│       └── groups/
│           ├── api/        (groupApi.js)
│           ├── components/ (GroupCard, GroupListView, GroupGridView)
│           ├── hooks/      (useGroups, useOwnedGroups, useDrafts)
│           ├── services/groupService.js
│           ├── state/      (groupsReducer, groupsStorage, GroupsContext, …)
│           └── utils/      (groupDisplayMeta, groupSummary, …)
└── utils/
```

---

## 值得優先閱讀的檔案

| 目的 | 檔案 |
|------|------|
| 路由結構 | `src/app/router.jsx` |
| 群組狀態核心 | `src/shared/modules/groups/state/groupsReducer.js` |
| 群組查詢 Hook | `src/shared/modules/groups/hooks/useGroups.js` |
| 認證服務 | `src/shared/modules/auth/services/authService.js` |
| 探索頁 | `src/pages/explore/ExploreGroupPage.jsx` |
| 建立群組流程 | `src/pages/create-group/CreateGroupFlowPage.jsx` |
| 管理中心 | `src/pages/manage-group/ManageGroupPage.jsx` |
| 群組詳情 | `src/pages/group-detail/GroupDetailPage.jsx` |
| 服務方案資料 | `src/data/services.config.js` |

---

## 備註

- 沒有真實後端，清除 `localStorage` 可重置所有資料
- `npm run build` 可通過，目前仍有 Vite chunk size warning
- 若未來要串接真實 API，最優先替換的層是 `groupsStorage.js`（localStorage 讀寫）與 `authService.js`
