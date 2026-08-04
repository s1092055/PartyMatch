# 頁面地圖

路由定義於 `src/app/router.jsx`。除了 `/`、`/quick-match`、`/create-group` 外，其餘路由都掛在共用的 `AppLayout`（`src/common/layout/AppLayout.jsx`）之下，共用 sidebar / 底部 Dock 導覽。

## 一般路由

| 路由 | 頁面元件 | 是否需登入 | 用途說明 |
|------|----------|------------|----------|
| `/` | `src/features/home/HomePage.jsx` | 否 | 行銷首頁：Hero（單一「探索群組」CTA 置中）、支援服務跑馬燈、功能介紹、如何運作、團主指南、FAQ；「快速搜尋」入口在導覽列（側邊欄／手機 Dock），不放在 Hero |
| `/login` | `src/features/auth/login/LoginPage.jsx` | 否（`PublicOnlyRoute`，已登入會被導開） | Email/密碼登入表單 |
| `/register` | `src/features/auth/register/RegisterPage.jsx` | 否（`PublicOnlyRoute`） | 新使用者註冊表單 |
| `/forgot-password` | `src/features/auth/forgot-password/ForgotPasswordPage.jsx` | 否（`PublicOnlyRoute`） | 忘記密碼流程 |
| `/explore` | `src/features/explore/ExplorePage.jsx` | 否 | 探索所有群組：分類篩選、關鍵字搜尋、價格上限、排序，篩選條件存於 URL query string |
| `/groups/:groupId` | 無獨立頁面元件（`GroupRedirect`，見下方「Modal 型路由」） | 否 | 導向 `/explore` 並以事件開啟指定群組的詳情 Modal，讓群組詳情可以直接分享連結 |
| `/disclaimer` | `src/features/legal/DisclaimerPage.jsx` | 否 | 平台免責聲明 |
| `/terms` | `src/features/legal/TermsPage.jsx` | 否 | 服務條款 |
| `/privacy` | `src/features/legal/PrivacyPage.jsx` | 否 | 隱私權政策 |
| `/my-subscriptions` | `src/features/subscriptions/SubscriptionsPage.jsx` | 是（`ProtectedRoute`） | 「我的訂閱」，成員視角：查看訂閱、篩選分頁、群組紀錄 |
| `/manage-groups` | `src/features/manage-groups/ManageGroupsPage.jsx` | 是（`ProtectedRoute`） | 「群組管理」，團主視角：管理群組名單、篩選分頁、群組紀錄 |
| `/my-groups` | 無頁面元件（`MyGroupsLegacyRedirect`） | 是 | 舊版合併頁的相容路由，依 `?view=host`／其餘導向 `/manage-groups`／`/my-subscriptions` |
| `/favorites` | `src/features/favorites/FavoritesPage.jsx` | 是 | 已收藏群組列表，只顯示還在招募中且有名額的群組（跟探索頁同一套過濾條件），額滿/已解散/已結束的收藏群組不會顯示 |
| `/account` | `src/features/account/AccountPage.jsx` | 否（訪客可進入，但除「其他設定」外各分頁皆顯示「登入後查看」提示） | 帳號中心：個人資料、付款方式、PM 幣、帳號設定（含停用帳號、顯示大頭照與目前狀態等隱私/偏好設定），`isAdmin` 使用者多一個管理員分頁；側邊欄／手機版頭像入口未登入時也導向此頁（顯示 PartyMatch logo 頭像＋「訪客」） |
| `/quick-match` | `src/features/match/QuickMatchPage.jsx` | 否（獨立全螢幕步驟頁，脫離 `AppLayout`；申請加入群組時才需登入） | 多步驟配對流程：輸入服務／預算條件 → 篩選方案 → 查看推薦結果 |
| `/create-group` | `src/features/create/CreateGroupPage.jsx` | 是（頂層 `ProtectedRoute`，獨立全螢幕步驟頁，脫離 `AppLayout`） | 4 步驟建立群組表單：選服務 → 選方案（含收費週期）→ 群組設定 → 確認送出（桌機有即時預覽） |

## Modal 型路由 / 全域覆蓋層

以下功能沒有獨立網址，而是用 `window.dispatchEvent` 觸發的全域 Modal／面板，疊加在既有頁面上（詳見架構文件「事件驅動跨元件通訊」）。

| 觸發方式 | 元件 | 掛載位置 | 用途 |
|----------|------|----------|------|
| 造訪 `/groups/:groupId`，或點群組卡片、通知等處 dispatch `pm:open-group` | `src/features/group/GroupDetailModal.jsx` | `AppLayout`；`/quick-match` 因脫離 `AppLayout`，由 `QuickMatchPage.jsx` 自行額外掛載一份（lazy） | 顯示指定群組的公開詳情（服務資訊、方案、成員狀況），可在其中開啟 `ApplyModal` 送出加入申請；讓群組詳情有可分享的網址 |
| 「群組管理」／「我的訂閱」頁點自己相關的群組卡片，或 dispatch `pm:open-host-group` | `src/components/ui/group/GroupViewModal.jsx`（依身分渲染 `HostGroupView` 或 `MemberGroupView`） | `ManageGroupsPage.jsx` / `SubscriptionsPage.jsx` | 團主或成員視角下管理／查看單一群組的完整細節（群組名單、收款/付款面板、服務帳號、續訂、申訴等） |
| 「群組管理」／「我的訂閱」頁最上方標題列的「群組紀錄」按鈕（各自頁面自己管理開關狀態） | `src/components/ui/group/GroupHistoryModal.jsx` | `ManageGroupsPage.jsx` / `SubscriptionsPage.jsx` | 查看已結束／已解散（`cancelled`）的群組歷史紀錄 |
| 帳號中心 Hero 區塊「我的評價」按鈕 | `src/features/manage-groups/components/HostReviewsModal.jsx` | `AccountPage.jsx` | 彙總團主名下所有群組收到的評價 |
| 帳號中心 Hero 區塊「信用分數」按鈕 | `src/components/ui/CreditScoreModal.jsx` | `AccountPage.jsx` | 查看信用分數與計分規則 |
| 點擊訊息圖示，或 dispatch `pm:open-messages` / `pm:open-dm` | `src/features/messages/MessagesModal.jsx` | `HomePage.jsx`、`AppLayout`；`/quick-match` 同樣由 `QuickMatchPage.jsx` 自行額外掛載一份（lazy），讓搜尋結果頁的「聯絡團主」按鈕能正常開啟私訊 | 訊息中心：群組聊天室、私人 DM、系統通知聊天室，切換對話列表與聊天視窗 |
| 點擊儲值／PM 幣不足時的「前往儲值」，或 dispatch `pm:open-topup` | `src/components/ui/TopupModal.jsx` | `AppNav.jsx`（全站可觸發） | PM 幣儲值與交易紀錄查詢 |
| 點擊鈴鐺圖示，或 dispatch `pm:open-notify` | `src/common/layout/FloatingMessages.jsx` 內的通知面板（`createPortal`） | 全站（`AppNav` 掛載處） | 個人通知與系統公告列表，點擊項目會依通知類型導向對應頁面並帶出對應 Modal |
