# 測試帳號清單

本文件列出 `server/prisma/seedDemo.js` 建立的 demo 帳號，供手動測試使用。

## 如何建立這些帳號

```bash
cd server
# 需先在 server/.env 設定 DEMO_REAL_USER_EMAILS（見下方「既有真實帳號」）
node prisma/seedDemo.js
# 或
npm run db:seed-demo
```

`seedDemo.js` **不會刪除既有資料**，重複執行前建議先 `npm run db:clear-data`（保留 users / services）以避免重複建立群組。執行前必須先跑過 `npm run db:seed` 建立服務目錄（`netflix`、`notion`、`spotify` 等），否則會拋出「找不到服務」錯誤。

---

## Demo 帳號（密碼皆為 `Demo1234`）

| Email | 姓名 | 信用分數 | PM幣餘額 | 適合測試情境 |
|-------|------|----------|----------|--------------|
| demo1@partymatch.test | 王小明 | 105 | 2000 | 一般正常流程；信用分數略高於預設值 100 |
| demo2@partymatch.test | 林小美 | 88 | 1500 | 信用分數中等偏低，可測「信用分數門檻篩選」情境（低於 G12 Canva 群組的 `minCreditScore: 70` 門檻仍可通過，用來對照 demo6） |
| demo3@partymatch.test | 陳大文 | 72 | 500 | 信用分數接近門檻邊界（G12 門檻 70，剛好可通過）；PM幣餘額偏低，可測試餘額不足情境（申請高單價群組時） |
| demo4@partymatch.test | 張雅婷 | 120 | 3000 | 信用分數最高、PM幣餘額充足；同時也是 G2（Notion）、G13（Cursor）的團主，可測團主視角 |
| demo5@partymatch.test | 李冠宇 | 95 | 1000 | 一般中等帳號，用於補足多人群組成員 |
| demo6@partymatch.test | 黃詩涵 | 60 | 200 | **信用分數最低、PM幣餘額最少**——可測「信用分數低於群組門檻被擋下申請」（G12 Canva 門檻 70，此帳號 60 分不符）、「PM幣餘額不足無法申請」（餘額僅 200 PM）；同時也是 G7（ExpressVPN）申訴中的成員 |

---

## 既有真實帳號（U1 / U2 / U3）

`seedDemo.js` 不會建立新帳號，而是把 `server/.env` 的 `DEMO_REAL_USER_EMAILS=email1,email2,email3` 指定的 3 個既有帳號的 PM幣餘額重設為：

| 角色 | PM幣餘額 | 主要身分（依 seed 資料） |
|------|----------|--------------------------|
| U1（第 1 個 email） | 5000 | 多個群組的團主（G1 Netflix、G4 Disney+、G8 Google One）；同時是 G6（ChatGPT Team，`confirming`）、G9（KKBOX，`active`）、G13（Cursor，`confirming`）的成員 |
| U2（第 2 個 email） | 4000 | G3（Spotify，`full`）、G6（ChatGPT Team）、G9（KKBOX）、G11（Duolingo，`ended`）的團主 |
| U3（第 3 個 email） | 3000 | G5（HBO Max，`pending_activation`）、G7（ExpressVPN，`disputed`）、G10（Discord，`cancelled`）的團主 |

若沒有既有帳號可用，先用 `/register` 自行註冊 3 個帳號，再把 email 填入 `server/.env` 後執行 seed。

---

## 涵蓋的群組狀態（seed 資料一覽）

| 群組 | 服務 | 團主 | 狀態 | 用途 |
|------|------|------|------|------|
| G1 | Netflix（年繳） | U1 | `recruiting` | 1 筆待審申請（demo1），可測審核流程；年繳計費路徑 |
| G2 | Notion | demo4 | `recruiting` | 1 位已核准成員（demo5）+ 1 筆已拒絕申請（demo6），U1 已收藏 |
| G3 | Spotify | U2 | `full` | 5/6 位已核准（滿）+ 1 筆已撤回申請（demo4） |
| G4 | Disney+ | U1 | `pending_confirmation` | 已鎖定，成員（demo2）尚未填帳號資訊；已建立聊天室 |
| G5 | HBO Max | U3 | `pending_activation` | 成員（demo3、demo5）已填完帳號，待團主啟用 |
| G6 | ChatGPT Team | U2 | `confirming` | U1 為成員，48h 確認期中（`confirmDeadline` 約 1.5 天後） |
| G7 | ExpressVPN | U3 | `disputed` | demo6 申訴中（含佐證圖片），`disputeDeadline` 約 2 天後 |
| G8 | Google One | U1 | `active` | 3 位成員（demo2、demo4、demo5）穩定運作中 |
| G9 | KKBOX | U2 | `active` | U1、demo3、demo1 為成員；demo6 曾退出（狀態 `left`） |
| G10 | Discord | U3 | `cancelled` | 鎖定前解散，demo4、demo5 已全額退款 |
| G11 | Duolingo | U2 | `ended` | 完整跑完一輪；demo2 曾被移除（信用分數已扣 15 分） |
| G12 | Canva | demo6 | `recruiting` | 設 `minCreditScore: 70` 門檻。注意：目前後端申請邏輯（`server/src/routes/applications.js`）**並未實作信用分數門檻檢查**，`minCreditScore` 目前只用於前端顯示/篩選；若要驗證「低分被擋」情境，需先確認實際程式碼是否已補上該檢查，或手動用 Prisma Studio 把某帳號信用分數改到 70 以下再測試申請流程。demo3（72 分）可用來測試「剛好高於門檻，可正常申請」的邊界情況 |
| G13 | Cursor | demo4 | `confirming` | U1、demo5 皆未確認，測試「確認後尚有人未確認」分支；已有一則聊天室訊息 |

系統公告（`isPublic: true`）1 則：平台維護公告，訪客與會員皆可見。

另建立：U1 → U2 的 DM 私訊（U1 已讀、U2 有 1 則未讀）；U1 的 2 張信用卡付款方式、demo1 的 1 張。

---

## 管理員帳號

`seedDemo.js` 建立的所有帳號 `isAdmin` 皆為預設值 `false`（`server/prisma/schema.prisma` 的 `User.isAdmin` 預設 `false`），**沒有任何 seed 帳號具備管理員權限**。

若要測試管理員功能（例如 `POST /groups/:id/adjudicate` 爭議裁定、帳號中心的「管理員」分頁），需自行手動操作資料庫：

```bash
cd server
npx prisma studio   # 開啟 http://localhost:5555
```

在 Prisma Studio 的 `users` table 找到要測試的帳號（例如 demo4），把 `isAdmin` 欄位改為 `true` 後儲存。
