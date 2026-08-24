# ADR-0004：用 Cloudflare Worker 讓前後端變成同源

**狀態**：已採用
**日期**：2026-08-11（與 [ADR-0003](0003-refresh-token-in-httponly-cookie.md) 同一次改動一起上線）

## 背景

前端部署在 Cloudflare，後端部署在 Render，兩者網域天生不同。一旦 refreshToken 改成 HttpOnly Cookie（見 ADR-0003），就得處理跨站 Cookie 的傳送規則：`SameSite=None` 才能讓跨網域請求帶上 Cookie，但 `SameSite=None` 必須搭配 `Secure`，且部分瀏覽器（尤其 Safari 的隱私防護、無痕模式）會直接封鎖第三方 Cookie，讓跨站 Cookie 方案在實務上不穩定。

## 決策

在 Cloudflare Worker（`worker/index.js`）加一層反向代理，把所有 `/api/*` 請求轉發到 Render 上的後端，讓瀏覽器看到的前後端是同一個 origin。

## 理由

- 同源之後，Cookie 只需要一般的 `SameSite=Lax`，不用處理跨站 Cookie 的相容性問題，也不受瀏覽器第三方 Cookie 封鎖政策影響
- Cloudflare Worker 本身無伺服器、按請求計費，不需要額外維運一台獨立的反向代理主機
- 不需要修改後端 CORS 設定成允許任意跨網域帶憑證的請求（這種設定本身也是一種需要小心處理的攻擊面）

## 取捨

- 多一層反向代理，代表多一個可能故障的環節；Worker 本身出問題會讓所有 API 請求跟著中斷
- 除錯時網路請求會多一跳，需要同時檢查 Worker 跟 Render 兩邊的 log 才能定位問題

## 未來

如果之後前後端改用同一個平台部署（例如都搬到 Cloudflare 或都搬到同一個雲端服務下的同網域），可以拿掉這層代理，直接讓前端打後端。
