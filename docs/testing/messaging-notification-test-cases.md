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
