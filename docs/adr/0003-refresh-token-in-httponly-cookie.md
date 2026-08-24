# ADR-0003：refreshToken 存 HttpOnly Cookie＋Redis session，不是純 JWT stateless

**狀態**：已採用
**日期**：2026-08-11（從純 localStorage 存放遷移過來）

## 背景

早期版本的 accessToken 與 refreshToken 都存在前端 `localStorage`。這個做法實作簡單，但 refreshToken 有效期長達 7 天，一旦網站存在 XSS 漏洞，攻擊者用惡意腳本讀走 `localStorage` 裡的 refreshToken，就能長期冒充使用者身分，风险遠高於存活期只有 15 分鐘的 accessToken。

## 決策

accessToken 仍存 `localStorage`（存活期短，隨每次請求以 `Authorization: Bearer` 帶入）；refreshToken 改為後端簽發的 **HttpOnly Cookie**（`pm_refresh_token`，`path=/api/auth`），前端 JavaScript 完全無法讀取內容，靠瀏覽器 `withCredentials` 自動帶上；後端同時把它存一份到 Redis 供驗證比對與主動失效控制（支援單一裝置登出、帳號停用時全裝置登出）。

## 理由

- HttpOnly Cookie 從瀏覽器層級阻絕 JavaScript 讀取，即使網站存在 XSS，攻擊者也拿不到 refreshToken 本體
- accessToken 存活期短（15 分鐘），即使被 XSS 讀走，能造成的損害時間窗口有限，繼續留在 localStorage 是可接受的風險換取實作簡單度
- 搭配同源反向代理（見 [ADR-0004](0004-cloudflare-worker-same-origin-proxy.md)），Cookie 只需要 `SameSite=Lax`，不需要處理跨站 Cookie 常見的相容性問題（`SameSite=None` + `Secure` 在部分瀏覽器/隱私模式下的限制）
- Redis 存一份 session 記錄，讓後端能在帳號停用時主動讓所有裝置的 refreshToken 失效，純 stateless JWT 做不到這件事（stateless token 在過期前無法被伺服器主動撤銷）

## 取捨

- 引入 Redis 作為 session store，比純 stateless JWT 多一個需要維運的元件
- Cookie 的 `path=/api/auth` 限制了它只在 refresh 端點會被送出，減少暴露面，但也代表任何新增的認證相關端點要小心處理這個路徑限制

## 未來

如果之後前後端不再同源（例如拆成完全獨立的行動 App 後端），需要重新評估 Cookie-based 方案是否還適用，可能改回 stateless token + 短效 refresh 搭配裝置端安全儲存（如 Keychain/Keystore）。
