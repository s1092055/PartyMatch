# RWD 測試案例

PartyMatch 的斷點實質上只有兩段（`src/index.css` `@theme`：`sm`／`md` 皆為 768px，`lg`／`xl`／`2xl` 皆為 1280px）。**這兩段在用途上分成兩層，測試時要分開驗證**：
- **裝置類型切換（主導覽／側邊欄）一律用 `lg:`（≥1280px 才算「桌機」）**：因為側邊欄靠 `:hover`／`:focus-within` 展開顯示文字標籤，iPad（不論直向 768px+ 或橫向 1024px+，都 <1280px）是觸控裝置沒有真正的 hover，若用 `md:` 判斷會被誤判成桌機、卡在收合狀態看不到任何文字標籤（見 TC-301）
- **純內容排版（grid 欄數、篩選列橫排/直排、Modal 內部分頁佈局等，不涉及 hover 才能看到內容）可以繼續用 `md:`（≥768px）**：這類切換手機/平板/桌機都能正常互動，不受觸控裝置無法 hover 影響

實測建議用瀏覽器 DevTools 的裝置模擬，至少涵蓋：手機 390px（iPhone 尺寸）、iPad 直向 768px 與橫向 1024px（務必包含在 1280px 以下的範圍，這是最容易漏測、卡在「不上不下」中間地帶的寬度）、桌機 1440px。

---

### TC-301：主導覽 RWD 切換

**步驟**：分別在手機（<768px）、iPad 寬度（768–1279px，直向與橫向都要測）、桌機（≥1280px）開啟任一頁面

**預期結果**：
- **手機與 iPad（<1280px）都應該顯示同一套「手機版」導覽**：頂部 header（Logo + 通知 + 頭像）+ 底部 Dock（快速搜尋、建立群組、探索中央圓形按鈕、我的 dropdown、訊息）；PM幣餘額與信用分數改收在頭像下拉選單裡，不直接顯示在 header 列。這個範圍內導覽全部是點擊觸發（不依賴 hover），文字標籤本來就一直可見
- **只有桌機（≥1280px）才顯示側邊欄**：左側 floating sidebar，收合 64px icon bar，hover/focus-within 展開至 256px 顯示文字標籤——這個互動方式假設有滑鼠，所以刻意只在 `lg:` 才出現，避免 iPad 這類觸控裝置卡在收合狀態、永遠看不到文字標籤（曾經用 `md:` 判斷，導致 iPad 被誤判成桌機，見 [歷史異動](../history/flows-history.md)）
- 桌機時，通知按鈕與 PM幣餘額是獨立於 floating sidebar 之外、fixed 在畫面右上角的區塊（PM幣寬度貼齊通知按鈕，僅登入時顯示），不隨 sidebar 收合/展開狀態變化
- 桌機時，訊息按鈕同樣獨立 fixed 在畫面右下角，對齊 sidebar 頭像高度
- 桌機時，sidebar 展開時底部使用者頭像列右側會多出「信用分數」按鈕（hover/focus-within 才淡入顯示，收合時隱藏）
- 未登入時，桌機 sidebar 與手機版 header 的頭像都改顯示 PartyMatch logo（不是姓名縮寫色塊），文字顯示「登入」；點擊仍會導向帳號中心 `/account`（訪客也能瀏覽，見 [`explore-account-test-cases.md`](./explore-account-test-cases.md) TC-433），不是直接跳登入頁
- 手機與 iPad 的 Dock 往下捲動時應滑出隱藏，往上捲或接近頁面頂端時重新顯示（`useHideOnScroll`）
- `ScrollToTop` 按鈕位置應隨 Dock 顯示狀態連動（`lg:` 以下才需要避開 Dock），不應與 Dock 重疊

---

### TC-302：我的訂閱／群組管理頁面版面

**步驟**：在 `/my-subscriptions` 與 `/manage-groups` 分別測手機與 `md:` 以上寬度

**預期結果**：
- `FilterTabsBar` 手機/桌機都是同一套橫向 underline tabs（3 個分類寬度放得下，不用下拉選單，也不是左側垂直 nav），置於群組/訂閱卡片列表正上方，單欄版面（不分左右兩欄）
- 下方卡片 grid 用 `auto-fill`/`minmax`（`grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]`）依容器實際可用寬度決定一列排幾張，不是用 `md:grid-cols-2` 這種固定欄數斷點
- 頁面最上方標題列：標題文字置左，「群組紀錄」按鈕置右，手機/桌機同一種排法，沒有 fixed 定位，外框樣式
- 點擊「群組紀錄」開啟 `GroupHistoryModal`（`/my-subscriptions`、`/manage-groups` 各自獨立管理自己的開關狀態，互不影響）

