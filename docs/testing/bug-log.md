# Bug Log

使用下面的格式記錄手動測試時發現的問題。優先記錄 P0/P1（會影響主線交易流程或資料正確性的問題），P2 視情況記錄。

## 範本

```md
### BUG-001：{標題}
- **功能**：{屬於哪個功能，可連結對應的 flows/ 文件}
- **嚴重度**：P0 / P1 / P2
- **測試帳號**：{見 test-accounts.md}
- **操作步驟**：
  1. ...
  2. ...
- **預期結果**：...
- **實際結果**：...
- **推測原因**：{可附檔案/行號}
- **修正狀態**：未修 / 已修（附 commit）
```

---

## 已記錄的 Bug

依發現時間排序，最新在上。每筆都有標註「來源」（`/code-review` 靜態審查、使用者回報、或手動測試），之後新發現的 bug 補在最上面即可。

### BUG-023：我的收藏清單沒有依群組狀態過濾，額滿/已解散/已結束的群組會一直留著
- **功能**：[使用者流程總覽](../flows/user-flows.md)，`FavoritesPage.jsx`
- **嚴重度**：P2（顯示問題，容易誤導使用者以為還能申請）
- **來源**：使用者回報「收藏那邊列表裡面顯示的群組卡資訊怪怪的，為什麼已解散的群組還存在裡面」
- **重現方式**：收藏一個群組，之後該群組額滿、被團主解散或自然結束
- **預期結果**：收藏清單應該只列出還進得去的招募中群組，跟探索頁（`searchUtils.js` 的 `applyFilters`）看到的範圍一致
- **實際結果**：`FavoritesPage.jsx` 只用 `favorites` 記錄反查群組資料，完全沒有依 `status`/`openSeats` 過濾；`ExploreGroupCard` 本身也不顯示狀態徽章，額滿/已解散/已結束的群組看起來就跟正常招募中的群組一樣，點進去才會發現不能申請
- **推測原因**：收藏頁是後來才加的功能，沒有比照探索頁套用同一套「只顯示進得去的群組」過濾條件
- **修正狀態**：已修——套用跟探索頁完全相同的過濾條件 `status === 'recruiting' && openSeats > 0`。曾考慮過「額滿保留、只濾掉已解散/已結束」的折衷方案（額滿群組理論上有機會因為成員退出/被移除而釋出名額、退回招募中，見 BUG-020），但使用者確認探索頁本來就是刻意不顯示額滿群組（避免瀏覽時看到一堆進不去的群組），收藏頁跟著同一套邏輯比較一致，最終採用完全比照探索頁的做法

### BUG-022：`App.jsx` 資料載入失敗的彙總 Toast 在開發模式下會跳兩次
- **功能**：App 啟動流程，`App.jsx` 的 `bootApp()`（見 BUG-019 新增的彙總 Toast 邏輯）
- **嚴重度**：P2（只在開發模式出現，不影響正式環境）
- **來源**：使用者回報「部分資料載入失敗，請重新整理頁面的 Toast 會發送兩次」
- **重現方式**：開發模式（`npm run dev`）下，任一個 store 的 `init()` 失敗
- **預期結果**：失敗時只跳一次彙總 Toast
- **實際結果**：Toast 跳了兩次
- **推測原因**：`main.jsx` 有包 `<StrictMode>`，React 19 在開發模式會刻意把 mount 的 effect 多跑一次（測試 cleanup 邏輯是否正確）；`bootApp()` 所在的 `useEffect` 沒有回傳 cleanup function，也沒有任何防重入機制，兩次 effect 呼叫會各自完整跑一輪 `bootApp()`、各自判斷失敗並各跳一次 Toast。正式環境不會用 StrictMode 的開發模式行為，所以不會重現
- **修正狀態**：已修——加一個 `bootedRef`（`useRef(false)`），effect 一開始檢查並在真正執行前設為 `true`，擋掉 StrictMode 的第二次呼叫

