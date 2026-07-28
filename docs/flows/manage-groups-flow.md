# 群組管理（團主視角）

## 使用者目標
團主管理自己建立的群組：審核申請、鎖定群組開始收款、啟用服務、查看收款明細、回報成員帳號問題，以及在服務期滿後決定續訂或結束群組。

## 流程圖

```mermaid
flowchart TD
    A[recruiting：審核申請] -->|接受| B[名額 -1，代管扣款]
    A -->|拒絕| A
    B --> C{名額額滿}
    C -->|是| D[full：可移除成員釋出名額]
    C -->|否| A
    D -->|移除| A
    D -->|點擊鎖定群組| E[pending_confirmation\n建立聊天室 + 設定 nextBillingDate]
    E --> F[等待全員填寫帳號資訊]
    F -->|全員完成| G[pending_activation：可啟用服務]
    G -->|ActivateServiceModal 逐一確認| H[confirming：48h 確認期]
    H -->|全員確認/逾期| I[active：查看收款明細]
    H -->|成員申訴| J[disputed：等待平台裁定]
    J --> I
    I -->|開始新一期| E
    I -->|結束服務| K[ended]
    A -->|解散群組| L[cancelled，顯示為「已解散」：全額退款]
    D -->|解散群組| L
```

## 入口
- `/manage-groups`（獨立頁面，`ManageGroupsPage.jsx`）
- 也可以從通知點擊（`new_application`/`group_full`/`group_activated`/`member_left` 等）直接開啟指定群組，並自動展開對應面板

## 相關檔案

**前端**

| 路徑 | 說明 |
|------|------|
| `src/features/manage-groups/ManageGroupsPage.jsx` | 頁面總入口 |
| `src/features/manage-groups/hooks/useHostActions.js` | 所有團主操作的事件處理（鎖定、啟用、移除成員、審核、續訂、解散等） |
| `src/features/manage-groups/components/HostGroupView.jsx` | 團主視角群組詳情 Modal，含 `pending_confirmation`/`confirming` 倒數橫幅；側邊欄「成員評價」分頁只顯示這個群組的評價，且只在群組曾經啟用過（`active`/`paused`/`ended`）才會出現；`cancelled`（已解散）狀態不顯示「成員評價」「收款管理」「群組訊息」「續訂管理」「成員資料」，因為這些階段根本沒發生過；「收款管理」分頁只要群組非 `cancelled` 就會顯示，不再限定鎖定後才出現，因為招募中期間也可能已經有代管入帳；「成員資料」分頁只在非招募中（`recruiting`/`full`）且非 `cancelled` 時顯示，因為 `Member.serviceInfo` 要鎖定群組後才有資料 |
| `src/features/manage-groups/components/HostReviewsModal.jsx` | 獨立的「我的評價」Modal，彙總團主名下**所有**群組的評價，入口從「群組管理」頁側邊欄移到帳號中心（`AccountPage.jsx` 的 Hero 區塊），跟群組詳情裡只看單一群組的「成員評價」分頁分開 |
| `src/shared/ui/primitives/CountdownText.jsx` | 顯示距 deadline 剩餘時間的小元件，逾期顯示 `expiredText` |
| `src/shared/utils/hooks.js` | `useCountdown`，每秒重算剩餘時間，純顯示用不觸發任何副作用 |
| `src/features/manage-groups/components/HostedGroupCard.jsx` | 群組卡片 |
| `src/shared/ui/FilterTabsBar.jsx` | 狀態篩選列，手機/桌機同一套橫向 underline tabs（不再是側邊欄，手機版也不再用下拉選單，3 個分類寬度放得下）；「群組紀錄」按鈕在 `ManageGroupsPage.jsx` 自己最上方的標題列，`FilterTabsBar` 本身不再處理任何額外按鈕 |
| `src/features/manage-groups/components/ActivateServiceModal.jsx` | 啟用服務前逐一確認成員帳號的 Modal |
| `src/features/manage-groups/components/ReportServiceIssueModal.jsx` | 回報成員帳號問題 |
| `src/features/manage-groups/components/RenewalModal.jsx` | 續訂管理（見續訂流程文件） |
| `src/features/manage-groups/components/hostGroupView/buildMembersPanel.jsx` | 群組名單子面板（含團主，命名不再叫「成員名單」），含移除成員 |
| `src/features/manage-groups/components/hostGroupView/buildApplicationsPanel.jsx` | 申請管理子面板，只列待審核 |
| `src/features/manage-groups/components/hostGroupView/ApplicationCard.jsx` | 單筆申請卡片，接受／拒絕 |
| `src/features/manage-groups/components/hostGroupView/buildReviewHistoryPanel.jsx` | 審核紀錄第三層面板，只列已接受／已拒絕的申請（已退出／已移除是成員異動不是審核結果，不放進來，避免名稱跟內容對不上） |
| `src/features/manage-groups/components/hostGroupView/buildBillingPanel.jsx` | 收款管理面板（見 PM幣代管流程文件） |
| `src/features/manage-groups/components/hostGroupView/buildMemberInfoPanel.jsx` | 「成員資料」分頁，團主查看每位成員填寫的服務帳號資訊，跟 `ActivateServiceModal` 成員清單同一套判斷邏輯（`hasFilledServiceInfo`/`getServiceInfoSummary`），可直接從這裡回報帳號問題（`ReportServiceIssueModal`），不用等到啟用服務那一步才能看 |
| `src/features/manage-groups/utils/hostFilters.js` | `STATUS_FILTER_TABS`（招募中/處理中/服務中三個大分類；待鎖定/成員填寫中/待啟用/確認期中/申訴中五種細分狀態都併入「處理中」——`PROCESSING_STATUSES` 定義在 `src/shared/utils/groupStatus.js`，跟 member 端共用；已移除「全部」分頁，細分階段交給卡片本身的狀態 badge 顯示）、`matchesFilter`、`calcApprovalSeatPatch` |
| `src/features/account/components/tabs/AdminTab.jsx` | 管理員裁定申訴，跨群組，非團主本人操作 |

