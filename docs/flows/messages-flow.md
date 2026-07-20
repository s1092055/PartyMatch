# 訊息 / 聊天室流程

## 使用者目標
使用者希望跟團主或群組成員溝通——可能是群組聊天室的多人討論、私人 DM，或查看平台系統通知的訊息式呈現。

## 入口
- 全域 `MessagesModal`：由 `window.dispatchEvent(new CustomEvent('pm:open-messages'))` 觸發開啟，在 `AppLayout` 統一監聽
- `AppNav`（桌機 sidebar / 手機 header）的訊息按鈕
- `FloatingMessages`：監聽通知點擊後也可能連帶開啟對應對話

## 前端檔案
- `src/features/messages/MessagesModal.jsx`（狀態管理與 orchestration）
- `src/features/messages/utils.js`（`formatTime` 共用工具）
- `src/features/messages/components/ConversationList.jsx`
- `src/features/messages/components/ChatWindow.jsx`
- `src/features/messages/components/ChatMembersPanel.jsx`
- `src/features/messages/components/ConversationAvatar.jsx`
- `src/features/messages/components/ConversationMenu.jsx`
- `src/features/messages/components/MessageBubble.jsx`
- `src/features/messages/hooks/useMessageScroll.js`
- `src/features/messages/hooks/useParticipantNames.js`
- `src/shared/stores/useConversationStore.js`
- `src/shared/api/messagesApi.js`
- `src/shared/utils/poller.js`（輪詢共用機制）

## 後端檔案
- `server/src/routes/conversations.js`

## 資料表 / Model
- `Conversation`（`type`: `group` / `dm` / `system`；`participants`、`unreadCounts`、`lastReadAt`、`lastMessage` 為 JSON 欄位；`initiatorId` 記錄 DM 發起人）
- `Message`（一般訊息 `type: 'text'`；系統訊息另有 `actionType`/`payload` 供前端渲染操作型訊息）

## 使用技術
- Polling（非 WebSocket）：`useConversationStore` 每 5 秒輪詢對話列表；`subscribeToMessages`（`messagesApi.js`）輪詢單一對話的訊息
- 三處輪詢（`useNotificationStore`、`subscribeToConversations`、`subscribeToMessages`）共用 `src/shared/utils/poller.js` 的 `startPolling(pollOnce, intervalMs)`：立即跑一次 + 每隔 intervalMs 跑一次，並把 `isActive()` 傳給 callback，讓輪詢邏輯在 await 之後自己判斷這次結果還該不該寫回（避免登出後 `stop()` 已呼叫，await 才跑完卻寫入過期資料）
- DM 延遲曝光靠後端判斷，不依賴前端輪詢時機

## 流程步驟

### 群組聊天室
1. 群組額滿鎖定後，團主端會建立群組聊天室（`POST /conversations/group`，`participants` 為該群組所有成員 + 團主）
2. 成員/團主開啟 `MessagesModal`，`ConversationList` 顯示所有可見對話
3. 選擇對話後 `ChatWindow` 呼叫 `fetchMessages` 取得訊息，並開始輪詢新訊息
4. 送出訊息呼叫 `sendMessage`（`POST /conversations/:id/messages`），後端驗證 `req.user.id` 在 `participants` 內才允許寫入

### 私人 DM（延遲曝光）
1. 使用者在某個情境下點擊「聯絡團主/成員」，呼叫 `getOrCreateDmConversation(targetUserId)`（`POST /conversations/dm`）
2. 後端以排序過的 `[userId1, userId2]` 查詢是否已有 `type: 'dm'` 的對話，沒有則建立新對話並記錄 `initiatorId` 為發起人
3. **延遲曝光**：`GET /conversations` 回傳列表時，若對話的 `initiatorId` 存在、不是自己、且 `lastMessage == null`（代表發起人還沒送出第一則訊息），則從列表中過濾掉——對方要等到發起人真的送出第一則訊息才會在自己的列表中看到這個對話
4. 這個判斷完全在後端 `GET /conversations` 的查詢邏輯裡，不依賴輪詢時機或前端判斷

### 系統通知聊天室
1. 每位使用者註冊時自動建立一間 `type: 'system'` 的對話（`participants` 只有自己）
2. 唯讀，成員無法回覆，由平台系統帳號發送公告或客服訊息，`Message` 可能帶 `actionType`/`payload` 渲染成可互動的操作型訊息

## 驗證重點
- 所有訊息相關 route 都先解析 `conversation.participants`（JSON 欄位，要相容陣列或字串兩種儲存格式）確認 `req.user.id` 在裡面，非參與者一律拒絕
- DM 建立時對 `participants` 排序後查詢，確保同一對使用者不會重複建出多個 DM 對話
- 已讀狀態（`markConversationRead`／`PATCH /:id/read`）跟未讀數（`unreadCounts`）要跟訊息送出保持同步，避免未讀數跟實際訊息數量對不上