### BUG-021：建立群組「選擇方案」卡片，方案名稱過長時會撐開卡片、蓋到旁邊的切換箭頭與說明欄
- **功能**：[建立群組流程](../flows/create-group-flow.md)，`Step2Plan.jsx`
- **嚴重度**：P2（顯示問題，不影響資料正確性，但畫面明顯跑版）
- **來源**：使用者手動測試回報「選擇 Nintendo Switch Online 時，螢幕寬度 768px～1280px 之間方案卡的部分會被遮住」
- **重現方式**：建立群組選擇方案名稱較長的服務（例如 Nintendo「家庭方案（無擴充包）（月繳）」、Google One「AI Plus（400GB）（月繳）」），把瀏覽器/容器寬度縮到 `md`～`lg` 之間的中段寬度
- **預期結果**：方案名稱過長時應該截斷成「...」，不影響旁邊的切換箭頭跟方案說明欄版面
- **實際結果**：方案卡片（`<button>`）是 flex row 裡的 `flex-1` 項目但沒有 `min-w-0`；CSS flex 項目預設 `min-width: auto`，代表它不會縮小到比內容本身還窄，所以容器變窄時卡片會被內容撐開，`truncate` 完全失效（不會出現「...」），文字直接溢出卡片邊框，蓋到右側切換箭頭跟方案說明欄
- **推測原因**：只顧到卡片內部 `<div className="min-w-0 text-center">` 有補 `min-w-0`，忘了外層的卡片本身（也是需要收縮的 flex 項目）也要補上，才能讓 `truncate` 沿著整條鏈路正確生效
- **修正狀態**：已修——卡片 `<button>` 補上 `min-w-0`；另外把計費週期（月繳／年繳）拆成卡片上方的獨立 badge，方案名稱不用再重複帶「（月繳）」字樣，名稱變短也降低了需要截斷的機率。已用全站最長的方案名稱（Google One「AI Plus（400GB）（月繳）」，18 字）在 600px／672px 容器寬度下驗證過，截斷正常、無溢出

### BUG-020：通知指向的群組已額滿/不再招募中時，點通知會打開一個「已經不能申請」的過期群組 Modal
- **功能**：[通知流程](../flows/notification-flow.md)，`FloatingMessages.jsx`
- **嚴重度**：P2（不會出錯，但使用者體驗上會誤導——以為還能申請）
- **來源**：使用者提前提出「群組額滿後，點通知中心的通知應該要提示額滿並導回探索頁，而不是繼續打開該群組」
- **重現方式**：收到 `application_rejected`／`member_removed`／`application_approved`（尚無訂閱）這類會開啟群組詳情 Modal 的通知，在通知建立之後、點擊之前，該群組已經被別人申請填滿（`recruiting` → `full` 或更後面的狀態）
- **預期結果**：點擊通知應該告知使用者這個群組已經不能申請了，導向探索頁繼續看其他群組，而不是打開一個「按下申請也沒用」的群組 Modal
- **實際結果**：原本這三種通知類型點擊後一律 `navigate('/explore')` + 直接 `dispatchEvent('pm:open-group')`，完全不檢查群組目前狀態，Modal 一樣會照常打開，只是「申請加入」按鈕因為 `canApply` 判斷而被隱藏/停用，使用者得自己點進去才看得出來為什麼不能申請
- **推測原因**：這三個入口設計時只考慮了「群組還在招募中」的情境，沒有處理通知建立後群組狀態才轉變的競態
- **修正狀態**：已修——新增 `openGroupOrRedirect(groupId)`：重新拉一次群組資料後檢查 `status === 'recruiting'`，不符合就跳 `info` Toast 說明並留在探索頁，符合才真的打開 Modal；三個入口（`application_rejected`、`member_removed`、`application_approved` 尚無訂閱分支）改呼叫這個共用函式