**後端**

| 路徑 | 說明 |
|------|------|
| `server/src/routes/groups.js` | `POST /:id/lock`、`POST /:id/activate`、`POST /:id/cancel`、`POST /:id/renew`、`GET /:id/transactions`、`PATCH /:id` |
| `server/src/routes/applications.js` | `PATCH /:id`（接受／拒絕） |
| `server/src/routes/members.js` | `POST /`（團主手動加人）、`PATCH /:id`（回報帳號問題）、`DELETE /:id`（移除成員） |
| `server/src/routes/conversations.js` | `POST /group`（鎖定群組時建立聊天室） |
| `server/src/utils/membership.js` | `finalizeApprovedApplication`（接受申請）、`admitMemberIntoGroup`（團主手動加人）、`refundEscrow`（移除成員退款） |

**資料表 / Model**

| Model | 用途 |
|-------|------|
| `Group` | `status`、`currentMembers`/`maxMembers`、`escrowTokens`、`nextBillingDate` |
| `Application` | `status`（`pending`/`approved`/`rejected`） |
| `Member` | `serviceInfoIssueNote` |
| `TokenTransaction` | 收款管理面板依 `relatedGroupId` 查詢 |

## 使用技術
- **自訂 hook 抽出頁面邏輯**：`useHostActions` 把 `ManageGroupsPage.jsx` 拆成純 UI 加一個 hook，訂閱 `useGroupStore`/`useApplicationStore`/`useMemberStore` 三個 store，只要有任何一個變動就重算 `hostData`
- **`pm:open-host-group` window event**：不管是點通知還是帶著 `location.state` 進來，都會走同一個處理函式，統一設定要開哪個群組、要不要自動展開鎖定/啟用/申請管理/收款面板
- **`GroupModalShell` 三層滑動 Panel**：申請管理是第二層，審核紀錄是第三層；桌機版側邊欄在左側（`md:order-first`），手機版仍堆疊在下方
- **`headerBanner`（倒數/狀態提醒橫幅）不綁定分頁**：渲染在 `activeDetail` 判斷之外，切到群組名單／收款管理等分頁時倒數橫幅仍會顯示，不會只留在群組概覽
- **服務說明／方案說明顯示在群組概覽畫面**（`GroupOverviewContent.jsx` 的 `ServiceIntro`），跟探索頁 `GroupDetailModal` 的呈現方式統一；服務說明拆成「服務說明」「方案說明」兩個並列的大標題區塊，字級一樣大
- **群組詳情 Modal Header 顯示「服務名稱 | 方案名稱」**
- **樂觀更新 + 背景同步**：接受/拒絕申請、移除成員時會先更新本地資料，畫面立刻反應，再到背景呼叫對應 API 跟建立通知
- 鎖定群組、解散群組、移除成員這幾個不可逆的操作，都要透過 `CountdownConfirmDialog` 倒數確認才能執行
- **側邊欄 pinned 項目**：招募中（`recruiting`/`full`）時側邊欄底部固定顯示「解散群組」，鎖定後（且非 `cancelled`）改成固定顯示「群組訊息」——兩者是互斥的狀態分支，不會同時出現，因此可以共用側邊欄右下角同一個位置；`cancelled`（已解散）狀態兩者都不顯示
- **`HostedGroupCard` 依狀態切換統計格內容**：第一格招募中顯示「待處理申請」，已啟用（`active`/`cancelled`/`ended`）顯示「收款紀錄」，其餘鎖定後尚未啟用的狀態顯示「群組狀態」；第三格招募中顯示「建立日期」，已啟用顯示「群組狀態」，其餘鎖定後尚未啟用的狀態顯示「下次扣款」；「群組狀態」欄位文字依 `getCollectionState` 顯示已滿員/成員填寫中/待啟用服務/確認期中/申訴中/已結束等，跟頂部 `Badge` 是同一個狀態階段的兩種呈現——頂部 Badge 在 `full` 顯示「等待鎖定」（用 `label` 覆蓋 `Badge` 預設文字，只影響這張卡片，不影響探索頁等其他地方仍顯示的「已滿員」），`pending_confirmation` 則直接沿用 `Badge` 預設字典的「成員填寫中」，不用額外覆蓋；統計格則維持原始的細分階段文字（例如 `full` 顯示「已滿員」）。`pending_confirmation` 這個階段代管費用其實已經在申請被接受當下扣完了（見 PM幣代管流程文件），不是在「收款」，因此用「成員填寫中」，跟這個階段實際在等待的事情（成員填寫服務帳號資訊）一致
- **群組卡片列表用 `auto-fill`/`minmax` 而非 viewport 斷點排欄數**：`grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]`，依容器實際可用寬度（扣掉側邊欄與 padding 後）決定一列能排幾張卡片，不會像用 `sm:`/`lg:` 斷點時，卡片被螢幕寬度硬擠出比實際可用空間更多的欄數，導致統計格內的日期文字被迫換行
- **`statusFilter` 深連結自動對應分類**：`useHostActions.js` 的 `applyOpenHostGroup` 在沒有明確指定 `statusFilter` 時（例如從通知點擊開啟），會依目標群組目前的狀態自動找出對應的 `STATUS_FILTER_TABS` 分類並切過去，避免使用者關閉 modal 後，背景列表因為預設篩選分類（`recruiting`）對不上群組實際狀態而讓群組憑空消失

