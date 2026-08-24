# 前端架構

## 技術基礎

React 19 + Vite，React Router v7 集中管理路由，頁面元件皆以 `lazy()` + `Suspense` 動態載入。Zustand 管理跨頁面共享狀態，資料讀取一律走 Store 層模式。

## 資料夾結構原則：`features/` vs `common/`

依「使用者看到的功能」切分 `features/`（各自擁有 Page/Modal 進入點、專屬 components/hooks/utils），跨功能共用或不屬於特定業務頁面的程式碼放進 `common/`（api、stores、layout、data、utils）。全站共用 UI 元件（含 shadcn/ui 風格元件與業務組合元件）統一收斂在 `src/components/ui/` 底下依用途分層。

判斷準則：只被單一 feature 使用 → 留在該 feature；被兩個以上共用 → 移至 `common/` 或 `components/ui/`。

## 深色模式

`ThemeProvider` 預設跟隨系統偏好，登入後可在「偏好設定」Modal 手動切換並持久化。切換機制以 class 掛在根節點並在畫面掛載前同步套用，避免閃爍；色彩系統建立在 CSS 變數 token 上，深色模式只需重新宣告變數即可套用全站。

## Store 層

10 個 Zustand store，每個對應一個後端 REST 資源，採「記憶體快取」模式（`init()` 讀取、`create`/`update` 呼叫 API 後更新本地快取）。選 Zustand 而非 Redux／Context：狀態本質是伺服器資料的本地快取，不需要 Redux 的樣板碼，訂閱粒度也比 Context 細，避免不必要的重渲染。

App 啟動時分兩階段初始化：先載入不需登入的公開資料（服務清單、招募中群組、通知），登入後才載入私人資料（申請、訂閱、成員、收藏、對話），避免未登入狀態呼叫受保護端點。

## API 層

每個後端資源對應一個 API 封裝模組，只做 REST CRUD 呼叫，業務邏輯留在 store 層。底層共用一個 axios instance，自動附加認證 header，並在 token 過期時自動換發、排隊重放請求。詳見 [認證機制](./authentication.md)。

## Modal 管理

全域 Modal 採事件驅動（`CustomEvent` + `window.addEventListener`）觸發開啟，避免跨路由層級傳遞 props。群組詳情這類多層次 Modal 共用同一套滑動軌道殼元件。

## 路由設計

四大類路由：公開路由（首頁、探索、登入/註冊等）、需登入路由（巢狀於帶 sidebar/dock 的版面內，由路由守衛保護）、獨立的全螢幕步驟流程頁（僅建立群組），以及不對外公開入口的管理員後台（獨立版面與路由守衛，非管理員一律導回首頁，不顯示登入提示）。快速配對已改為全站共用的 Modal（事件驅動觸發，見上方「Modal 管理」），不再是獨立頁面，舊路由僅保留相容重導向。

導覽列依裝置有無 hover 能力（而非單純寬度）切換成兩套 UI：真桌機用可收合的側邊欄，手機與 iPad（含橫向大螢幕）共用左側滑出的 Drawer，避免觸控裝置被誤判為桌機。

## 版本更新提示

前端會定期輪詢一支版本標記檔案，偵測到部署了新版本時提示使用者重新整理，避免舊分頁踩到「動態載入到已不存在的舊版檔案」而出錯。

## 大型元件的拆分方式

核心 orchestrator 元件（負責 state/effects/handler）將 UI 拆給子元件或 panel builder，判斷準則是職責邊界是否清楚，而非行數多寡；狀態留在 orchestrator，子元件盡量做成 presentational。