### BUG-019：`NotificationType` enum 沒有 `application_withdrawn`，撤回申請的通知寫入直接 500
- **功能**：[通知流程](../flows/notification-flow.md)，[PM幣代管與付款流程](../flows/payment-token-flow.md)（申請撤回通知團主）
- **嚴重度**：P1（新功能上線當下就完全無法運作，且前端沒有任何提示）
- **來源**：使用者回報「取消申請時 Console 跳出 500」
- **重現方式**：申請人撤回一筆 `pending` 申請，觸發 `insertNotification({ type: 'application_withdrawn', ... })`
- **預期結果**：通知寫入成功，團主收到「申請人已取消申請」
- **實際結果**：`prisma.notification.create()` 丟出 `Invalid value for argument 'type'. Expected NotificationType.`，因為 `schema.prisma` 的 `NotificationType` enum 只定義到既有的 18 種，沒有新加的 `application_withdrawn`；由於呼叫端是 `.catch(console.error)`，畫面上完全沒有任何提示（申請人自己撤回成功，但團主永遠收不到通知）
- **推測原因**：新增通知類型時只改了前端呼叫處，忘了同步在 `schema.prisma` 加上對應的 enum 值並跑 `db push`
- **修正狀態**：已修——`schema.prisma` 的 `NotificationType` 補上 `application_withdrawn`，執行 `npx prisma db push` 同步到資料庫；順手把 `CLAUDE.md` 裡寫錯的 `npx prisma migrate dev` 改成專案實際在用的 `npx prisma db push`（本專案沒有 migrations 目錄，`migrate dev` 執行下去會要求整個資料庫 reset）

### BUG-018：申請人撤回申請，團主端完全沒有任何通知或畫面更新
- **功能**：[通知流程](../flows/notification-flow.md)，`useApplicationStore.withdraw`
- **嚴重度**：P1（團主可能對著一筆早就撤回的申請按核准/拒絕，造成操作上的 bug）
- **來源**：使用者回報「使用者取消申請時，團主端也要收到通知」
- **重現方式**：申請人在 `GroupDetailModal` 撤回一筆 `pending` 申請
- **預期結果**：團主收到通知，且團主端的 applications store 應該同步更新，不該繼續把這筆申請當成 `pending` 顯示在待審核列表
- **實際結果**：`withdraw()` 只更新申請人自己的本地 state 跟呼叫後端 API，完全沒有通知團主的邏輯；團主端要等自己重新整理頁面才會發現這筆申請已經失效
- **推測原因**：實作核准/拒絕流程時都有補通知，唯獨「申請人自行撤回」這個入口漏了
- **修正狀態**：已修——`withdraw()` 成功後呼叫 `insertNotification` 通知團主（`application_withdrawn`）；`useNotificationStore` 的輪詢偵測到這個類型會直接觸發 `pm:refresh-application-store`，不需要團主點擊通知就會自動刷新（另見 BUG-019，enum 沒對齊導致這個修正一開始沒有真的生效）

### BUG-017：申請時間被截斷成純日期，審核紀錄畫面永遠顯示同一個固定時間
- **功能**：團主審核紀錄，`normalizeApplication`（`src/shared/utils/modelNormalizers.js`）
- **嚴重度**：P2（顯示問題，不影響資料正確性，但會讓使用者誤以為系統有 bug）
- **來源**：使用者回報「審核紀錄裡面顯示的申請時間都固定顯示『今天 8:00』」
- **重現方式**：核准或拒絕一筆申請，到審核紀錄查看該筆的申請時間
- **預期結果**：顯示這筆申請實際送出的日期與時間
- **實際結果**：畫面上所有紀錄的時間都固定顯示同一個時間點
- **推測原因**：`normalizeApplication` 把後端回傳的完整 ISO 時間戳記用 `.slice(0, 10)` 截斷成純日期字串（例如 `2026-07-24`）；`formatRelativeDate`/畫面上再用 `new Date('2026-07-24')` 解析時，JS 會當成 UTC 午夜，換算成台灣時區（UTC+8）就固定變成早上 8:00，跟這筆申請實際送出的時間完全無關
- **修正狀態**：已修——`normalizeApplication` 不再截斷 `createdAt`，完整保留時間戳記；新增 `formatDateTime()`（`src/shared/utils/date.js`）顯示實際日期＋時間，審核紀錄（已審核的申請）改用這個函式，待審核列表維持原本的相對時間（「3小時前」）；順手把團主收款管理面板（`buildBillingPanel.jsx`）同樣只顯示日期的交易時間也改成顯示實際時間

