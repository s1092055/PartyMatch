# 頁面地圖

路由定義於 `src/app/router.jsx`。除了 `/`、`/quick-match`、`/create-group` 外，其餘路由都掛在共用的 `AppLayout`（`src/shared/layout/AppLayout.jsx`）之下，共用 sidebar / 底部 Dock 導覽。

## 一般路由

| 路由 | 頁面元件 | 是否需登入 | 用途說明 |
|------|----------|------------|----------|
| `/` | `src/features/home/HomePage.jsx` | 否 | 行銷首頁：Hero、支援服務跑馬燈、功能介紹、如何運作、團主指南、FAQ，導向「探索群組」或「快速搜尋」 |
| `/login` | `src/features/auth/login/LoginPage.jsx` | 否（`PublicOnlyRoute`，已登入會被導開） | Email/密碼登入表單 |
| `/register` | `src/features/auth/register/RegisterPage.jsx` | 否（`PublicOnlyRoute`） | 新使用者註冊表單 |
| `/forgot-password` | `src/features/auth/forgot-password/ForgotPasswordPage.jsx` | 否（`PublicOnlyRoute`） | 忘記密碼流程 |
| `/explore` | `src/features/explore/ExplorePage.jsx` | 否 | 探索所有群組：分類篩選、關鍵字搜尋、價格上限、排序，篩選條件存於 URL query string |
| `/groups/:groupId` | 無獨立頁面元件（`GroupRedirect`，見下方「Modal 型路由」） | 否 | 導向 `/explore` 並以事件開啟指定群組的詳情 Modal，讓群組詳情可以直接分享連結 |
| `/disclaimer` | `src/features/legal/DisclaimerPage.jsx` | 否 | 平台免責聲明 |
| `/terms` | `src/features/legal/TermsPage.jsx` | 否 | 服務條款 |
| `/privacy` | `src/features/legal/PrivacyPage.jsx` | 否 | 隱私權政策 |
| `/my-groups` | `src/features/my-groups/MyGroupsPage.jsx` | 是（`ProtectedRoute`） | 「我的群組」，以 `?view=member`／`?view=host` 切換成員／團主視角，內嵌 `MemberPage`／`HostPage`，含本月花費／收入等統計卡 |
| `/my-subscriptions` | 無頁面元件（`SubscriptionsRedirect`） | 是 | 導向 `/my-groups?view=member` 的相容路由 |
| `/manage-groups` | 無頁面元件（`ManageRedirect`） | 是 | 導向 `/my-groups?view=host` 的相容路由 |
| `/favorites` | `src/features/favorites/FavoritesPage.jsx` | 是 | 已收藏群組列表，可依分類篩選 |
| `/account` | `src/features/account/AccountPage.jsx` | 是 | 帳號中心：個人資料、付款方式、PM 幣、帳號設定（含停用帳號），`isAdmin` 使用者多一個管理員分頁 |
| `/quick-match` | `src/features/match/QuickMatchPage.jsx` | 否（獨立全螢幕步驟頁，脫離 `AppLayout`；申請加入群組時才需登入） | 多步驟配對流程：輸入服務／預算條件 → 篩選方案 → 查看推薦結果 |
| `/create-group` | `src/features/create/CreateGroupPage.jsx` | 是（頂層 `ProtectedRoute`，獨立全螢幕步驟頁，脫離 `AppLayout`） | 4 步驟建立群組表單：選服務 → 選方案（含收費週期）→ 群組設定 → 確認送出（桌機有即時預覽） |

## Modal 型路由 / 全域覆蓋層

以下功能沒有獨立網址，而是用 `window.dispatchEvent` 觸發的全域 Modal／面板，疊加在既有頁面上（詳見架構文件「事件驅動跨元件通訊」）。

| 觸發方式 | 元件 | 掛載位置 | 用途 |
|----------|------|----------|------|
| 造訪 `/groups/:groupId`，或點群組卡片、通知等處 dispatch `pm:open-group` | `src/features/group/GroupDetailModal.jsx` | `AppLayout` | 顯示指定群組的公開詳情（服務資訊、方案、成員狀況），可在其中開啟 `ApplyModal` 送出加入申請；讓群組詳情有可分享的網址 |
| 「我的群組」頁點自己相關的群組卡片，或 dispatch `pm:open-host-group` | `src/shared/ui/group/GroupViewModal.jsx`（依身分渲染 `HostGroupView` 或 `MemberGroupView`） | `HostPage.jsx` / `MemberPage.jsx`（`/my-groups` 內） | 團主或成員視角下管理／查看單一群組的完整細節（成員名單、收款面板、服務帳號、續訂、申訴等） |
| 「我的群組」側邊欄「群組紀錄」入口 | `src/shared/ui/group/GroupHistoryModal.jsx` | `HostPage.jsx` / `MemberPage.jsx` | 查看已結束／已取消的群組歷史紀錄 |
| 點擊訊息圖示，或 dispatch `pm:open-messages` / `pm:open-dm` | `src/features/messages/MessagesModal.jsx` | `HomePage.jsx`、`AppLayout` | 訊息中心：群組聊天室、私人 DM、系統通知聊天室，切換對話列表與聊天視窗 |
| 點擊儲值／PM 幣不足時的「前往儲值」，或 dispatch `pm:open-topup` | `src/shared/ui/TopupModal.jsx` | `AppNav.jsx`（全站可觸發） | PM 幣儲值與交易紀錄查詢 |
| 點擊鈴鐺圖示，或 dispatch `pm:open-notify` | `src/shared/layout/FloatingMessages.jsx` 內的通知面板（`createPortal`） | 全站（`AppNav` 掛載處） | 個人通知與系統公告列表，點擊項目會依通知類型導向對應頁面並帶出對應 Modal |
