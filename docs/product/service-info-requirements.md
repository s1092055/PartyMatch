# 各服務「填寫服務資訊」欄位需求調查

這份文件記錄平台目錄裡 28 種服務真實的共享機制與應該收集的欄位（查證日期：2026-07-21）。有些服務只要 email 就能讓團主邀請加入，有些需要額外資訊（地址、邀請碼），有些官方根本沒有多人邀請功能、只能共用帳號密碼；`MemberGroupView` 的「填寫服務帳號」表單（`server/src/routes/members.js` 的 `PATCH /members/:id`，寫入 `Member.serviceInfo`）依此規格依服務動態顯示欄位，實作細節見文件最後的「實作狀態」。

## 機制分類與應收集欄位

### A. Apple Family Sharing（共用同一個 Apple 家庭群組）

| 服務 | 應收集欄位 |
|------|-----------|
| Apple TV+ | Apple ID（email） |
| Apple Music | Apple ID（email） |
| iCloud+ | Apple ID（email） |
| Apple One | Apple ID（email） |

**注意事項**：這 4 個服務共用同一套 Apple「家庭共享」機制，不是各自獨立的邀請系統。團主把成員的 Apple ID 加入自己的家庭群組後，會連帶共用 App Store／Apple Books 購買紀錄等其他項目，範圍比單一訂閱大；Apple 官方規定同一個家庭群組**一年只能更換一次成員**，撤換／踢除成員有頻率限制，是所有機制中「最重」的一種綁定，UI 上應該提醒使用者這點，避免申請退出後才發現無法重新調整。

### B. Google 家庭群組

| 服務 | 應收集欄位 |
|------|-----------|
| YouTube Premium | Google 帳戶 email |
| Google One | Google 帳戶 email |

**注意事項**：這兩個服務共用同一個 Google 家庭群組機制。跟 Apple 一樣，家庭群組成員異動也有頻率限制（官方規定一年只能變更一次），且會一併共用 Google Play 家庭媒體庫等其他權益，不是單一訂閱層級的邀請。

### C. 官方獨立邀請制（各自帳號，email 邀請，無捆綁疑慮）

| 服務 | 應收集欄位 | 備註 |
|------|-----------|------|
| Spotify（家庭／Duo） | email | 官方偶爾會做居住地址查核，同住地址若明顯不同可能被要求驗證 |
| Microsoft 365 家庭版 | Microsoft 帳戶 email | |
| Dropbox Family | email | |
| Duolingo Super Family | email 或使用者名稱 | |
| Nintendo Switch Online 家庭方案 | Nintendo Account email | |
| ChatGPT Business | 工作／個人 email | 邀請進共享工作區 |
| Cursor Teams | email | 邀請進共享工作區 |
| Notion Business | email | 邀請進 workspace |
| Canva Pro 團隊版 | email | 邀請進 Team |
| MasterClass 家庭方案 | email | |

這一組是最單純的情況：填 email，團主用官方的「邀請成員」功能寄邀請信，成員各自登入自己獨立的帳號，不影響彼此的其他資料。

### D. KKBOX 家庭方案（email 邀請＋地址驗證，較特殊）

**應收集欄位**：KKBOX 帳號 email ＋ 居住地址

官方需要成員完成「地址驗證」才能加入家庭方案，且**驗證時輸入的地址必須跟團主開通方案當下填寫的地址完全一致**（含標點、大小寫、空格）。這代表：
- 團主端在填寫服務資訊時，除了自己的 KKBOX 帳號外，也該先講清楚自己開通時填的地址格式，讓成員照抄
- 成員填寫表單除了 email，還需要一個「居住地址」欄位