### BUG-016：申請未通過的通知點擊後，申請人本地資料沒有刷新，群組卡片卡在「已申請」狀態
- **功能**：[通知流程](../flows/notification-flow.md)，`FloatingMessages.jsx`
- **嚴重度**：P1（申請人以為卡住了，其實只是本地畫面沒更新，實際上可以重新申請）
- **來源**：使用者回報「申請未通過時點擊通知，原本申請的群組應該要能重新申請，目前還卡在申請中的狀態」
- **重現方式**：團主拒絕一筆申請，申請人點擊「申請未通過」的通知
- **預期結果**：探索頁該群組的「已申請」標記消失、恢復成可重新申請的狀態
- **實際結果**：`FloatingMessages.jsx` 的 `handleClick` 對 `application_rejected` 沒有專屬處理，只會落到預設分支單純 `navigate('/explore')`；申請人本地 `useApplicationStore` 的那筆申請紀錄還停在 `pending`（團主端的拒絕動作只更新了團主自己的 store 跟資料庫），`ExplorePage` 用 `status === 'pending'` 判斷是否顯示「已申請」，因此畫面一直卡住
- **推測原因**：`new_application` 等其他通知類型點擊時都有重新拉取對應 store，唯獨 `application_rejected` 沒有，可能是設計時漏了「拒絕」也需要讓申請人這端重新同步狀態
- **修正狀態**：已修——`application_rejected` 補上點擊處理：`navigate('/explore')` 的同時呼叫 `useApplicationStore.getState().init()` 重新拉取最新申請狀態；同步修正 `checkMissedNotifications`（離線補通知）建立 `application_rejected` 時漏帶 `meta.groupId` 的問題

### BUG-015：多處樂觀更新失敗時完全沒有回滾也沒有任何提示
- **功能**：收藏、成員/訂閱更新、群組建立與更新、通知已讀，見 [使用者流程總覽](../flows/user-flows.md)
- **嚴重度**：P1（畫面狀態跟後端真實資料不一致，使用者卻毫無所覺）
- **來源**：使用者提問「網頁發生錯誤或操作失敗時會跳 Toast 通知嗎」，追查後發現大範圍缺口
- **重現方式**：檢視 `useFavoriteStore.toggle`、`useMemberStore.update`/`remove`、`useSubscriptionStore.update`/`activateGroupSubscriptions`/`remove`、`useGroupStore.create`/`update`、`useNotificationStore.markRead`/`markAllRead` 這些樂觀更新的 store action，背景 API 呼叫失敗時的處理方式
- **預期結果**：背景同步失敗時，畫面應該回滾成失敗前的值，並提示使用者操作沒有真的成功
- **實際結果**：這些 action 全部是 `.catch(console.error)`，失敗時畫面保持樂觀更新後的值（例如收藏愛心圖示、付款狀態、群組狀態）跟後端實際資料不同步，使用者完全不會發現，只有重新整理頁面才會看到「打回原形」，容易誤以為是系統 bug
- **推測原因**：這些 action 大多是「fire-and-forget」（呼叫端沒有 `await`，store 內部也沒接住失敗分支），實作當下只處理了成功路徑
- **修正狀態**：已修——新增共用的 `notifyError()`（`src/shared/utils/toast.js`），上述 action 的 `.catch` 一律改成記住異動前的值、失敗時回滾＋跳 `error` Toast；另外 `App.jsx` 開頭載入資料（各 store 的 `init()`）任一項失敗時，也會補一個需手動關閉的彙總 Toast，避免使用者以為「本來就沒資料」。同時新增 Toast 的 `warning` 類型（`AlertTriangle`／`text-warning`），供之後需要跟 `error`／`success` 區分的警示訊息使用

