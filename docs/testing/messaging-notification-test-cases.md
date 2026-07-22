# 訊息與通知測試案例

測試帳號見 [test-accounts.md](./test-accounts.md)。相關流程細節見 [訊息流程](../flows/messages-flow.md)、[通知流程](../flows/notification-flow.md)。

---

### TC-201：群組聊天室基本收發

**前置條件**：群組已額滿並鎖定（狀態 `full` 以後），聊天室已自動建立
**步驟**：
1. 團主帳號登入，開啟該群組的訊息（`HostGroupView` 內的訊息按鈕，會 dispatch `pm:open-messages`）
2. 送出一則文字訊息
3. 切換成該群組某位成員帳號登入，開啟同一個聊天室

**預期結果**：
- 成員端能看到團主剛才送出的訊息（輪詢間隔內會自動更新，非即時 WebSocket）
- 訊息按時間排序，最新在下方

---

### TC-202a：快速搜尋結果頁「聯絡團主」開啟 DM

**前置條件**：`/quick-match` 已完成搜尋並顯示結果（`Step4Results`），列表中某群組已有團主評價
**步驟**：
1. 已登入帳號開啟 `/quick-match`，走完步驟到「搜尋結果」
2. 點擊某張結果卡片開啟群組詳情（`QuickMatchPage` 額外掛載了 `GroupDetailModal`，跟 `AppLayout` 內那份各自獨立）
3. 在團主評價區點擊「聯絡團主」

**預期結果**：
- 群組詳情 Modal 能正常開啟（此頁在 `AppLayout` 之外，若沒有額外掛載會完全沒反應）
- 「聯絡團主」會 dispatch `pm:open-dm`，並正確開啟與團主的 DM 視窗（`QuickMatchPage` 也額外掛載了 `MessagesModal` 才有監聽者接住這個事件）

---

### TC-202：私人 DM 延遲曝光

**前置條件**：使用者 A、B 之前沒有 DM 對話紀錄
**步驟**：
1. A 登入，對 B 點擊「聯絡」（例如 `buildMembersPanel.jsx` 或 `MemberGroupView.jsx` 的聯絡按鈕），開啟與 B 的 DM
2. **先不要送出任何訊息**，切換成 B 帳號登入，查看訊息列表
3. 回到 A 帳號，送出第一則訊息給 B
4. 再切換回 B 帳號查看訊息列表

**預期結果**：
- 步驟 2：B 的訊息列表**看不到**這個對話（`initiatorId` 是 A、`lastMessage` 為 null，後端 `GET /conversations` 會過濾掉）
- 步驟 4：B 的訊息列表**出現**這個對話，且能看到 A 剛送出的訊息

---

### TC-203：系統通知聊天室唯讀

**前置條件**：任一帳號登入
**步驟**：
1. 開啟訊息列表，找到系統通知聊天室（`type: 'system'`）
2. 嘗試在該對話輸入並送出訊息

**預期結果**：
- 系統對話應無法回覆（唯讀），或前端根本不提供輸入框
- 若後端 API 被直接呼叫（非經前端 UI），`POST /conversations/:id/messages` 是否也擋下非參與者/非法寫入需一併確認（system 對話 `participants` 只有使用者自己，理論上使用者仍是 participant，但角色語意上是唯讀客服頻道，需確認前端有沒有隱藏輸入框）

---

### TC-204：未讀數計算與已讀標記

**前置條件**：某帳號有未讀訊息與未讀通知
**步驟**：
1. 登入該帳號，觀察 `AppNav` 訊息／通知按鈕上的未讀數
2. 開啟該對話 / 通知面板
3. 重新整理頁面，再次查看未讀數

**預期結果**：
- 開啟前未讀數 > 0
- 開啟後該對話/通知的未讀狀態應更新（`markConversationRead` / `markRead`）
- 重新整理後未讀數應反映已讀狀態，不會重新變回未讀

---

### TC-205：通知點擊導向正確畫面

**前置條件**：帳號至少有 1 筆 `new_application`（團主收到新申請）通知與 1 筆 `application_approved`（成員收到核准）通知
**步驟**：
1. 團主帳號點擊 `new_application` 通知
2. 成員帳號點擊 `application_approved` 通知

**預期結果**：
- 步驟 1：導向 `/my-groups?view=host`，並自動開啟該群組的申請分頁（`openApplications: true`），且申請列表資料是最新的（點擊前會先 `await applicationStore.init()`）
- 步驟 2：若該成員已有對應訂閱，導向 `/my-groups?view=member` 並開啟該群組；若尚未有訂閱（極少見於此情境），導向 `/explore` 並開啟群組詳情

---

### TC-206：未登入使用者的通知面板

**前置條件**：未登入狀態
**步驟**：
1. 開啟通知面板

**預期結果**：
- 只顯示公開系統公告（`isPublic: true`），不應出現個人通知
- 點擊公告若有連結，僅允許導向公開頁面（不會導向 `/my-groups`、`/account`、`/favorites` 等需登入頁面，這些連結點擊應被忽略）

---

### TC-207：偽造公開公告防護（後端驗證）

**前置條件**：一般非管理員帳號的 accessToken
**步驟**：
1. 直接呼叫 `POST /notifications`，`body.isPublic` 設為 `true`

**預期結果**：
- 後端應忽略前端傳入的 `isPublic`（一律視為 false），不應建立出一筆對所有人可見的公告

---

### TC-208：退出群組後團主收到通知

**前置條件**：某群組已有至少一位非團主成員，團主與該成員各自登入不同瀏覽器/分頁
**步驟**：
1. 成員帳號透過「我的群組」或群組詳情 Modal 側邊欄的「退出群組」離開群組（兩個入口共用同一套 `finalizeLeaveGroup`）
2. 團主帳號重新整理頁面或等待通知輪詢，查看通知面板

**預期結果**：
- 團主應收到一筆 `member_left` 通知（標題「成員退出群組」），點擊後導向 `/my-groups?view=host` 並開啟該群組、同時觸發 `pm:refresh-member-stores` 刷新成員名單
- 成員自己退出後也應同時離開該群組聊天室（`leaveConversation`），之後在訊息列表看不到這個群組聊天室
- 舊版 bug：通知曾誤寫進成員自己本地端的樂觀通知清單，導致團主完全收不到通知；現在改用 `insertNotification` 寫入後端 DB，須確認團主重新整理後才看得到（非樂觀即時）

---

### TC-209：系統公告 broadcast 部分失敗不中斷（後端驗證）

**前置條件**：管理員帳號，平台內有多位使用者
**步驟**：
1. 管理員後台呼叫 `POST /system-messages/broadcast` 對全平台使用者發送同一則系統公告
2. 若其中一位使用者的系統聊天室資料異常（例如 `Conversation` 記錄缺漏），觀察其餘使用者是否仍收到公告

**預期結果**：
- 後端改用 `Promise.allSettled` 平行發送給所有使用者，單一使用者寫入失敗不應中斷整批廣播
- 舊版 bug：曾用 `for...await` 逐一序列發送，其中一人失敗會讓後面所有使用者都收不到