## 流程步驟

**1. 查看自己的群組**
- `ManageGroupsPage.jsx` 依分頁跟篩選條件顯示 `allGroups`

**2. 審核申請（`recruiting`）**
- 側邊欄「申請管理」列出待審核清單；面板右下角有一個固定貼在角落、附文字的「審核紀錄」按鈕（內容捲動時仍維持在角落，樣式跟最上方的「群組紀錄」按鈕統一)；「申請管理」「審核紀錄」兩個分頁的標題列都不顯示文字，返回鍵一律浮動在左上角（`subSubPanel.floatingBack: true`），不佔用整列高度；審核紀錄只放審核結果本身（已接受/已拒絕），已退出/已移除屬於成員異動而非審核動作，不混進這份清單，資料量通常不多，也不需要再拆分類篩選
- 點「接受」：先檢查名額是否足夠，通過就打 `PATCH /applications/:id { status: 'approved' }`（後端在同一個 transaction 內完成餘額檢查、代管扣款、建立成員與訂閱）；前端等後端完成後重新拉一次真實資料，並更新本地名額，剛好額滿的話還會額外通知團主自己
- 點「拒絕」：打 `PATCH /applications/:id { status: 'rejected' }`，並通知申請人；申請人點擊該通知時會重新拉取自己的申請資料，讓探索頁「已申請」標記立即消失、恢復成可重新申請的狀態
- 申請人也可以自行撤回 `pending` 申請：後端把狀態改成 `withdrawn` 並退款，前端會通知團主（`application_withdrawn`），團主端的申請 store 會在輪詢偵測到這則通知時自動刷新，不需要團主手動點擊或重新整理頁面就會把這筆申請從待審核清單移除

**3. 移除已接受成員（`recruiting`/`full` 期間）**
- 成員名單面板提供移除按鈕，倒數確認後才會真的執行
- 後端會退款、釋出名額、把對應申請標為 `removed`
- 前端同步更新本地名額，通知被移除的成員；如果聊天室已經存在，會發一則系統訊息並把該成員移出聊天室

**4. 鎖定群組（`full → pending_confirmation`）**
- 先建立群組聊天室（把團主跟所有成員加進去），再呼叫鎖定 API，後端會同時設定所有成員的下次扣款日，以及 `serviceInfoDeadline`（鎖定時間 + 24h，僅供前端顯示倒數，逾期不會有任何自動處理）
- 通知團主自己與所有成員聊天室已開啟／請填寫服務帳號（見上方「使用技術」的 `fill_service_info` 通知說明）；填寫帳號本身改在成員端群組詳情的 sub-modal 進行，聊天室不再另外發送提示訊息卡片
- 群組詳情頁（團主與成員兩側）在 `pending_confirmation` 期間都會顯示「等待成員填寫服務帳號資訊，剩餘 HH:MM:SS」的倒數橫幅（`CountdownText`，每秒更新）