---

### TC-303：群組詳情 Modal 側邊欄 RWD

**步驟**：開啟任一群組詳情 Modal（`GroupModalShell`），分別在手機與桌機寬度操作分頁切換（團主視角：群組概覽／服務內容／群組名單／申請管理或收款管理；成員視角：群組概覽／服務內容／群組名單／填寫帳號）

**預期結果**：
- 桌機：側邊分頁導覽（`md:w-24 md:flex-col`）與內容區並排顯示；「群組訊息」「退出群組」「解散群組」這類跟一般分頁切換互斥的項目，用 `pinned` 樣式（`md:mt-auto`）固定在側邊欄桌機版的最底部，不會跟其他分頁按鈕混在一起
- 手機：側邊欄改成橫向排列在內容區下方（`flex-row overflow-x-auto`），不應該側邊欄跟內容區同時佔滿畫面寬度導致擠壓變形
- Modal 內三層 panel 滑動軌道（`subPanel`/`subSubPanel`）在手機寬度下滑動切換動畫應正常，不應有橫向溢出
- 頂部倒數/狀態提醒 banner（`headerBanner`）是掛在 `panelKey` 區塊外面，切換分頁（例如概覽切到服務內容、群組名單）時 banner 應維持原地不動、不重新播放 slide-up 進場動畫；只有下方分頁內容本身有 slide-up 效果，且 banner 在所有分頁都要能看到，不只在群組概覽才顯示
- Modal 高度是 `min(92dvh, 720px)`（用 `dvh` 不是 `vh`，原因同 TC-304）：在 iPad Safari 分頁列/網址列展開、可視範圍較小時實測，Modal 上下應留有明顯的邊界間距，不應該貼著螢幕邊緣或看起來被裁切

---

### TC-304：帳號設定頁桌機 sidebar / 手機 accordion

**步驟**：開啟 `/account`，分別測手機與桌機寬度

**預期結果**：
- 桌機：左右 sidebar 分頁佈局，右側內容區固定高度（`calc(100dvh - 16rem)`，用 `dvh` 不是 `vh`——iOS Safari 的 `vh` 是抓工具列收合後的最大可視高度，跟分頁列/網址列展開時實際可視範圍對不上，會讓內容區在 iPad Safari 上算出過高的高度）並內部垂直捲動，登出按鈕固定在該容器最底部靠右
- 手機：分頁改為 accordion 展開收合，登出按鈕獨立置於 accordion 最底部
- 兩種版面下，帳號停用（軟刪除）流程的密碼輸入框與確認按鈕都應正常可操作

---

### TC-305：探索頁 FilterBar 版面

**步驟**：開啟 `/explore`，分別測手機與桌機寬度

**預期結果**：
- 分類 `CategoryPills`（`variant="grid"`）桌機版排成固定欄數的 grid（`md:grid-cols-10`），手機版改為單行可橫向滑動（不需要箭頭按鈕，靠手勢滑動）
- 搜尋框與服務/價格/排序三個 `FilterSelect`（`features/explore/components/FilterSelect.jsx`，自製 combobox，不依賴 Radix Select）一律同時顯示：桌機版同一列（`md:flex-row`，搜尋框 `md:flex-[2]`，三個篩選共用一個 `md:flex-[4]` 的 grid 容器、`md:grid-cols-3` 平分寬度）；手機版搜尋框獨立一列，下面三個篩選改成 `grid-cols-1` 各自獨立一整列、全寬顯示
- 價格選項選「自訂金額」時應切換成一個帶 PM 幣圖示的數字輸入框，直接輸入自訂金額上限（按 Enter 或失焦送出），輸入非正數或非數字時應保留在編輯狀態讓使用者修正，不會靜默捨棄；切換前後三個篩選框跟搜尋框寬度應保持一致，不會因為 Select 換成 input 就跑版變寬變窄
- `FilterSelect` 下拉展開時應緊貼在觸發按鈕正下方、無縫隙、共用同一條邊框（觸發按鈕展開時下邊框變透明、下拉選單 `rounded-b-lg` 補上圓角，視覺上像同一個容器往下延伸，不是浮在按鈕上方的獨立卡片），搭配由上往下滑入的位移＋淡入動畫；不會有多餘的 focus 光暈或點擊縮放效果；選項清單過長時內部捲動，捲軸本身要隱藏；服務篩選在「不限分類」時選項依分類分組並附灰色分類標題；同時只能有一個展開，點擊另一個篩選按鈕時前一個要單擊立即切換（不用點兩下）；支援方向鍵／Home／End／Enter／Esc／Tab 完整鍵盤操作
- 上方分類 pill 切換時，底下群組卡片 grid 應整個重新掛載並重播 slide-up 進場動畫（`key={filters.category}`）