### BUG-014：解散群組的退款邏輯用讀取時的舊成員名單，跟同時發生的退出/移除撞在一起會重複退款
- **功能**：[我的群組（團主視角）流程](../flows/my-groups-host-flow.md)，`POST /groups/:id/cancel`
- **嚴重度**：P1（金流正確性：極窄的競態窗口下會多退一次款）
- **來源**：使用者提問「解散群組會不會跟移除成員/退出群組衝突」，追查程式碼發現
- **重現方式**：`findUnique` 讀出群組成員名單後、`$transaction` 真正執行前，剛好有成員自行退出或被移除（該操作會刪除自己的 `Member` 列並拿到一次退款）
- **預期結果**：解散群組只對「當下真正還在群組內」的成員退款，不會重複退款給已經離開的成員
- **實際結果**：舊寫法是在 transaction 外先讀一次 `group.members`，再拿這份可能過時的名單去組退款操作；若該名單裡有人在讀取後、transaction 執行前已經離開並拿到個人退款，transaction 仍會再退一次
- **推測原因**：沒有比照專案裡其他有併發疑慮的地方（例如申請核准的名額檢查）採用「條件式重新查詢，在 transaction 內以當下狀態為準」的寫法
- **修正狀態**：已修——`/cancel` 改成 interactive transaction：先用條件式 `updateMany`（status 仍在 `recruiting`/`full` 才准許）確保狀態沒被同時變動過，再於同一個 transaction 內重新查詢當下真正的成員名單，用 `updateMany`/`createMany` 批次退款；已寫腳本驗證退款金額剛好退一次

### BUG-013：群組額滿判斷少算團主佔的 1 個名額，狀態永遠比實際剩餘名額晚一步變成 `full`
- **功能**：建立群組／申請審核，`server/src/utils/membership.js`
- **嚴重度**：P0（核心狀態機：影響所有群組的滿員判斷與後續鎖定流程）
- **來源**：使用者回報「明明群組剩餘名額已經是 0 了，狀態還是招募中」
- **重現方式**：建立一個 N 人方案的群組，核准 N-1 位非團主成員（前端算出的剩餘名額已經是 0）
- **預期結果**：核准最後一位成員後（連同團主剛好滿 N 人），群組狀態應該推進成 `full`
- **實際結果**：`admitMemberIntoGroup`／`finalizeApprovedApplication`／`advanceToFullIfNeeded` 都是拿只計算非團主成員的 `currentMembers` 直接跟含團主的 `maxMembers` 比較，導致每個群組都要多塞 1 位「不該存在」的成員才會被判定滿員，跟前端「剩餘名額 = 總名額 − (成員數 + 團主)」的算法對不起來
- **推測原因**：後端名額判斷邏輯沒有把團主本身佔用的 1 個名額算進去
- **修正狀態**：已修——三處比較都改成扣掉團主佔的 1 個名額；連帶調整 `seedDemo.js` 裡原本依照舊（有 bug）邏輯湊出來的群組成員數，改成正確人數

### BUG-012：帳號設定儲存失敗會被完全吞掉，畫面仍顯示樂觀值
- **功能**：[帳號設定](../flows/user-flows.md)，`AccountPage.jsx` 的 `handleUserChange`
- **嚴重度**：P1（使用者以為改成功了，實際上沒存到）
- **來源**：code review（非手動測試觸發）
- **重現方式**：`useAuthStore.updateProfile()` 呼叫後端失敗時（例如網路問題、驗證錯誤），觀察畫面顯示的欄位值
- **預期結果**：儲存失敗要復原成修改前的值，並提示使用者儲存失敗
- **實際結果**：`updateProfile()` 失敗時是回傳 `{ ok: false, error }`、不是 `throw`，但呼叫端寫的是 `.catch(console.error)`，永遠接不到這個分支；畫面上的樂觀值不會復原、也沒有任何提示，使用者會誤以為已經存檔成功
- **推測原因**：呼叫端誤把「回傳失敗物件」的 API 當成「失敗會 reject 的 Promise」處理
- **修正狀態**：已修（本次 code review 一併提交）——改成檢查 `result.ok`，失敗時復原欄位值並跳 toast 提示