**5. 查看成員資料**
- 側邊欄「成員資料」分頁（鎖定後、非 `cancelled` 都看得到）列出每位成員目前的填寫狀態：已填寫顯示摘要、尚未填寫顯示提示、已回報問題顯示等待修正中；可直接從這裡點「帳號問題」開啟 `ReportServiceIssueModal`，不用等到啟用服務那一步才能檢查

**6. 啟用服務（`pending_activation → confirming`）**
- `ActivateServiceModal` 要求逐一勾選確認每位成員的帳號資訊都沒問題，才能按下最終確認
- 確認後群組進入 48 小時確認期，聊天室發系統訊息，並通知團主與所有成員服務已啟用
- 群組詳情頁（團主與成員兩側）在 `confirming` 期間都會顯示「確認期進行中，剩餘 HH:MM:SS」的倒數橫幅，讀 `group.confirmDeadline`

**7. 回報成員帳號問題**
- 填寫問題說明後送出，會把說明寫進該成員的記錄，聊天室發系統訊息請該成員重新提交，並通知該成員

**8. 收款管理**
- 「收款管理」分頁非 `cancelled` 就能看到（不限鎖定後），面板掛載時查詢該群組的所有交易紀錄（僅團主本人可查）
- 只呈現每位成員「目前」狀態：**最新一筆**代管入帳紀錄即可（不管撤回重新申請等留下的舊代管/退款歷史），頂部彙總目前代管中尚未撥款的總額（`group.escrowTokens`）與已撥款給團主的總額（加總所有 `release` 型交易）；退款等歷史紀錄改到（使用者端）PM幣交易紀錄查詢
- **「代管入帳」顯示的時間是接受申請的時間，不是實際扣款時間**：代管扣款（`TokenTransaction`）實際發生在使用者送出申請的當下（見 PM幣代管流程文件），但團主/成員在收款/付款管理面板看到的「代管入帳」時間刻意改顯示 `Member.joinedAt`（團主按下「接受」的那一刻）——這是團主/成員主觀認知「入帳」發生的時間點，跟背後帳務上實際扣款的時間點是兩回事，只影響顯示，不影響扣款/退款金額與時機。`normalizeMember` 因此拆成兩個欄位：`joinedAt`（只留日期，給成員名單用）與 `joinedAtTime`（完整時間，給收款/付款管理用）

**9. 解散群組（僅 `recruiting`/`full`，見 PM幣代管流程文件）**
- 入口固定在側邊欄右下角（跟鎖定後的「群組訊息」共用同一個位置）
- 解散後所有代管金額會退回給各成員，並通知所有成員

**10. 續訂／結束服務**
- 見「續訂流程」文件

**11. 平台裁定申訴**
- 申訴不在團主自己的操作範圍內，是由平台管理員在 `AdminTab` 選擇處於 `disputed` 狀態的群組並送出裁定，見申訴流程文件

**12. 查看評價**
- 群組詳情側邊欄的「成員評價」分頁只顯示這個群組的評價（平均分數/則數只算這個群組），且只在群組曾經啟用過才會出現這個分頁
- 帳號中心（`/account`）Hero 區塊的「我的評價」按鈕點開獨立的 `HostReviewsModal`，彙總團主名下**所有**群組的評價；沒有評價時顯示「尚無評價」

## 驗證重點
- 所有團主專屬的 route（鎖定/啟用/解散/續訂/查交易紀錄）都會檢查請求人確實是該群組的團主，不是就回 403
- 鎖定只允許在 `full` 狀態操作、啟用只允許 `pending_activation`、解散只允許 `recruiting`/`full`、續訂只允許 `active`——都在 route 層明確檢查狀態，擋下不合法的轉換
- 審核申請用條件式 `updateMany` 而不是先讀後寫，避免同一筆申請被重複接受、重複扣款
- 團主手動加人只允許在 `recruiting` 狀態操作，而且跟申請接受共用同一套入群邏輯，不會繞過名額上限跟代管帳務
- 移除成員只允許在 `recruiting`/`full` 狀態操作，一旦鎖定（進入 `pending_confirmation` 之後）成員名單就不能再變動
- 查交易紀錄只有團主本人可以看，非團主一律 403
- 通知非自己的使用者時，後端會驗證請求人跟目標使用者都跟該群組有關聯（成員／團主／曾送申請），避免任意使用者偽造通知
- **解散群組退款**：`POST /groups/:id/cancel` 在同一個 transaction 裡重新查詢當下真正的成員名單（`tx.member.findMany`）再退款，避免跟同時發生的成員退出/移除撞在一起造成重複退款
- **群組額滿判斷**：`server/src/utils/membership.js` 用 `currentMembers < maxMembers - 1` 才允許入群、`currentMembers + 1 >= maxMembers` 才推進為 `full`（`currentMembers` 不含團主，`+1` 補回團主的名額）