---

### TC-306：建立群組 / 快速搜尋全螢幕步驟流程頁

**步驟**：開啟 `/create-group`（選擇服務／選擇方案／群組設定／最後確認，共 4 步）或 `/quick-match`（選擇服務／方案與條件／搜尋結果，共 3 步），分別測手機與桌機寬度，並嘗試在頁面各處滾動滑鼠滾輪

**預期結果**：
- 兩者皆為無 sidebar/dock 的全螢幕步驟流程頁，容器寬度在 `lg:` 以上用 `clamp()`（`FlowLayout` 的 `maxWidth="max-w-xl md:max-w-2xl lg:max-w-4xl"`）隨螢幕寬度連續放大（不是固定 `max-w`，避免超寬螢幕留白暴增）
- 底部固定 Prev/Next 導覽列在手機與桌機都應正確顯示，不與內容重疊
- **建立群組**：第 2 步「選擇方案」與第 3 步「群組設定」現在都已經沒有內部獨立捲動區，一律靠外層 `overflow-y-auto` 整頁捲動；第 3 步只有在 `short-lg`（桌機寬度 + 螢幕不高，且高度不低於 640px）時左右兩欄才切成並排（純 CSS flex 排版，不鎖死外層捲動），螢幕更高或更矮時都改回上下堆疊；第 2 步左右並排改用 `md:` 斷點，不受螢幕高度限制；第 4 步「最後確認」在所有寬度下都整頁捲動鎖死（`overflow-hidden`），`lg:` 以上改為左右並排、右側顯示桌機即時預覽（`LivePreviewPanel`），手機/平板則用「查看預覽」按鈕開啟置中 Modal 預覽
- `ScrollHint`（提示可再往下捲動）只在第 1 步與第 4 步顯示，第 2、3 步不顯示
- **快速搜尋**：3 步都是一般外層捲動（無 `short-lg`/`lg` 鎖死邏輯），第 2 步「方案與條件」在 `lg:` 以上會在右側額外顯示 `MatchSummaryPanel` 摘要欄；`QuickMatchPage` 額外掛載了獨立的 `GroupDetailModal`／`MessagesModal`（`lazy` + `Suspense`），確保結果卡片可以正常開啟群組詳情、詳情內「聯絡團主」也能正常開啟 DM（見 TC-202a）

---

### TC-307：卡片列表 grid 欄數

**步驟**：在 `/explore` 分別測手機、`md:`、`lg:` 寬度

**預期結果**：
- 探索頁群組卡片 grid 應隨寬度增加欄數（手機 1 欄 → 平板 2 欄 → 桌機 3 欄，實際欄數以程式碼 `grid-cols-*` class 為準，測試時核對是否符合預期而非假設固定值）
- 欄數切換時卡片內容不應被壓縮變形或文字溢出

---

### TC-308：快速搜尋結果頁卡片 hover 放大與名次徽章

**步驟**：`/quick-match` 走完搜尋，在結果頁對最左欄、最右欄、以及前三名（金/銀/銅）的卡片 hover

**預期結果**：
- 結果卡片沿用 `ExploreGroupCard`，前三名會多顯示名次徽章（`rank` prop）；徽章畫在卡片自己的 `relative` 容器內（不是跟卡片並列的外層 absolute wrapper），hover 卡片放大時徽章要跟著卡片一起縮放，不應該看起來像脫落、沒有跟著動
- 結果網格外層捲動容器要有足夠留白（`p-2`），最左欄與最右欄卡片 hover 放大時不應被容器邊緣裁切