### BUG-011：透過「我的群組」退出群組不會離開群組聊天室
- **功能**：[我的群組（成員視角）流程](../flows/my-groups-member-flow.md)
- **嚴重度**：P1（資料不一致：已退出的成員仍留在聊天室裡）
- **來源**：code review（非手動測試觸發）
- **重現方式**：成員在 `MyGroupsPage` 的 `MemberPage`（而非 `GroupDetailModal`）點擊退出群組
- **預期結果**：退出群組後應該跟透過 `GroupDetailModal` 退出時一樣，一併呼叫 `leaveConversation` 離開聊天室
- **實際結果**：`MemberPage.jsx` 的 `handleLeaveGroup` 是另外重寫的一份退出邏輯（沒有呼叫 `finalizeLeaveGroup`），漏了 `leaveConversation(convId)`，導致已退出的成員永遠留在該群組聊天室的參與者名單裡
- **推測原因**：兩個入口（`GroupDetailModal` 與 `MemberPage`）的退出流程各自維護一份重複邏輯，新增 `leaveConversation` 時只改了其中一處
- **修正狀態**：已修（本次 code review 一併提交）——`MemberPage.jsx` 改成呼叫共用的 `finalizeLeaveGroup`，統一兩個入口的行為

### BUG-010：系統公告廣播其中一位使用者失敗會讓整批廣播中斷
- **功能**：系統公告，`POST /system-messages/broadcast`
- **嚴重度**：P1（管理員發公告時，只要中間一位使用者寫入失敗，後面所有使用者都收不到）
- **來源**：code review（非手動測試觸發）
- **重現方式**：`for...await` 逐一發送給每位使用者，其中一位使用者發送時拋出例外
- **預期結果**：單一使用者失敗不應該影響其他使用者收到公告
- **實際結果**：`for...await` 迴圈中一旦某位使用者拋出例外就直接中斷整個迴圈，尚未處理到的使用者完全收不到公告，且整支 API 回 500（掩蓋了實際上大部分使用者可能已經發送成功的事實）
- **推測原因**：把「平行、互不影響」的批次工作寫成了循序迴圈
- **修正狀態**：已修（本次 code review 一併提交）——改用 `Promise.allSettled` 平行發送，個別失敗只記 log，不影響其他使用者

### BUG-009：退出群組通知團主誤用個人本地通知的 store 方法
- **功能**：[退出群組流程](../flows/my-groups-member-flow.md)，`leaveGroupFlow.js`
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視 `finalizeLeaveGroup` 通知團主的那段程式碼
- **預期結果**：通知「別人」（團主）應該呼叫寫入後端 DB 的 `insertNotification` API，只有通知「自己」才該用 `useNotificationStore.getState().create(...)`（本地樂觀通知）
- **實際結果**：原本寫成 `useNotificationStore.getState().create({ userId: group.hostId, ... })`，把要通知團主的通知寫進了目前操作者（退出的成員）自己的本地通知 store，團主端完全不會看到這則通知（因為是別人的本地 state），且污染了退出者自己的通知清單
- **推測原因**：跟通知自己（本地）的寫法搞混，沒注意到這裡的收件者其實是別人
- **修正狀態**：已修（本次 code review 一併提交）——改用 `insertNotification(...).catch(console.error)`，跟其他跨使用者通知的寫法一致

