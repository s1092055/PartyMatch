# 後端架構

## 技術基礎

Node.js + Express，標準 middleware 鏈（安全性 headers、CORS、日誌、JSON body parser）後掛載各資源 route 與全域錯誤處理。

## Route 架構

每個後端資源對應一個 route 檔案，掛載到對應的 REST 資源路徑下。內部結構一致：以 `zod` 定義 request body schema，`try/catch` 統一交由全域錯誤處理，不在各 handler 內重複組裝錯誤格式。

## Middleware

三種驗證等級：需登入、需管理員、選擇性登入（訪客也能呼叫，登入後可看到更多資料）。另有統一的 request body 驗證 middleware 與全域錯誤處理 middleware。

## 通知建立方式

業務通知（申請狀態變化、群組狀態推進、申訴相關…）幾乎全部在後端對應動作完成的同一個 request 內直接建立，不再由前端事後補送一次通用的「建立通知」請求。

## Prisma 使用方式

Schema 定義於單一 `schema.prisma`，所有 route 透過共用的 Prisma client 存取資料庫。涉及「多個資料表需一起成功或一起失敗」的業務流程（例如申請送出時的代管扣款、申請審核、成員移除退款）一律包在 transaction 內，確保原子性；純查詢不包 transaction。

## 認證與 Redis

JWT 雙 token 設計，refreshToken 存於 Redis 以支援同一帳號多裝置各自維護獨立 session（單一裝置登出、帳號停用全裝置登出）；這是 Redis 目前唯一的用途，尚未用於一般資料快取。詳見 [認證機制](./authentication.md)。

## 檔案上傳

圖片附件（申訴佐證、聊天室與帳號資訊留言）一律由後端代理上傳至 Cloudflare R2，前端不需另外設定 R2 的 API Key；R2 bucket 為私有，資料庫只存物件 key，讀取時才即時簽發短效網址，避免網址外流變成永久可公開存取的連結。

## 錯誤處理慣例

已知的業務錯誤直接回傳對應狀態碼與訊息；未捕捉例外一律落到全域錯誤處理層統一序列化。

## 權限控管慣例

每個需要登入的 route 一律以登入者身分收斂查詢範圍：只回傳與自己相關的資料、操作前先確認資源擁有權、不信任前端傳入的敏感欄位、部分端點限管理員操作、回傳給他人看的使用者資料會先套用隱私遮罩（依使用者的大頭照顯示設定決定是否遮罩）。

完整 API 端點清單見 [API 總覽](./api-overview.md)。
