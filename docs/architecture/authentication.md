# 認證機制

## 概覽

採用 JWT accessToken + refreshToken 雙 token 設計：

- **accessToken**：存於前端 `localStorage`，有效期短，隨每次請求以 `Authorization: Bearer` header 帶入
- **refreshToken**：存於後端簽發的 HttpOnly Cookie（前端完全碰不到內容），有效期長，後端另存一份於 Redis 供驗證比對與主動失效控制

正式環境前後端透過同一個反向代理變成同一個 origin，Cookie 用一般的 `SameSite=Lax` 即可，不需處理跨站 Cookie 的相容性問題。

## 登入 / 註冊 / 登出

註冊與登入流程一致：驗證輸入 → 密碼雜湊比對 → 簽發一組 accessToken 與 refreshToken → 寫入 Redis session → 回傳給前端。登入時會檢查帳號是否已被軟刪除停用。登出只會讓「目前這台裝置」的 session 失效，其他裝置不受影響。

> Google OAuth 目前僅為前端預留位置，尚未串接。

## 多裝置 session 與 refresh 機制

每次登入會產生一個獨立的 session 識別碼，讓同一使用者可以在多台裝置各自維持獨立登入狀態；登出或換發新 token 只影響當下這個 session。換發新 token（refresh）採 rotation 機制：每次都會產生新的一組 token 並讓舊的 refreshToken 失效。帳號被停用時，後端會一次性清除該使用者在所有裝置的 session，讓所有裝置立即登出。

## 前端自動處理

前端的 API 呼叫層會自動附加 token，並在收到「登入已過期」的回應時嘗試自動換發新 token 後重放原請求；多個並發請求同時過期時會排隊處理，避免重複換發。若換發也失敗，則清除本地憑證並導向登入頁。

## 路由守衛

需登入頁面在未登入時不會直接跳轉，而是顯示「需要登入才能繼續」的提示，讓使用者選擇取消或前往登入；登入/註冊等公開頁面則在已登入時自動導回首頁。管理員後台則是第三種守衛：條件不符時直接靜默導回首頁，不顯示登入提示，避免透露這個路由的存在；管理員登入成功後會直接導向後台而非首頁。

App 啟動與登入成功後都遵循「先公開資料、後私人資料」的順序初始化前端狀態，避免未登入狀態呼叫受保護端點，詳見 [前端架構](./frontend.md)。

## Security Consideration

| 風險 | 取捨 |
|------|------|
| **accessToken 存 localStorage 的 XSS 風險** | 頁面若被注入惡意 script 可直接讀走 accessToken。靠**短效期（15 分鐘）**限制風險範圍；後端 API 有設 `helmet()`（含預設 CSP），但只保護 API 回應本身——前端 SPA 的 HTML 由 Cloudflare 靜態資源服務直接回傳，目前**沒有另外設定 CSP**，這是已知、尚未補強的限制 |
| **refreshToken 用 HttpOnly Cookie** | 即使前端被 XSS，攻擊者偷到的 accessToken 有效期短，且完全碰不到 refreshToken 內容（`HttpOnly` 讓它對 `document.cookie` 不可見），無法用它換發新 token 延長攻擊窗口 |
| **CSRF 與 SameSite** | refreshToken Cookie 設 `SameSite=Lax`，前提是前後端同源（Cloudflare Worker 反向代理 `/api/*`）。`SameSite=Lax` 擋掉跨站 POST 請求帶上這顆 Cookie（只有頂層導覽的 GET 才會帶），`/auth/refresh` 是 POST，第三方網站無法用簡單 CSRF 手法觸發換發。目前沒有額外實作 CSRF token 機制，完全依賴同源 + `SameSite=Lax` 這個組合 |
| **Token 生命週期** | accessToken 15 分鐘；refreshToken 較長效但採 rotation（每次換發都作廢舊的），單一 refreshToken 洩漏的可用時間也有上限 |

## 帳號軟刪除停用

使用者可在確認密碼後停用自己的帳號，此為軟刪除（不刪除任何實體資料），並會清除該帳號所有裝置的登入 session。停用後的帳號無法登入，目前僅能聯絡客服人工恢復。