### BUG-008：申訴裁定「成員獲勝」一定會 500，從未真正成功執行過
- **功能**：[申訴流程](../flows/dispute-flow.md)，`POST /groups/:id/adjudicate`
- **嚴重度**：P0（核心交易流程功能完全無法使用）
- **測試帳號**：`demo-admin@partymatch.test`（見 test-accounts.md）
- **操作步驟**：
  1. 群組處於 `disputed` 狀態，有一位成員已申訴
  2. 管理員在 `AdminTab` 選擇該群組，裁定結果選「成員獲勝」，填寫說明後送出
- **預期結果**：申訴成員退款並移出群組，群組狀態回到 `active`
- **實際結果**：API 回傳 500，整個交易回滾，裁定完全沒有生效
- **推測原因**：`server/src/routes/groups.js` 的 `winner === 'member'` 分支裡，`prisma.subscription.updateMany` 把該成員的 `Subscription.status` 設成 `'cancelled'`，但 `SubscriptionStatus` enum（`schema.prisma`）只定義了 `pending`/`active`/`ended` 三種值，沒有 `cancelled`，Prisma 執行時直接拋出驗證錯誤。這條路徑先前只有靜態程式碼審查看過，從未真的被任何測試（手動或自動）呼叫過一次，才會一直沒被發現
- **如何發現**：把 `server/prisma/seedDemo.js` 從直接寫資料庫改成透過真實 REST API 驅動每個情境後，第一次真正呼叫這支端點就立刻重現
- **修正狀態**：已修（本次連同 seed 腳本重寫一起提交）——`Subscription.status` 改設為 `'ended'`

### BUG-007：搜尋框 debounce echo 吃掉使用者輸入的尾隨空白
- **功能**：[探索群組流程](../flows/explore-flow.md)
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：在探索頁關鍵字輸入框打字，尾端刻意留一個空白（例如「netflix 」）並暫停超過 300ms
- **預期結果**：使用者輸入的空白應保留在輸入框裡，直到自己刪除或繼續輸入
- **實際結果**：debounce 觸發送出後，URL 端會 `trim()` 掉空白，這個 trim 過的值又同步回本地輸入框，尾隨空白被悄悄吃掉；若使用者在這個時間點前後緊接著輸入下一個字，可能導致關鍵字缺一個空白
- **推測原因**：`FilterBar.jsx` 用兩個 state（`keyword`/`syncedQ`）手動模擬「render 期間同步外部 prop」，沒有區分「這是外部真正的變化」還是「自己剛送出的 echo」
- **修正狀態**：已修（`7d80c08`）——改用 `keyword.trim() !== filters.q` 判斷是否為外部真正變化，是 echo 就不覆寫本地輸入

### BUG-006：`Badge.jsx` 的 `full` 狀態從設計 token 退步成寫死色值
- **功能**：全站狀態徽章顯示
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視群組狀態為 `full`（已滿員）時的 Badge 樣式
- **預期結果**：應使用 `@theme` 宣告的設計 token（例如 `bg-raised text-ink-2`），日後切換主題色/深色模式時才會一起變動
- **實際結果**：某次重構把 `full` 狀態的 class 改回寫死的 `bg-slate-100 text-slate-500`，脫離 token 系統
- **推測原因**：把分散在兩個檔案的 `STATUS_BADGE_CLASS` 對照表合併進 `Badge.jsx` 時，直接搬字過紙保留了舊的寫死色值
- **修正狀態**：已修（`7d80c08`）——改回 `bg-raised text-ink-2`

### BUG-005：`docs/architecture.md` 混入簡體字
- **功能**：文件內容（非程式功能）
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視架構文件「已結束」分類 tab 說明段落
- **預期結果**：全篇應為繁體中文
- **實際結果**：一處寫成「供两处共用」，「两处」為簡體字
- **推測原因**：手動編輯時誤植
- **修正狀態**：已修（`7d80c08`）——改為「供兩處共用」

