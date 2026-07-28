# Flows 演變記錄

這裡記錄 docs/flows/ 底下文件曾經歷過的設計變化，主文件只保留現況。

## create-group-flow.md：Field 元件 hint 泡泡展開方向

hint 說明泡泡原本是靠右垂直置中展開，後來改成往下方展開，因為最上面的欄位（例如「開放名額」）的說明泡泡若往上展開，會被自己所在的 `overflow-y-auto` 捲動容器裁切，看起來像被上方服務資訊卡蓋住。

## messages-flow.md：團主鎖定群組的訊息行為

團主鎖定群組時，原本會在聊天室發送一則可互動的提示訊息卡片，讓成員透過聊天室內的操作卡片填寫服務帳號。後來改為不再發送這則提示訊息，填寫服務帳號改到群組詳情頁的獨立 sub-modal 進行，不透過聊天室操作卡片。

## my-groups-member-flow.md／my-groups-host-flow.md：「服務內容」分頁整併回群組概覽

服務說明／方案說明原本是獨立的「服務內容」分頁，後來整併回群組概覽畫面顯示，跟探索頁 `GroupDetailModal` 的呈現方式統一。host 端原本服務說明區塊還有方案／共享方式／主要功能三個 chip 卡片，整併後也一併移除。

## my-groups-member-flow.md：「填寫帳號」入口位置

「填寫帳號」原本是側邊欄項目，後來改成群組概覽底部的動態按鈕，跟「確認服務」「回報問題」一樣，只在需要填寫帳號（`needsFillInfo`）或帳號被回報有問題（`hasServiceInfoIssue`）時才會出現在 `GroupModalShell` 的 `centeredCta`。

## my-groups-host-flow.md：群組詳情 Modal Header 顯示內容

Header 原本只顯示服務名稱，後來改成顯示「服務名稱 | 方案名稱」。

## my-groups-host-flow.md：`HostedGroupCard` 統計格文案演變

鎖定後、尚未啟用狀態的第一格文字原本叫「收款狀態」，因為此時「待處理申請」永遠會是 0，容易讓人誤以為卡在收款；後來改叫「群組狀態」。`pending_confirmation` 這個階段代管費用其實在申請被接受當下就已扣完，不是在這個階段收款，過去用「收款中」這個字眼容易誤導，後來統一改成「成員填寫中」，跟這個階段實際在等待的事情（成員填寫服務帳號資訊）一致。

## approval-flow.md：拒絕/移除退款的條件式寫法

早期版本曾經把狀態寫入也包進退款的條件式 `updateMany` 裡，導致團主移除已接受成員時（該申請當下狀態是 `approved` 不是 `pending`），退款判斷正確跳過，但狀態轉換也被一起跳過，申請永遠卡在 `approved`、`activeKey` 也永遠不會清空，使用者從此無法重新申請同一群組。後續修正為狀態轉換一定會執行，只有退款金額的寫入受條件式保護。

## notification-flow.md：確認服務／送出申訴不通知團主的落差

`POST /groups/:id/confirm`／`POST /groups/:id/dispute` 原本完全不會通知團主，後來修復為分別建立 `escrow_released`／`dispute_raised` 通知給團主，並在群組聊天室留一則系統訊息。

## explore-flow.md：卡片金額文字大小

`ExploreGroupCard` 的金額文字原本明顯偏大，後來改成跟「我的群組」卡片一致的 `text-base font-extrabold`。

## group-state-machine.md：移除從未實作的 `paused` 狀態

CLAUDE.md 跟部分文件曾寫著群組狀態機有 `active → paused` 這條分支，但 `GroupStatus` enum（`schema.prisma`）從來沒有定義過 `paused` 這個值，後端也從未有任何 route 會把狀態設成 `paused`；前端卻有 4 處（`HostGroupView.jsx`、`buildPaymentsPanel.jsx`、`badgeLabels.js` 兩處）把它當作可能出現的狀態在處理，都是永遠不會命中的死分支。判斷是從未實作的規劃殘留，非目前有在用的功能，已從前端程式碼與文件一併移除。

## notification-flow.md：清理孤兒通知類型與判斷條件

`NotificationType` enum 原本有 `member_joined`、`token_topup` 兩個值，資料庫從未有任何一筆通知用過（`token_topup` 文件本來就有註記是死值，`member_joined` 連文件都沒提到，完全被遺忘），已從 schema 移除。前端 `FloatingMessages.jsx` 也有一個永遠不會命中的 `joined` 通知類型設定（DB enum 裡根本沒有 `joined` 這個值，命名對不上）、以及 `announcement`／`platform` 兩個系統通知子類型（DB enum 只有 `system`，這兩個值不可能被建立），一併移除；`useNotificationStore.js` 的 `isSystemNotification`／`isPublicSystemNotification` 也清掉了檢查 `notification.audience`／`notification.scope`（Notification model 根本沒有這兩個欄位）與 `notification.userId === 'system'`（真正的系統帳號 id 是 cuid，不是字面上的 `'system'` 字串，只有本地端 fallback 物件會用到這個字面值，且該物件同時符合 `isPublic`/`type` 條件，這個判斷式從來沒有真正生效過）的死條件。

## manage-groups-flow.md／subscriptions-flow.md：「我的群組」拆回兩個獨立頁面

「我的群組」原本是單一頁面（`MyGroupsPage.jsx`），依 `?view=member`／`?view=host` 切換成員／團主視角，切換身份靠頁面最上方的「切換身份」按鈕。後來拆回兩個獨立路由與資料夾：`/my-subscriptions`（`src/features/subscriptions/`，頁面「我的訂閱」）與 `/manage-groups`（`src/features/manage-groups/`，頁面「群組管理」），移除「切換身份」按鈕，桌面版側邊欄與手機版 dock 的「我的」下拉選單都改成兩個獨立入口；「群組紀錄」開關也從共用父層狀態改成各自頁面自己管理。舊的 `/my-groups?view=X` 網址仍相容，交由 `MyGroupsLegacyRedirect` 依 `view` 參數導向對應新頁面。
