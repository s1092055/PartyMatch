# 命名慣例

實際掃過 `src/`、`server/` 底下的檔名驗證過，以下慣例目前都有被遵守。

## 資料夾

- `src/features/` 下每個資料夾對應一個產品功能區（`explore`、`create`、`my-groups` 等），內部再依 `components/`、`hooks/`、`utils/` 拆分
- `src/shared/` 下依技術層次拆分：`api/`（REST 封裝）、`stores/`（Zustand）、`ui/`（共用元件）、`utils/`（工具函式）、`layout/`（全域版面）
- `shared/ui/` 內再依用途分兩層子資料夾：`primitives/`（不帶業務邏輯的通用元件）、`group/`（群組詳情 Modal 家族），其餘綁定特定業務概念但非群組專屬的元件留在最外層（見 [前端架構](./frontend-architecture.md)）

## 元件

- **Page 元件**一律以 `Page` 結尾，且是路由直接掛載的頂層元件：`ExplorePage.jsx`、`HomePage.jsx`、`CreateGroupPage.jsx`、`HostPage.jsx`、`MemberPage.jsx` 等
- **Modal 元件**一律以 `Modal` 結尾：`GroupDetailModal.jsx`、`MessagesModal.jsx`、`ApplyModal.jsx`、`TopupModal.jsx` 等，包含 `shared/ui/primitives/Modal.jsx` 這個共用殼本身
- **Card 元件**一律以 `Card` 結尾，用於列表中的單一項目呈現：`ExploreGroupCard.jsx`、`HostedGroupCard.jsx`、`SubscriptionCard.jsx`、`ApplicationCard.jsx`
- 元件檔名一律 PascalCase，且檔名與 `export default function` 的名稱一致
- 例外：`src/features/my-groups/host/components/hostGroupView/` 底下有一組 `buildXxxPanel.jsx`（`buildBillingPanel.jsx`、`buildMembersPanel.jsx` 等），命名不是 PascalCase 元件慣例，而是「回傳 JSX 的建構函式」——這是 `HostGroupView.jsx` 這個大型元件拆分出來的 panel builder，刻意用 `build` 前綴跟一般 Page/Modal/Card 元件區分，代表它們不是獨立可路由/可複用的元件，而是orchestrator 內部的拆分單位

## Hooks

- 自訂 hook 一律以 `use` 開頭：`useScrollEdge`、`useMediaQuery`、`useHideOnScroll`、`useMessageScroll`、`useParticipantNames` 等，散落於 `shared/utils/hooks.js`（跨功能共用）與各 feature 自己的 `hooks/` 資料夾（功能專屬）

## Stores（Zustand）

- 一律 `useXxxStore.js`，`Xxx` 對應主要管理的 REST 資源（單數或複數依資源本身慣例）：`useGroupStore`、`useApplicationStore`、`useMemberStore`、`useSubscriptionStore`、`useNotificationStore`、`useFavoriteStore`、`useConversationStore`、`useReviewStore`、`useServiceStore`、`useAuthStore`
- 檔名與 store 內 `export const useXxxStore = create(...)` 的變數名一致

## API 模組

- 一律 `xxxApi.js`，`xxx` 為複數資源名的 camelCase：`applicationsApi.js`、`groupsApi.js`、`membersApi.js`、`notificationsApi.js` 等；`axiosClient.js`（底層 instance）、`storageApi.js`（非 REST，圖片上傳）為例外
- API 函式命名沒有嚴格統一前綴，依語意選用最貼切的動詞：`fetchXxx`（讀取列表）、`readAllXxx`、`insertXxx`/`createXxx`（新增）、`patchXxx`/`updateXxx`（更新）、`removeXxx`/`deleteXxx`（刪除），實際選用哪個依該資源在 API 語意上更自然為準，非強制單一動詞

## 後端（Express + Prisma）

- Route 檔名一律複數資源名：`applications.js`、`groups.js`、`members.js`、`notifications.js`、`favorites.js`、`subscriptions.js`、`reviews.js`、`services.js`、`paymentMethods.js`、`tokens.js`；例外是 `auth.js`（動作導向而非資源導向）、`upload.js`（技術性 route）、`systemMessages.js`（camelCase 複合詞，非單一資源複數）
- Prisma model 一律單數 PascalCase：`User`、`Group`、`Application`、`Member`、`Subscription`、`TokenTransaction`、`Notification`、`Favorite`、`Conversation`、`Message`、`Review`、`PaymentMethod`、`Service`
- Model 對應的資料表名透過 `@@map()` 轉成 snake_case 複數（例如 `Application` → `applications`、`TokenTransaction` → `token_transactions`）
