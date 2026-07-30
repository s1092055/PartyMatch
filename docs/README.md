# 技術文件索引

### Product — 這個專案在做什麼

- [產品總覽](product/product-overview.md) — 產品定位、解決的問題、角色設計、MVP 範圍
- [頁面地圖](product/page-map.md) — 每個網址對應到哪個畫面
- [功能地圖](product/feature-map.md) — 目前做了哪些功能的完整清單
- [服務定價查核紀錄](product/service-pricing-audit.md) — 平台內 28 種訂閱服務的價格怎麼查到的、哪些還沒驗證過
- [各服務填寫帳號資訊需求調查](product/service-info-requirements.md) — 28 種服務真實的共享機制分類（Apple/Google 家庭群組、email 邀請、邀請碼、共用帳密），現有表單只收 email 的落差在哪

### Flows — 各個功能實際怎麼運作

- [使用者流程總覽](flows/user-flows.md) — 完整使用流程與群組狀態機，看這篇最快抓到全貌
- [群組狀態機](flows/group-state-machine.md) — 一個群組會經過哪些狀態（招募中 → 額滿 → 啟用 → 結束…）
- [探索群組流程](flows/explore-flow.md)
- [快速搜尋流程](flows/quick-match-flow.md)
- [建立群組流程](flows/create-group-flow.md)
- [申請加入流程](flows/apply-join-flow.md)
- [團主審核流程](flows/approval-flow.md)
- [PM幣代管與付款流程](flows/payment-token-flow.md) — 平台內部貨幣「PM幣」怎麼儲值、代管、撥款、退款
- [我的訂閱（成員視角）流程](flows/subscriptions-flow.md)
- [群組管理（團主視角）流程](flows/manage-groups-flow.md)
- [續訂流程](flows/renewal-flow.md)
- [申訴流程](flows/dispute-flow.md)
- [訊息流程](flows/messages-flow.md)
- [通知流程](flows/notification-flow.md)

### Testing — 手動測試怎麼跑

- [手動測試計畫](testing/manual-test-plan.md) — 測試範圍、優先級分類、建議測試順序，從這篇開始
- [測試帳號清單](testing/test-accounts.md) — demo 帳號/群組怎麼建立、每個帳號適合測什麼情境
- [核心主線測試案例](testing/core-flow-test-cases.md) — 建立群組 → 申請 → 審核 → 鎖定 → 填資訊 → 啟用 → 確認
- [團主視角測試案例](testing/host-flow-test-cases.md)
- [成員視角測試案例](testing/member-flow-test-cases.md)
- [訊息與通知測試案例](testing/messaging-notification-test-cases.md)
- [探索頁／快速搜尋／收藏／帳號中心測試案例](testing/explore-account-test-cases.md)
- [RWD 測試案例](testing/rwd-test-cases.md) — 手機/平板/桌機版面
- [Bug 紀錄](testing/bug-log.md) — 手動測試過程中發現並修復的問題

### Architecture — 程式碼是怎麼寫、怎麼組織的

- [架構總覽](architecture/architecture.md) — 先看這篇，分層結構與技術棧選型理由
- [前端架構](architecture/frontend-architecture.md) — React 這邊的程式碼怎麼分資料夾、怎麼管理畫面上的資料
- [後端架構](architecture/backend-architecture.md) — Express 這邊的 API 怎麼寫、怎麼保護資料安全
- [資料庫 Schema](architecture/database-schema.md) — 資料庫存了哪些表、彼此關係
- [API 總覽](architecture/api-overview.md) — 每一支後端網址在做什麼、需不需要登入
- [認證機制](architecture/authentication.md) — 使用者怎麼登入、系統怎麼記得你是誰
- [命名慣例](architecture/naming-conventions.md) — 檔案跟變數的命名規則
