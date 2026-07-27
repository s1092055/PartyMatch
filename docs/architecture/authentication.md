# 認證機制

## 概覽

JWT accessToken + refreshToken 雙 token 設計。accessToken 有效期短（`JWT_ACCESS_EXPIRES`，預設 `15m`），存於前端 `localStorage`（key `pm_access_token`），每次 request 自動帶入 `Authorization: Bearer` header；refreshToken 有效期長（`JWT_REFRESH_EXPIRES`，預設 `7d`），存於前端 `localStorage`（key `pm_refresh_token`），同時後端也把它存一份到 Redis 供驗證比對。相關檔案：後端 `server/src/routes/auth.js`、`server/src/utils/jwt.js`、前端 `src/shared/api/axiosClient.js`、`src/shared/stores/useAuthStore.js`。

---

## 登入 / 註冊 / 登出

> **待辦**：登入／註冊頁上有 `GoogleMark` 圖示（`src/features/auth/components/AuthLayout.jsx`）、Prisma schema 也有 `User.googleId` 欄位，但兩者目前都只是預留位置——沒有接任何 Google OAuth 流程，點了圖示也沒有作用。之後若要實作，前端要接 Google Sign-In SDK、後端要新增對應的驗證 route。

### 註冊（`POST /auth/register`）與登入（`POST /auth/login`）

流程一致：驗證輸入（`zod` schema：email、密碼至少 8 碼、姓名、`09` 開頭手機號碼）→ 密碼以 `bcrypt`（cost 12）雜湊比對／儲存 → 產生 `sessionId`（`crypto.randomUUID()`）→ 簽發 accessToken（payload 含 `id`、`email`、`sessionId`）與 refreshToken（payload 含 `id`、`sessionId`）→ 呼叫 `saveRefreshToken` 寫入 Redis → 回傳 `{ user, accessToken, refreshToken }`。

登入時額外檢查 `user.deactivatedAt`，非 null（帳號已軟刪除停用）直接回 `403 { code: 'ACCOUNT_DEACTIVATED' }`。

前端 `useAuthStore.login()`／`register()` 收到回應後：`tokenManager.set(accessToken)` 寫入 `localStorage`、`refreshToken` 另存於 `pm_refresh_token`，`set({ user, loggedIn: true })` 更新 store 狀態，接著呼叫內部的 `initPrivateStores(user.id)` 啟動第二階段私人 store 初始化（見〈兩階段初始化〉）。

### 登出（`POST /auth/logout`）

`requireAuth` 解出 `req.user.id`／`req.user.sessionId`，只刪除 Redis 中 `refresh:{userId}:{sessionId}` 這一筆 key——**只登出目前這台裝置**，其他裝置的登入狀態不受影響。前端 `useAuthStore.logout()` 呼叫此 API（失敗也忽略）後，清除本地兩個 token、`set({ user: null, loggedIn: false })`，並呼叫 `clearPrivateStores()` 清空私人 store。

---

## accessToken + refreshToken 雙 token 機制

`server/src/utils/jwt.js` 提供 `signAccessToken`／`signRefreshToken`／`verifyAccessToken`／`verifyRefreshToken`，分別使用獨立的 `JWT_ACCESS_SECRET`／`JWT_REFRESH_SECRET`，演算法固定 `HS256`。

### `sessionId` 與多裝置支援

登入或註冊時產生的 `sessionId`（隨機 UUID）會同時寫入 accessToken 與 refreshToken 的 payload。這讓同一個使用者可以在多台裝置各自登入、各自持有一組獨立的 refresh token，登出或 refresh 只影響「當下這個 session」，不會互踢其他裝置。

### refreshToken 存於 Redis

Key 格式：**`refresh:{userId}:{sessionId}`**，value 為 refreshToken 字串本身，TTL 7 天（`60 * 60 * 24 * 7` 秒）。

`POST /auth/refresh` 流程：
1. 驗證 `refreshToken` 簽章（`verifyRefreshToken`），失敗直接回 401
2. 用 payload 的 `id`、`sessionId` 組出 Redis key，比對 Redis 中儲存的值是否與傳入的 refreshToken **完全相等**——這一步讓伺服器可以主動讓某個 refreshToken 失效（例如 rotate 後舊的不再有效，或帳號被停用時整批刪除）
3. 確認使用者存在且未被停用
4. **Rotate**：沿用同一個 `sessionId`（代表同一台裝置的續期），簽發新的 accessToken + refreshToken，覆寫 Redis 中該 key 的值
5. 回傳 `{ accessToken, refreshToken }`（新的一組）

**舊格式相容**：沒有 `sessionId` 的 token，對應的 Redis key 是沒有 session 後綴的 `refresh:{userId}`。`/auth/refresh` 判斷 payload 是否缺少 `sessionId`（`isLegacyToken`），若是則沿用舊 key 查詢，refresh 成功後順便補上一個新的 `sessionId` 並清掉舊格式的 key，使用者不會被強制登出重新登入。

### 停用帳號時的全裝置登出

`POST /users/me/deactivate`（`server/src/routes/users.js`）驗證密碼成功、將 `deactivatedAt` 寫入後，呼叫 `auth.js` 匯出的 `deleteAllUserSessions(userId)`：用 `redis.scan`（而非 `KEYS`，避免阻塞整個 Redis）掃出該使用者所有 `refresh:{userId}:*` key 加上舊格式 key 一次性 `DEL`，讓所有裝置的登入立即失效。前端 `useAuthStore.deactivateAccount(password)` 呼叫此 API 成功後自動登出並清空私人 store。