來源：[KKBOX 服務中心－家庭方案相關介紹](https://help.kkbox.com/tw/zh-tw/billing/pay-types/2791?p=kkbox)、[KKBOX 服務中心－如何邀請成員加入](https://help.kkbox.com/tw/zh-tw/billing/pay-types/2788?p=kkbox)

### E. friDay影音（邀請碼交換制，不是 email）

**應收集欄位**：成員自己 friDay 帳號在「共享帳號管理」頁面產生的**邀請碼**

跟其他服務不同，friDay影音的綁定流程是雙方都要有自己的帳號，由**成員自己**先登入自己的 friDay 帳號，到「共享帳號管理」頁面產生一組邀請碼，再把這組碼交給團主，由團主輸入完成綁定——方向跟其他「host 邀請 member」的服務相反，是「member 產生碼交給 host」。

「填寫服務資訊」表單如果套用在這個服務，欄位應該是「邀請碼」而不是 email，且流程說明文字要提醒成員「先去 friDay App 產生邀請碼」這個前置動作。

來源：[friDay影音共享功能說明](https://video.friday.tw/act/sharing/)

### F. 無官方多人邀請機制，只能共用登入帳密（風險最高的一組）

| 服務 | 說明 |
|------|------|
| Netflix | 單一帳號＋多組個人化 Profile，官方無邀請陌生人共享的機制 |
| Disney+ | 同上 |
| HBO Max | 同上 |
| Crunchyroll | 同上 |
| Discord Nitro | 官方僅有單人訂閱，目錄本身已註記為「帳號共享」 |
| Claude Pro | Anthropic 消費者版 Pro 無多席位方案（多席位的 Team 方案未收錄於本目錄） |
| Midjourney（Standard／Pro） | 官方僅「Team」方案才有多帳號＋管理員功能，此目錄收錄的是消費者版 Standard/Pro，無官方邀請機制 |
| Adobe CC「全應用程式」 | **此為個人版 All Apps 方案（非 Adobe Teams 企業版）**，Adobe 個人版沒有任何合法的多人邀請機制 |
| NordVPN／ExpressVPN | `maxSeats` 實際上是「裝置數上限」而非人數，官方只有一組登入帳密，同時連線的裝置數共用同一個上限 |

**應收集欄位**：這組服務沒有「填寫資訊給團主邀請」這回事——如果要讓 PartyMatch 上的陌生人真的合購，實務上只能是團主把帳號密碼直接給成員。**這個問題已經解決**：團主鎖定群組時透過結構化表單（`LockGroupCredentialsModal.jsx`＋`hostCredentialFields.js`）填寫依服務別定義的帳密欄位，存進 `Group.sharedCredentials`，成員端畫面直接顯示（套浮水印）。這組服務成員不用「填寫」任何帳號資訊，只需要「提取」團主已提供的帳密並勾選確認，因此 UI 文案（按鈕、banner、通知）皆改用「提取帳號資訊」而非「填寫服務帳號」，跟其他 5 組需要成員自行輸入 email／邀請碼的情境區隔開來，見下方「實作狀態」。

**特別提醒**：
- Adobe CC「全應用程式」如果真的用共用帳密的方式合購，其實已經違反 Adobe 的個人授權條款，是所有服務中風險最高的一項；`hostCredentialFields.js` 對 Adobe CC 額外加了 ToS 風險警語
- NordVPN／ExpressVPN 共用帳密之外還要協調「裝置連線數」不要超過上限，`hostCredentialFields.js` 已針對這兩個服務多加一個「裝置名額」欄位

## 總結：三種「填寫服務資訊」欄位型態

1. **email 邀請型**（組 A、B、C）：現有的單一 `email` 欄位已經夠用，只是要分清楚哪些服務（組 A/B）背後其實是綁定到 Apple／Google 整個家庭群組，UI 文案應該提醒使用者這點差異
2. **email + 額外欄位型**（組 D）：KKBOX 需要多一個「居住地址」欄位，且要顯示團主的地址供成員比對
3. **邀請碼型**（組 E）：friDay影音需要把欄位從 email 換成「邀請碼」，且流程方向是反過來的（member 先產生碼）
4. **團主結構化帳密分享型**（組 F）：沒有官方邀請機制，改成團主鎖定群組時填寫結構化帳密表單（依服務別定義欄位），成員端畫面直接顯示，不套用「email 邀請」表單；成員只需「提取帳號資訊」並勾選確認，UI 文案跟其他組的「填寫服務帳號」區分開來

## 實作狀態（已完成）

上述分類已經落地成程式碼：

- `src/common/data/serviceCatalog.js` 每個 service 都加了 `sharingMethod` 欄位（`apple_family` / `google_family` / `email_invite` / `email_invite_with_address` / `invite_code` / `shared_credentials`），對應上面 A～F 六組分類。這個欄位只存在本地 catalog，不需要後端 schema 變更——`useServiceStore.init()` 合併 API 資料時是用 `{ ...local, ...apiService }` 的展開順序，後端回應沒有 `sharingMethod` 這個 key，所以不會覆蓋掉本地值
- `src/common/utils/serviceInfoFields.js` 是欄位設定的唯一來源：`SHARING_METHOD_CONFIG` 定義每種機制要收哪些欄位（含 type：`email`/`text`/`checkbox`）跟要顯示的提醒文案；`hasFilledServiceInfo(serviceInfo, sharingMethod)` 判斷是否已填妥；`getServiceInfoSummary(serviceInfo, sharingMethod)` 給聊天室訊息卡片、團主審核清單等處顯示單行摘要用
- 成員端 `src/features/subscriptions/components/FillServiceInfoModal.jsx` 讀 `sharingMethodConfig.fields` 動態渲染欄位（KKBOX 會多一個地址欄位、friDay影音欄位換成邀請碼）
- `MessageBubble.jsx`、`ActivateServiceModal.jsx`、`ReportServiceIssueModal.jsx`、`buildMemberInfoPanel.jsx`、`SubscriptionCard.jsx` 皆使用 `hasFilledServiceInfo`/`getServiceInfoSummary` 判斷與顯示服務帳號填寫狀態

**組 F（無正式邀請機制）目前的處理方式**：團主鎖定群組時透過 `LockGroupCredentialsModal.jsx` 填寫結構化帳密表單（`hostCredentialFields.js` 依服務別定義欄位，例如 Netflix 多一個 Profile 名稱、VPN 服務多一個裝置名額），並顯示帳密外流風險提醒（`CREDENTIAL_RISK_NOTICE`）；填完的內容存進 `Group.sharedCredentials`（JSON 字串），成員在 `FillServiceInfoModal.jsx` 會直接看到（`parseHostCredentials` 解析，套 `CredentialWatermark` 浮水印，提醒不要截圖轉傳）。
