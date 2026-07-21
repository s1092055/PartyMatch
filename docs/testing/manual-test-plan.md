# 手動測試計畫

## 測試目的

本文件用於作品集展示 / 面試前的功能驗證，確保 PartyMatch 主要功能（媒合 → 申請 → 審核 → 付款代管與確認 → 啟用服務 → 續訂/結束）在本地環境可正常運作，並記錄過程中發現的問題（見 [`bug-log.md`](./bug-log.md)）。

---

## 測試環境

- **前端**：`npm run dev`，http://localhost:5173（Vite）
- **後端**：`cd server && npm run dev`，http://localhost:3001（Express，`--watch` 自動重啟）
- **資料庫**：MySQL 8+，需先 `npm run db:push` 同步 schema
- **快取**：Redis 7+（refresh token session 儲存）

完整環境變數、指令與首次啟動流程見 [`../development.md`](../development.md)。

---

## 測試帳號

見 [`test-accounts.md`](./test-accounts.md)。建議先執行：

```bash
cd server
npm run db:seed        # 服務目錄（若尚未執行過）
npm run db:clear        # 清空所有使用者與業務資料（含 users），保留 services；會要求輸入 yes 確認
npm run db:seed-demo    # 建立 10 個 demo 帳號（含 1 個管理員）、16 個群組、申請、通知、對話
```

---

## 測試範圍（主要功能模組）

1. **認證**：註冊、登入、登出、忘記密碼（回傳 stub 錯誤，尚未串接 email）、帳號停用（軟刪除）
2. **探索群組**：分類篩選、關鍵字搜尋、價格上限、排序，篩選條件為頁面本地 state（重新整理即重置）
3. **快速搜尋**（`/quick-match`）：免登入使用、選服務/方案/條件、配對結果
4. **建立群組**（`/create-group`）：4 步驟表單（選服務 → 選方案 → 群組設定 → 確認送出）
5. **申請加入群組**：送出即代管扣款、留言、同意條款、撤回申請（退款）
6. **團主審核申請**：核准（建群、額滿推進，不再重複扣款）、拒絕（退款，可重新申請）
7. **群組狀態機**：`recruiting → full → pending_confirmation → pending_activation → confirming → {active|disputed} → active`，以及 `cancelled` / `ended` 分支（見 [`../flows/user-flows.md`](../flows/user-flows.md)）
8. **成員名單管理**：招募期間退出/移除、鎖定後名單鎖死
9. **填寫服務帳號資訊**：表單依服務的 `sharingMethod` 動態顯示欄位（email／Apple 或 Google 家庭共享／KKBOX 地址驗證／friDay 邀請碼／無官方機制的確認勾選框，見 [`../product/service-info-requirements.md`](../product/service-info-requirements.md)），成員填寫、全員完成後自動推進
10. **啟用服務**：團主啟用、48h 確認期、主動確認、逾期自動撥款
11. **爭議申訴**：成員申訴（含附件上傳）、平台裁定（需管理員，用 `demo-admin@partymatch.test` 登入測試）；裁定逾期不會自動處理，`AdminTab` 只把逾期案件排到清單最前面並標示提醒
12. **續訂 / 結束群組**：`active` 狀態下開始新一期或結束
13. **PM幣帳戶**：儲值（模擬）、代管扣款、撥款、退款，交易紀錄
14. **收藏**：加入/移除收藏
15. **評價系統**：成員確認服務後對團主評分留言，團主整體評價彙總
16. **訊息中心**：群組聊天室、私人 DM（含延遲曝光）、系統通知聊天室、REST polling（5 秒）
17. **通知中心**：個人通知 + 系統公告、未讀數、全部已讀、點擊導向對應 Modal、polling（10 秒）
18. **我的群組頁**：成員/團主視角切換、統計卡、篩選分頁、群組紀錄（已結束/已取消）；群組詳情 Modal 概覽只留群組資訊/規則，服務介紹與方案內容移到獨立的「服務內容」分頁；`pending_confirmation`（24h）/`confirming`（48h）倒數橫幅在切換分頁時仍會顯示，且不會重播進場動畫
19. **帳號中心**：個人資料、付款方式（最多 2 種）、其他設定（刪除帳號）；通知偏好/安全驗證為開發中佔位
20. **RWD**：手機（~390px）、平板（768px）、桌機（1280px+）版面切換

---

## 優先級分類

### P0（核心交易流程，必測）

- 建立群組 → 申請加入（代管扣款）→ 審核核准 → 名額額滿 → 鎖定群組 → 填寫服務帳號資訊 → 全員完成自動推進 → 團主啟用服務 → 確認期確認/逾期自動撥款
- 申請時PM幣餘額不足的擋下邏輯
- 名額已滿時無法申請
- 團主審核拒絕、成員撤回申請
- 招募期間退出群組 / 被團主移除（含退款與名額釋出）
- 群組鎖定後成員名單不可變動的守衛

### P1（次要功能，建議測）

- 爭議申訴流程（成員申訴、平台裁定）
- 續訂（`renew`）與結束群組（`ended`）
- 收藏群組
- 評價系統（確認服務後評分、團主整體評價彙總）
- 訊息中心（群組聊天室、DM 延遲曝光、系統通知聊天室）
- 通知中心（未讀數、已讀、點擊導向）
- 帳號設定（付款方式、刪除帳號軟刪除）
- 團主解散群組（鎖定前）

### P2（邊界情況與 RWD）

- 名額檢查併發情境（條件式 `updateMany`，一般手動測試較難重現，可略過或用兩個分頁快速點擊模擬）
- 各角色跨裝置多重登入（session 各自獨立）
- RWD：sidebar/Dock 切換、Modal 響應式版面、表單版面、卡片 grid 欄數
- 快速搜尋免登入使用、點擊申請時導向登入頁
- 群組狀態非法轉換（`ALLOWED_TRANSITIONS` 之外的狀態切換應被拒絕，一般不易透過 UI 觸發，可用 API 直接測試）

---

## 建議測試順序

1. 先跑一輪 [`core-flow-test-cases.md`](./core-flow-test-cases.md) 的 P0 主線，確認交易流程完整無誤
2. 接著跑 [`host-flow-test-cases.md`](./host-flow-test-cases.md) 與 [`member-flow-test-cases.md`](./member-flow-test-cases.md) 的角色細節（審核、移除成員、填寫帳號、申訴等）
3. 再測 [`messaging-notification-test-cases.md`](./messaging-notification-test-cases.md)（訊息與通知，依賴前面流程建立的群組聊天室）
4. 最後測 [`rwd-test-cases.md`](./rwd-test-cases.md)（可與前面流程並行，用不同裝置寬度重複關鍵頁面）
5. 過程中發現的問題記錄於 [`bug-log.md`](./bug-log.md)