---

## `axiosClient` 的自動帶 token 與 401 處理

`src/shared/api/axiosClient.js`：

- **Request interceptor**：每個 request 自動從 `tokenManager.get()`（`localStorage.pm_access_token`）取出 token，若存在則帶入 `Authorization: Bearer <token>`
- **Response interceptor**（成功 case 只回傳 `res.data`，錯誤 case 分三種）：
  1. **401 且本地無 token**：代表未登入呼叫了受保護端點，屬預期行為，靜默包裝成 rejected Promise，不跳轉、不彈錯誤
  2. **401 且本地有 token、且該 request 尚未重試過**（`!original._retry`）：判定為 accessToken 過期，嘗試用 `pm_refresh_token` 呼叫 `/auth/refresh`。用 `_isRefreshing` 旗標防止多個並發請求同時觸發 refresh；後到的請求推進 `_refreshQueue` 排隊等候，refresh 完成後統一 resolve/reject 並重放原請求。refresh 成功則更新兩個 token（**必須同步覆寫 `pm_refresh_token`**，因為後端每次 refresh 都會 rotate 掉舊的，若不同步下次過期時舊 refreshToken 已失效，會直接被強制登出）；refresh 失敗（含本地根本沒有 `pm_refresh_token`）則清除兩個 token 並 `window.location.replace('/login')`
  3. 其他狀態碼：組裝成統一格式的 `Error` 並 reject，`message` 優先取後端回傳的 `error.response.data.message`

---

## `ProtectedRoute` / `PublicOnlyRoute` 路由守衛

- **`src/app/ProtectedRoute.jsx`**：讀 `useAuthStore(s => s.loggedIn)`。未登入時**不會直接導頁**，而是在原路由位置疊一層全螢幕遮罩 Modal（「需要登入才能繼續」），提供「取消」（設定本地 `cancelled` state，取消後改為 `<Navigate to="/" replace />`）與「登入」（導向 `/login?redirectTo=<目前路徑>`）兩個選項；顯示 Modal 期間用 `useScrollLock` 鎖住背景捲動。
- **`src/app/PublicOnlyRoute.jsx`**：邏輯較單純，`loggedIn` 為 true 時直接 `<Navigate to="/" replace />`，否則渲染 `children ?? <Outlet />`；用於 `/login`、`/register`、`/forgot-password`，避免已登入使用者再次看到這些頁面。

兩者皆掛在 `src/app/router.jsx` 對應路由的 `element` 位置，作為該分支子路由共用的守衛層。

---

## 登入後兩階段初始化

App 啟動（`src/app/App.jsx`）與登入／註冊成功（`useAuthStore` 內部的 `initPrivateStores`）都遵循同一套「先公開、後私人」順序，避免未登入狀態呼叫受保護端點：

1. **第一階段**（不需 token）：`authStore.init()`（用本地 token 呼叫 `GET /auth/me` 還原登入狀態，失敗則清除 token）、`serviceStore.init()`、`groupStore.init({ all: false })`、`notificationStore.init()`
2. **第二階段**（僅 `authStore.getState().getProfile()` 有值，即已登入才執行）：動態 `import()` 私人 store（`applicationStore`、`subscriptionStore`、`memberStore`、`favoriteStore`、`conversationStore`、`notificationStore`、`groupStore`）→ 平行呼叫 `init()`（`groupStore` 改為 `init({ all: true })` 取得全狀態群組）→ `conversationStore.init(userId)` → `notificationStore.startPolling(userId)` → `applicationStore.checkMissedNotifications(user)`

`App.jsx` 的啟動流程與 `useAuthStore` 內的 `initPrivateStores`/`clearPrivateStores` 各自實作了一份幾乎相同的 store 清單與 `import()` 邏輯（一份用於「App 掛載時已是登入狀態」，一份用於「使用者在當前分頁完成登入/登出」這兩種不同觸發時機），兩處都用動態 `import()` 而非靜態 import，是為了避免 `useAuthStore` 與這些私人 store 之間形成模組層級的循環依賴。

---

## 帳號軟刪除停用機制

`POST /users/me/deactivate`（`server/src/routes/users.js`）：
1. `requireAuth` 確認登入身分
2. 要求前端再次傳入密碼，用 `bcrypt.compare` 驗證
3. 已停用則直接回應「帳號已是停用狀態」（idempotent）
4. 通過驗證後，將 `user.deactivatedAt` 設為目前時間（軟刪除，不刪除任何實體資料——使用者、群組、交易紀錄皆保留）
5. 呼叫 `deleteAllUserSessions(userId)` 清除該使用者在 Redis 中所有裝置的 refresh token session

前端 `useAuthStore.deactivateAccount(password)` 呼叫成功後立即在本地登出（清除 token、`clearPrivateStores()`），由 `SettingsTab.jsx`（帳號設定頁「其他設定」分頁）觸發，要求使用者輸入密碼確認後才呼叫。

之後任何登入或 refresh 嘗試都會在對應 route 檢查 `deactivatedAt` 並回 `403 { code: 'ACCOUNT_DEACTIVATED' }`。若使用者想恢復帳號，目前只能聯絡客服人工處理，前端沒有自助恢復流程。
