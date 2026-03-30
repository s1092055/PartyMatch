# PartyMatch

一個用於共享串流訂閱方案的 React 網頁應用程式。使用者可以瀏覽、加入、或自行建立 Netflix、Spotify、YouTube、Disney+、Apple One、Google One、Notion、Canva、Nintendo Switch Online 等 9 種服務的共享群組。

---

## 功能總覽

| 功能 | 狀態 |
|------|------|
| 探索群組（搜尋、篩選、排序） | ✅ 完成 |
| 群組詳情（加入、離開、追蹤） | ✅ 完成 |
| 建立群組（4 步驟 + 草稿儲存） | ✅ 完成 |
| 管理已加入 / 主辦 / 追蹤的群組 | ✅ 完成 |
| Demo 認證（登入、註冊、登出） | ✅ 完成 |
| 帳號中心 | 🚧 UI 完成，功能開發中 |
| 通知中心 | 🚧 UI 完成，功能開發中 |
| 申請審核流程 | 📋 待開發 |
| 群組編輯 | 📋 待開發 |

---

## 技術堆疊

| 項目 | 版本 |
|------|------|
| React | 19 |
| Vite | 7 |
| React Router DOM | 7 |
| Tailwind CSS | 4（透過 `@tailwindcss/vite`，非 PostCSS） |
| Framer Motion | 12 |
| Headless UI | 2 |
| Heroicons | 2 |

---

## 快速開始

```bash
npm install
npm run dev      # 開發伺服器：http://localhost:5173
npm run build    # 正式環境建置 → dist/
npm run preview  # 預覽建置結果（port 3000）
npm run lint     # 執行 ESLint
```

> 專案先以 localStorage 模擬。

---

## 架構設計

### Provider 堆疊

```
AuthProvider          ← 認證狀態（最先掛載）
  └─ GroupsProvider   ← 群組狀態（依賴 auth 取得使用者身份）
       └─ App / Router
```

### 資料流

```
UI 元件
  └─ 自訂 Hook（useGroups / useAuth / useRequireAuthAction）
       └─ State 層（Context + useReducer，類 Redux 模式）
            └─ Service 層（groupService / authService）
                 └─ localStorage（模擬後端）
```

Service 層做了完整的介面抽象，未來接上真實後端 API 時只需替換 Service 層，State、Hook、UI 均不需改動。

### 群組狀態管理

採用 **Context + useReducer** 實作類 Redux 的單向資料流：

- `groupsTypes.js` — Action 常數與 `calculateGroupStatus` 邏輯
- `groupsReducer.js` — 純函式，處理所有群組狀態變更
- `groupsSelectors.js` — 查詢函式，避免 UI 直接操作原始 state
- `groupsHooks.js` — `useGroupsStore()` / `useGroupsActions()` 對外介面
- `groupsStorage.js` — localStorage 持久化，含 **schema v4 版本驗證**（版本不符自動重置）
- `groupsBootstrap.js` — 初始化時合併 mock 資料與本地儲存資料

### 認證系統

以 localStorage 實作 Demo 認證，模擬 Firebase Auth 介面：

- `subscribeToAuthState` 支援多處訂閱與跨分頁同步（storage 事件）
- `sanitizeUser` 確保對外只暴露 `uid / email / displayName`，密碼不離開 service 層
- 錯誤代碼統一（`auth/invalid-email`、`auth/email-already-in-use` 等）

---

## 專案結構

```
src/
├── app/                    # 應用程式根元件（App.jsx、router.jsx）
├── data/                   # 靜態資料
│   ├── services.config.js  # 9 種服務與方案的唯一資料來源
│   ├── groups.mock.js      # 初始 Mock 群組（約 60 筆）
│   └── notifications.mock.js
├── pages/                  # 頁面元件（依路由組織）
│   ├── auth/               # 登入、註冊
│   ├── detail/             # 群組詳情頁
│   ├── main/
│   │   ├── home/           # 首頁
│   │   ├── explore-group/  # 探索群組
│   │   ├── create-group/   # 建立群組 + 管理頁
│   │   ├── manage-group/   # 管理群組儀表板
│   │   ├── account/        # 帳號中心
│   │   └── notifications/  # 通知中心
│   └── support/            # 說明頁、404
├── shared/
│   ├── components/
│   │   ├── ui/             # 純 UI 元件（Button、Card、Badge 等）
│   │   ├── layout/         # 版面元件（Navbar、Footer、DockNav 等）
│   │   ├── feedback/       # 回饋元件（LoadingSpinner、EmptyState）
│   │   └── route/          # 路由元件（ProtectedRoute）
│   ├── modules/
│   │   ├── auth/           # 認證 Context、hooks、service
│   │   └── groups/         # 群組 state、hooks、service、utils、components
│   └── utils/              # 全域工具（serviceTheme）
└── utils/                  # 格式化工具（format.js、carousel.js）
```

---

## 路由表

| 路徑 | 頁面 | 需要登入 |
|------|------|---------|
| `/` | 首頁 | 否 |
| `/explore` | 探索群組 | 否 |
| `/groups/:id` | 群組詳情 | 否 |
| `/create-group` | 建立群組管理頁 | 否 |
| `/create-group/new` | 建立群組流程 | **是** |
| `/manage-group/my-groups` | 已加入的群組 | **是** |
| `/manage-group/hosted-groups` | 我主辦的群組 | **是** |
| `/manage-group/favorites` | 追蹤清單 | **是** |
| `/notifications` | 通知中心 | 否 |
| `/account` | 帳號中心 | 否 |
| `/help` | 說明頁 | 否 |
| `/login` | 登入 | 否 |
| `/register` | 註冊 | 否 |

---

## localStorage 結構

| Key | 說明 |
|-----|------|
| `partymatch_demo_users` | 所有註冊使用者 |
| `partymatch_demo_session` | 目前登入的使用者 session |
| `pm-groups-store` | 群組狀態快照（schema v4） |
| `partymatch_demo_groups` | Service 層的群組記錄 |
| `partymatch_create_group_draft` | 建立群組草稿 |
| `pm-dashboard-mode` | 儀表板模式偏好（explorer / host） |

---

## 命名規範

| 類型 | 規則 | 範例 |
|------|------|------|
| 資料夾 | `kebab-case` | `create-group/`、`manage-group/` |
| React 元件（.jsx） | `PascalCase` | `GroupCard.jsx`、`DockNav.jsx` |
| Hook 檔案 | `use` 前綴 camelCase | `useAuth.js`、`useGroups.js` |
| 工具 / 邏輯 JS | `camelCase` | `groupsReducer.js`、`groupsTypes.js` |
| Mock 資料 | `camelCase.mock.js` | `groups.mock.js` |
| 設定檔 | `camelCase.config.js` | `services.config.js` |
| 服務層 | `camelCaseService.js` | `authService.js`、`groupService.js` |
