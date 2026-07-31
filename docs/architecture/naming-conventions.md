# 命名慣例

實際掃過 `src/`、`server/` 底下的檔名驗證過，以下慣例目前都有被遵守。

## 資料夾

- `src/features/` 下每個資料夾對應一個產品功能區（`explore`、`create`、`subscriptions`、`manage-groups` 等），內部再依 `components/`、`hooks/`、`utils/` 拆分
- `src/common/` 下依技術層次拆分：`api/`（REST 封裝）、`stores/`（Zustand）、`utils/`（工具函式）、`layout/`（全域版面）——**不含 `ui/`**，所有共用元件統一放在 `src/components/ui/`
- `src/components/ui/` 是全站唯一的共用元件資料夾，內部依用途分層（不是分成兩個各自獨立的頂層資料夾）：最外層是 shadcn/ui 風格的純元件（`button.jsx`、`dialog.jsx`、`avatar.jsx` 等，檔名一律 kebab-case，對齊 shadcn CLI 產生的檔案慣例），跟這些純元件同一層還有綁定業務邏輯的組合元件（`TopupModal.jsx`、`StatusBadge.jsx` 等，檔名 PascalCase）；`primitives/` 子資料夾放不帶業務邏輯、但 shadcn 沒有對應物的通用元件；`group/` 子資料夾放群組詳情 Modal 家族專用元件。原本這兩層曾經拆成 `components/ui/` 與 `shared/ui/`（後改名 `common/`）兩個各自獨立的頂層資料夾，因為「兩個都叫 ui」在瀏覽專案時容易誤以為沒整理乾淨，已合併成一個（見 [前端架構](./frontend-architecture.md)）

## 元件

- **Page 元件**一律以 `Page` 結尾，且是路由直接掛載的頂層元件：`ExplorePage.jsx`、`HomePage.jsx`、`CreateGroupPage.jsx`、`ManageGroupsPage.jsx`、`SubscriptionsPage.jsx` 等
- **Modal 元件**（feature/業務層）一律以 `Modal` 結尾：`GroupDetailModal.jsx`、`MessagesModal.jsx`、`ApplyModal.jsx`、`TopupModal.jsx` 等；底層共用殼例外，命名對齊 shadcn/Radix 官方慣例叫 `Dialog`（`components/ui/dialog.jsx`），不叫 `Modal`
- **Card 元件**一律以 `Card` 結尾，用於列表中的單一項目呈現：`ExploreGroupCard.jsx`、`HostedGroupCard.jsx`、`SubscriptionCard.jsx`、`ApplicationCard.jsx`
- 元件檔名一律 PascalCase，且檔名與 `export default function` 的名稱一致
- 例外：`src/features/manage-groups/components/hostGroupView/` 底下有一組 `buildXxxPanel.jsx`（`buildBillingPanel.jsx`、`buildMembersPanel.jsx` 等），命名不是 PascalCase 元件慣例，而是「回傳 JSX 的建構函式」——這是 `HostGroupView.jsx` 這個大型元件拆分出來的 panel builder，刻意用 `build` 前綴跟一般 Page/Modal/Card 元件區分，代表它們不是獨立可路由/可複用的元件，而是orchestrator 內部的拆分單位

## Hooks

- 自訂 hook 一律以 `use` 開頭：`useScrollEdge`、`useMediaQuery`、`useHideOnScroll`、`useMessageScroll`、`useParticipantNames` 等，散落於 `common/utils/hooks.js`（跨功能共用）與各 feature 自己的 `hooks/` 資料夾（功能專屬）

## Stores（Zustand）

- 一律 `useXxxStore.js`，`Xxx` 對應主要管理的 REST 資源（單數或複數依資源本身慣例）：`useGroupStore`、`useApplicationStore`、`useMemberStore`、`useSubscriptionStore`、`useNotificationStore`、`useFavoriteStore`、`useConversationStore`、`useReviewStore`、`useServiceStore`、`useAuthStore`
- 檔名與 store 內 `export const useXxxStore = create(...)` 的變數名一致

## API 模組

- 一律 `xxxApi.js`，`xxx` 為複數資源名的 camelCase：`applicationsApi.js`、`groupsApi.js`、`membersApi.js`、`notificationsApi.js` 等；`axiosClient.js`（底層 instance）、`storageApi.js`（非 REST，圖片上傳）為例外
- API 函式命名沒有嚴格統一前綴，依語意選用最貼切的動詞：`fetchXxx`（讀取列表）、`readAllXxx`、`insertXxx`/`createXxx`（新增）、`patchXxx`/`updateXxx`（更新）、`removeXxx`/`deleteXxx`（刪除），實際選用哪個依該資源在 API 語意上更自然為準，非強制單一動詞

## 後端（Express + Prisma）

- Route 檔名一律複數資源名：`applications.js`、`members.js`、`notifications.js`、`favorites.js`、`subscriptions.js`、`reviews.js`、`services.js`、`paymentMethods.js`、`tokens.js`；例外是 `auth.js`（動作導向而非資源導向）、`upload.js`（技術性 route）、`systemMessages.js`（camelCase 複合詞，非單一資源複數）
- 例外：`groups/` 因為端點數量多（13 個）拆成子資料夾，`crud.js`（CRUD + 交易紀錄查詢）與 `lifecycle.js`（狀態機轉換動作）兩個檔案由 `groups/index.js` 合併掛載，對外仍是單一 `/api/groups` 路由
- Prisma model 一律單數 PascalCase：`User`、`Group`、`Application`、`Member`、`Subscription`、`TokenTransaction`、`Notification`、`Favorite`、`Conversation`、`Message`、`Review`、`PaymentMethod`、`Service`
- Model 對應的資料表名透過 `@@map()` 轉成 snake_case 複數（例如 `Application` → `applications`、`TokenTransaction` → `token_transactions`）