### BUG-004：`server/prisma/clearProd.js` 殘留呼叫已移除的 `RefreshToken` model
- **功能**：正式環境資料清空腳本（`npm run db:clear`）
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發）
- **重現方式**：`schema.prisma` 移除 `RefreshToken` model（refresh token 改存 Redis）後，直接執行 `npm run db:clear`
- **預期結果**：完整清空 messages/conversations/.../groups/users，並成功結束
- **實際結果**：腳本執行到 `prisma.refreshToken.deleteMany()` 這行會因為 `prisma.refreshToken` 是 `undefined` 而拋出 `TypeError`，此時 groups 等資料已被刪除、users 還沒刪除，留下不一致的殘留資料
- **推測原因**：schema 變更後沒有同步檢查依賴該 model 的維運腳本
- **修正狀態**：已修（`7d80c08`）——移除該行呼叫

### BUG-003：`DELETE /groups/:id` 名額判斷 off-by-one，已有成員的群組仍可被直接刪除
- **功能**：[我的群組（團主視角）流程](../flows/my-groups-host-flow.md)
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發；此路由目前前端未串接，僅可透過直接呼叫 API 觸發）
- **重現方式**：群組已有 1 名成員申請並被核准加入（該成員的 PM幣已扣款進代管），此時對該群組呼叫 `DELETE /groups/:id`
- **預期結果**：僅能刪除「尚無成員加入」的招募中群組，已有成員應拒絕並提示改用解散群組（`/cancel`，含退款）
- **實際結果**：判斷式寫成 `currentMembers > 1`，代表恰有 1 位成員時仍會判定為「可刪除」，直接執行硬刪除；`Application`/`Member`/`Subscription` 會被級聯刪除，但不會走 `/cancel` 的退款邏輯，該成員已扣除的 PM幣代管款項永久消失
- **推測原因**：`currentMembers` 語意上不含團主本人（0 代表尚無其他成員加入），註解寫對了但條件式的門檻值寫錯
- **修正狀態**：已修（`7d80c08`）——改為 `currentMembers > 0`

### BUG-002：核准申請缺少狀態鎖，併發/雙擊可能導致重複扣款、重複入群
- **功能**：[團主審核流程](../flows/approval-flow.md)
- **嚴重度**：P0
- **來源**：code review（非手動測試觸發）
- **重現方式**：對同一筆 `pending` 申請，幾乎同時送出兩個 `PATCH /applications/:id`（核准）請求（例如團主手滑雙擊、或網路延遲下重試）
- **預期結果**：只有一個請求成功核准，另一個應被拒絕（例如回 409）
- **實際結果**：兩個請求各自查到申請仍是 `pending`，各自通過 `admitMemberIntoGroup` 內的名額/餘額檢查（只要群組還有 ≥2 名額），導致該申請人被重複扣款、`currentMembers` 被重複遞增、產生兩筆重複的 `TokenTransaction`
- **推測原因**：名額檢查已經用條件式 `updateMany` 做了併發防護，但「申請狀態本身要不要允許被處理」這個判斷還停留在先讀後寫
- **修正狀態**：已修（`7d80c08`）——在同一個 transaction 內，先用條件式 `updateMany`（`status: 'pending'` 才能轉 `approved`）鎖定申請狀態，寫入 0 筆就代表已被處理過，直接回 409

### BUG-001：`useGroupStore.getByHostId` 等處排序邏輯與抽出的共用 helper 不一致
- **功能**：跨頁面群組列表排序（新到舊）
- **嚴重度**：P2
- **來源**：code review（非手動測試觸發）
- **重現方式**：檢視 `useGroupStore.js` 的 `getByHostId` selector
- **預期結果**：全站列表排序邏輯應統一呼叫共用的 `byNewest`（`src/shared/utils/date.js`）
- **實際結果**：這處仍是逐字重複的 inline 版本 `(b.createdAt ?? '').localeCompare(a.createdAt ?? '')`，跟已抽出的共用函式重複
- **推測原因**：抽出 `byNewest` 共用函式時漏改這一處呼叫端
- **修正狀態**：已修（`7d80c08`）——改用 `.sort(byNewest)`
