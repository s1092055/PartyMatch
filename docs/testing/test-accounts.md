# 測試帳號清單

本文件列出 `server/prisma/seedDemo.js` 建立的 demo 帳號，供手動測試使用。全部帳號完全自給自足（不依賴任何外部既有帳號），密碼皆為 `Demo1234`。

## 如何建立這些帳號

```bash
cd server
npm run db:clear      # 清空所有使用者與業務資料（含 users），保留 services 種子資料；會要求輸入 yes 確認
npm run db:seed-demo   # 建立 10 個 demo 帳號 + 16 個涵蓋各種狀態的群組
```

執行前必須先跑過 `npm run db:seed` 建立服務目錄（`netflix`、`notion`、`spotify` 等），否則會拋出「找不到服務」錯誤（`npm run db:clear` 不會清掉 services，通常只要第一次建置環境時跑過一次即可）。

`seedDemo.js` 假設是在乾淨的資料庫上執行（跑在已有資料的 DB 上會重複建立群組），重複執行前請先 `npm run db:clear`。

---

## 帳號規劃：為什麼是 10 個帳號

規劃時把「需要測試的功能」拆成三種身分需求，分別對應不同數量的帳號：

1. **多個團主身分**（demo7～demo9，3 個）：需要至少 3 個不同的團主帳號，才能测試「同一使用者同時是這個群組的團主、又是另一個群組的一般成員」這種身分交錯的情境，也才能驗證各團主獨立的收款管理、審核紀錄不會互相污染
2. **多個成員身分，餘額與信用分數要有落差**（demo1～demo6，6 個）：像 Spotify（6 人）、Nintendo（8 人）這種高名額方案需要足夠多不同成員才能測滿員；同時要有信用分數與PM幣餘額橫跨高/中/低，才能測「信用分數門檻篩選」「餘額不足擋下申請」等邊界情境
3. **獨立的管理員身分**（demo-admin，1 個）：申訴裁定（`POST /groups/:id/adjudicate`）與帳號中心「管理員」分頁只有 `isAdmin: true` 的帳號能操作，且應該跟一般團主/成員的日常操作分開，避免測試時混淆「這是用管理員身分做的，還是團主身分做的」

3 + 6 + 1 = 10 個帳號，是目前功能範圍下最少但足以覆蓋所有角色交錯情境的數量。

---

## 團主帳號（demo7～demo9）

| Email | 姓名 | PM幣餘額 | 主要身分 |
|-------|------|----------|----------|
| demo7@partymatch.test | 吳志豪 | 5000（起始，會依 seed 扣款變動） | G1（Netflix）、G4（Disney+）、G8（Google One）、G15（Google One）的團主；同時是 G6（ChatGPT Team）、G9（KKBOX）、G13（Cursor）的成員 |
| demo8@partymatch.test | 許雅涵 | 4000 | G3（Spotify）、G6（ChatGPT Team）、G9（KKBOX）、G11（Duolingo）、G16（friDay影音）的團主 |
| demo9@partymatch.test | 劉建成 | 3000 | G5（HBO Max）、G7（ExpressVPN）、G10（Discord）、G14（Apple Music）的團主 |

## 一般成員帳號（demo1～demo6）

| Email | 姓名 | 信用分數 | PM幣餘額 | 適合測試情境 |
|-------|------|----------|----------|--------------|
| demo1@partymatch.test | 王小明 | 100 | 2000 | 一般正常流程；信用分數為滿分預設值 100 |
| demo2@partymatch.test | 林小美 | 73（原 88，因 G11 被移除扣 15 分） | 1500 起 | 信用分數中等偏低，可測「信用分數門檻篩選」情境（低於 G12 Canva 群組的 `minCreditScore: 70` 門檻仍可通過，用來對照 demo6） |
| demo3@partymatch.test | 陳大文 | 72 | 500 起 | 信用分數接近門檻邊界（G12 門檻 70，剛好可通過）；PM幣餘額偏低，可測試餘額不足情境（申請高單價群組時） |
| demo4@partymatch.test | 張雅婷 | 100 | 3000 | 信用分數滿分、PM幣餘額充足；同時也是 G2（Notion）、G13（Cursor）的團主，可測團主視角 |
| demo5@partymatch.test | 李冠宇 | 95 | 4000 起（涵蓋 G2/G3/G5/G13/G16 多筆代管扣款，初始餘額需夠高避免變負數） | 一般中等帳號，用於補足多人群組成員 |
| demo6@partymatch.test | 黃詩涵 | 60 | 200 | **信用分數最低、PM幣餘額最少**——可測「信用分數低於群組門檻被擋下申請」（G12 Canva 門檻 70，此帳號 60 分不符）、「PM幣餘額不足無法申請」（餘額僅 200 PM）；同時也是 G7（ExpressVPN）申訴中的成員 |

