# 測試帳號清單

本文件列出 `server/prisma/seedDemo.js` 建立的 demo 帳號，供手動測試使用。全部帳號完全自給自足（不依賴任何外部既有帳號），密碼皆為 `Demo1234`。

[線上 Demo](https://partymatch.ykk910309.workers.dev)（後端：https://partymatch-api.onrender.com）的正式資料庫已灌入這批帳號，可直接登入體驗，不需要自己跑 seed。

## 這支 seed 腳本跟一般 seed 腳本的差異

`seedDemo.js` **不直接寫資料庫**，而是完全透過真實的 REST API（跟前端呼叫的端點一模一樣：註冊、儲值、申請、接受、鎖定、填寫帳號、啟用、確認、申訴、裁定……）依序驅動每個場景，確保 demo 資料的狀態、代管金額、餘額等數字都是「正式版程式碼真的跑過一次」得到的結果，而不是手動塞值模擬出來的。這也是為什麼這支腳本執行時**後端伺服器必須正在跑**（不像單純寫資料庫的 seed 腳本可以獨立執行）。

## 如何建立這些帳號

```bash
cd server
npm run dev            # 確保伺服器正在跑（另開一個終端機視窗）；若剛執行過 db:clear，
                        # 建議重啟一次伺服器，清掉系統帳號 ID 的記憶體快取（見下方說明）
npm run db:seed         # 服務目錄（若尚未執行過）
npm run db:clear        # 清空所有使用者與業務資料（含 users），保留 services；會要求輸入 yes 確認
npm run db:seed-demo    # 建立 10 個 demo 帳號（含 1 個管理員）、22 個涵蓋各種情境的群組
```

**執行前提**：
1. 後端伺服器要在跑（`npm run dev`），因為這支腳本會打真實的 HTTP API
2. 資料庫要是乾淨的（先 `npm run db:clear`），因為使用者是用 `POST /auth/register` 建立，重複執行會因為 email 已存在而失敗
3. 服務目錄要先跑過 `npm run db:seed`
4. **`db:clear` 之後如果伺服器沒有重啟**，系統公告帳號（`system@partymatch.internal`）的 ID 會停留在伺服器記憶體的舊快取（`server/src/lib/systemUser.js` 的 `cachedSystemUserId`），指向一個已經被清空、不存在的使用者列，導致 `POST /system-messages/broadcast`（seed 最後一步的系統公告）失敗。**每次 `db:clear` 之後，重啟一次後端伺服器再跑 `db:seed-demo`**，可避免這個問題

---

## 帳號規劃：為什麼是 10 個帳號

規劃時把「需要測試的功能」拆成三種身分需求，分別對應不同數量的帳號：

1. **多個團主身分**（demo7～demo9，3 個）：需要至少 3 個不同的團主帳號，才能测試「同一使用者同時是這個群組的團主、又是另一個群組的一般成員」這種身分交錯的情境，也才能驗證各團主獨立的收款管理、審核紀錄不會互相污染
2. **多個成員身分，餘額與信用分數要有落差**（demo1～demo6，6 個）：像 Spotify（6 人）、Apple Music（6 人）這種高名額方案需要足夠多不同成員才能測滿員；同時要有信用分數與PM幣餘額橫跨高/中/低，才能測「信用分數門檻篩選」「餘額不足擋下申請」等邊界情境
3. **獨立的管理員身分**（demo-admin，1 個）：申訴裁定（`POST /groups/:id/adjudicate`）與帳號中心「管理員」分頁只有 `isAdmin: true` 的帳號能操作，且應該跟一般團主/成員的日常操作分開，避免測試時混淆「這是用管理員身分做的，還是團主身分做的」

3 + 6 + 1 = 10 個帳號，是目前功能範圍下最少但足以覆蓋所有角色交錯情境的數量。

---

## 團主帳號（demo7～demo9）

| Email | 姓名 | 主要身分 |
|-------|------|----------|
| demo7@partymatch.test | 吳志豪 | G1（Netflix）、G4（Disney+）、G8（Google One）、G15（Google One）、G_removed（MasterClass）、G20（NordVPN）的團主；同時是 G6（ChatGPT Team）、G9（KKBOX）、G13（Cursor）、G14（Apple Music）的成員 |
| demo8@partymatch.test | 許雅涵 | G3（Spotify）、G6（ChatGPT Team）、G9（KKBOX）、G10b（Crunchyroll）、G11（Duolingo）、G16（friDay影音）、G18（Microsoft 365）的團主；同時是 G19（Dropbox）的成員 |
| demo9@partymatch.test | 劉建成 | G5（HBO Max）、G7（ExpressVPN）、G10a（Discord）、G14（Apple Music）、G17（iCloud+）、G19（Dropbox）的團主；同時是 G3（Spotify）、G18（Microsoft 365）的成員 |

## 一般成員帳號（demo1～demo6）

| Email | 姓名 | 信用分數 | 適合測試情境 |
|-------|------|----------|--------------|
| demo1@partymatch.test | 王小明 | 100 | 一般正常流程；信用分數為滿分預設值 |
| demo2@partymatch.test | 林小美 | 85（原 100，因 G_removed 被移除扣 15 分） | 曾被團主移除並扣信用分數的示範帳號；也是 G19（Dropbox）申訴獲勝、退款離開群組的示範帳號 |
| demo3@partymatch.test | 陳大文 | 100 | 一般中等帳號，涵蓋多個群組的成員角色 |
| demo4@partymatch.test | 張雅婷 | 100 | 一般正常流程；同時是 G17 被團主手動加入（略過申請流程）的示範帳號 |
| demo5@partymatch.test | 李冠宇 | 100 | 曾在 G9（KKBOX）招募期間自行退出、釋出名額的示範帳號；也是 G20（NordVPN）申訴但團主獲勝的示範帳號 |
| demo6@partymatch.test | 黃詩涵 | 100 | **PM幣餘額刻意維持低額（起始只有 500，實際約 200～300）**——只用於 G7 一筆低成本申請，其餘刻意不安排任何情境，保留給測試者現場示範「餘額不足擋下申請」（例如去申請 G6 ChatGPT Team 需要 800 PM、G13 Cursor 需要 2560 PM 都會被擋下）與「信用分數門檻篩選」 |

## 管理員帳號

| Email | 姓名 | 說明 |
|-------|------|------|
| demo-admin@partymatch.test | 平台管理員 | `isAdmin: true`，唯一具備管理員權限的 seed 帳號；不參與任何一般群組（不是任何群組的團主或成員），純粹用來測試 `AdminTab`（帳號中心「管理員」分頁）跟 `POST /groups/:id/adjudicate` 申訴裁定。Seed 資料裡已經示範了兩種裁定結果：G19（成員獲勝）、G20（團主獲勝） |

---

## 涵蓋的群組狀態與情境（22 個群組一覽）

| 群組 | 服務 | 團主 | 狀態 | 用途 |
|------|------|------|------|------|
| G1 | Netflix（年繳） | demo7 | `recruiting` | 1 筆待審申請（demo1），可測審核流程；年繳計費路徑 |
| G2 | Notion | demo4 | `recruiting` | 1 位已接受成員（demo5）+ 1 筆已拒絕申請（demo3），demo7 已收藏 |
| G3 | Spotify（6 人方案） | demo8 | `full` | 5 位成員（demo1～demo4、demo9）＋團主共 6 人滿員 + 1 筆已撤回申請（demo6） |
| G4 | Disney+ | demo7 | `pending_confirmation` | 已鎖定，成員（demo2）尚未填帳號資訊（`sharingMethod: shared_credentials`）；2 人方案，1 位成員＋團主即滿員 |
| G5 | HBO Max（3 人方案） | demo9 | `pending_activation` | 2 位成員（demo3、demo5）＋團主共 3 人已全部填完帳號（確認勾選），待團主啟用 |
| G6 | ChatGPT Team | demo8 | `confirming` | demo7 為成員，尚無人確認；2 人方案，1 位成員＋團主即滿員 |
| G7 | ExpressVPN | demo9 | `disputed` | demo6 申訴中（含佐證圖片），等待管理員裁定；2 人方案，demo6 一人＋團主即滿員 |
| G8 | Google One（AI Plus） | demo7 | `active` | 2 位成員（demo2、demo4）＋團主共 3 人確認撥款完成，已有 2 則對團主的評價 |
| G9 | KKBOX（3 人方案） | demo8 | `active` | 示範「招募期間自行退出、釋出名額後由他人遞補」：demo5 曾滿員後退出，demo1 遞補後才鎖定啟用；最終成員為 demo7、demo1（＋團主共 3 人） |
| G10a | Discord | demo9 | `cancelled` | 招募中（未滿員）就解散，demo4 全額退款 |
| G10b | Crunchyroll | demo8 | `cancelled` | 滿員後才解散（demo5、demo6 兩位成員＋團主共 3 人），demo5、demo6 全額退款 |
| G11 | Duolingo | demo8 | `ended` | 完整跑完一輪（demo1、demo3 確認撥款，2 位成員＋團主共 3 人）後團主主動結束服務，demo1、demo3 各留下一則對團主的評價 |
| G_removed | MasterClass（2人方案，年繳） | demo7 | `recruiting` | demo2 招募期間被團主移除，示範信用分數扣分（100 → 85）與退款；群組本身回到 0 人的 `recruiting` |
| G12 | Canva | demo6 | `recruiting` | 設 `minCreditScore: 70` 門檻，尚無人申請。注意：目前後端申請邏輯（`server/src/routes/applications.js`）**並未實作信用分數門檻檢查**，`minCreditScore` 目前只用於前端顯示/篩選 |
| G13 | Cursor | demo4 | `confirming` | demo7 已確認、demo5 尚未確認（2 位成員＋團主共 3 人），測試「確認後尚有人未確認、個人視角提前顯示已啟用」的分支 |
| G14 | Apple Music（家庭方案 6 人） | demo9 | `pending_confirmation` | `sharingMethod: apple_family`；5 位成員（demo1～demo4、demo7）＋團主共 6 人全新鎖定尚未填寫，測試 Apple 家庭共享提醒文案 |
| G15 | Google One（100GB） | demo7 | `pending_confirmation` | `sharingMethod: google_family`；demo3 尚未填寫 Google 帳戶；2 人方案，demo3 一人＋團主即滿員 |
| G16 | friDay影音 | demo8 | `pending_confirmation` | `sharingMethod: invite_code`；demo5 尚未填寫邀請碼，測試反向綁定流程說明文案；2 人方案，demo5 一人＋團主即滿員 |
| G17 | iCloud+ | demo9 | `recruiting` | 示範團主手動加入成員（`POST /members`，略過申請流程）：demo4 已被加入，仍有 1 個空位開放一般申請 |
| G18 | Microsoft 365（家庭 6 人） | demo8 | `pending_confirmation` | 已完整跑完第 1 期（5 位成員＋團主共 6 人全部確認撥款後 `active`），團主接著呼叫續訂（`/renew`），現在是第 2 期的 `pending_confirmation`，帳號資訊已清空重新等待填寫 |
| G19 | Dropbox（Family 6 人） | demo9 | `active` | 5 位成員＋團主共 6 人啟用後 demo2 申訴，管理員裁定「**成員獲勝**」：demo2 已退款並移出群組，剩餘成員不受影響；demo1、demo4 各留下一則對團主的評價 |
| G20 | NordVPN | demo7 | `active` | demo5 申訴，管理員裁定「**團主獲勝**」：代管全額撥款給團主，demo5 仍留在群組內；demo3、demo5 各留下一則對團主的評價 |

另外還建立了：系統公告 1 則（透過管理員帳號的 `POST /system-messages/broadcast` 真實廣播 API）；demo7 → demo8 的 DM 私訊（一來一往 2 則訊息）；demo7 的 2 張信用卡付款方式、demo1 的 1 張；每個已鎖定群組都有對應的群組聊天室（含開場白訊息）；申請/接受/拒絕/額滿/開聊天室/啟用/撥款/申訴/退出/移除/解散/結束/續訂等關鍵動作都有建立對應的通知（`Notification`），可直接用來測試通知中心。

各服務對應的 `sharingMethod` 完整分類與欄位設計見 [各服務填寫帳號資訊需求調查](../product/service-info-requirements.md)。

## 無法透過現有 API 做到、seed 腳本裡唯二直接寫資料庫的例外

- **`isAdmin` 旗標**：沒有任何路由能設定使用者的管理員權限，`demo-admin` 帳號註冊後直接用 Prisma 補一次
- **信用分數增減**：目前系統本身還沒有任何會員行為會觸發信用分數變動的路由（`adjustCreditScore` 在前端只是空函式），示範「被移除扣分」情境（G_removed）時用 Prisma 直接調整 demo2 的信用分數

除了這兩項，其餘所有資料都是真實 API 呼叫的結果。