## 管理員帳號

| Email | 姓名 | 說明 |
|-------|------|------|
| demo-admin@partymatch.test | 平台管理員 | `isAdmin: true`，唯一具備管理員權限的 seed 帳號；不參與任何一般群組（不是任何群組的團主或成員），純粹用來測試 `AdminTab`（帳號中心「管理員」分頁）跟 `POST /groups/:id/adjudicate` 申訴裁定 |

---

## 涵蓋的群組狀態（seed 資料一覽）

| 群組 | 服務 | 團主 | 狀態 | 用途 |
|------|------|------|------|------|
| G1 | Netflix（年繳） | demo7 | `recruiting` | 1 筆待審申請（demo1），可測審核流程；年繳計費路徑 |
| G2 | Notion | demo4 | `recruiting` | 1 位已核准成員（demo5）+ 1 筆已拒絕申請（demo6），demo7 已收藏 |
| G3 | Spotify | demo8 | `full` | 5/6 位已核准（滿）+ 1 筆已撤回申請（demo4） |
| G4 | Disney+ | demo7 | `pending_confirmation` | 已鎖定，成員（demo2）尚未填帳號資訊（`sharingMethod: shared_credentials`）；已建立聊天室，`serviceInfoDeadline` 約 1 天後 |
| G5 | HBO Max | demo9 | `pending_activation` | 成員（demo3、demo5）已填完帳號（`shared_credentials` 確認勾選），待團主啟用 |
| G6 | ChatGPT Team | demo8 | `confirming` | demo7 為成員，48h 確認期中（`confirmDeadline` 約 1.5 天後） |
| G7 | ExpressVPN | demo9 | `disputed` | demo6 申訴中（含佐證圖片），`disputeDeadline` 約 2 天後 |
| G8 | Google One | demo7 | `active` | 3 位成員（demo2、demo4、demo5）穩定運作中，`serviceInfo.googleEmail` 已填 |
| G9 | KKBOX | demo8 | `active` | demo7、demo3、demo1 為成員（`serviceInfo` 含 email + 地址，對應 `email_invite_with_address`）；demo6 曾退出（狀態 `left`） |
| G10 | Discord | demo9 | `cancelled` | 鎖定前解散，demo4、demo5 已全額退款 |
| G11 | Duolingo | demo8 | `ended` | 完整跑完一輪；demo2 曾被移除（信用分數已扣 15 分） |
| G12 | Canva | demo6 | `recruiting` | 設 `minCreditScore: 70` 門檻。注意：目前後端申請邏輯（`server/src/routes/applications.js`）**並未實作信用分數門檻檢查**，`minCreditScore` 目前只用於前端顯示/篩選；若要驗證「低分被擋」情境，需先確認實際程式碼是否已補上該檢查，或手動用 Prisma Studio 把某帳號信用分數改到 70 以下再測試申請流程。demo3（72 分）可用來測試「剛好高於門檻，可正常申請」的邊界情況 |
| G13 | Cursor | demo4 | `confirming` | demo7、demo5 皆未確認，測試「確認後尚有人未確認」分支；已有一則聊天室訊息 |
| G14 | Apple Music | demo9 | `pending_confirmation` | `sharingMethod: apple_family`；demo1 已填 Apple ID，demo2 尚未填，用來測試家庭共享提醒文案跟部分填寫狀態 |
| G15 | Google One | demo7 | `pending_confirmation` | `sharingMethod: google_family`；demo3 尚未填 Google 帳戶 |
| G16 | friDay影音 | demo8 | `pending_confirmation` | `sharingMethod: invite_code`；demo5 尚未填邀請碼，用來測試「邀請碼」欄位與反向綁定流程說明文案 |

系統公告（`isPublic: true`）1 則：平台維護公告，訪客與會員皆可見。

另建立：demo7 → demo8 的 DM 私訊（demo7 已讀、demo8 有 1 則未讀）；demo7 的 2 張信用卡付款方式、demo1 的 1 張。

各服務對應的 `sharingMethod` 完整分類與欄位設計見 [各服務填寫帳號資訊需求調查](../product/service-info-requirements.md)；G9（KKBOX，`email_invite_with_address`）跟其餘 `shared_credentials`/`email_invite` 服務的填寫表單可直接用 G4/G5/G7/G8/G9 等既有群組測試，不需要另外建資料。
