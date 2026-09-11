# PartyMatch

[![CI](https://github.com/AndyChia0309/PartyMatch/actions/workflows/ci.yml/badge.svg)](https://github.com/AndyChia0309/PartyMatch/actions/workflows/ci.yml)

共享訂閱媒合平台，協助使用者與陌生人共同購買 Netflix、Spotify 等訂閱服務。平台整合找尋夥伴、申請審核、PM 幣代管、服務啟用、確認與續訂等流程，取代過往仰賴社群私訊與表單對帳的作法。

**Demo**：[前端](https://partymatch.ykk910309.workers.dev)

## 專案導覽

想合購 Netflix、Spotify 這類訂閱服務，過去常常得靠貼文湊團、私訊喬帳號密碼、再私下轉帳對帳，中間任何一步出狀況都很難處理。PartyMatch 把這整段過程搬上平台：從找到夥伴、審核加入，到金流代管、服務啟用與確認、續訂，每個階段都有清楚的角色分工，遇到糾紛也有申訴與裁定機制可以依循，不用再靠信任陌生人硬撐。

想快速了解這個專案，建議依序閱讀：[專案重點](docs/project/project-highlights.md) → [群組狀態機](docs/flows/group-state-machine.md) → [後端架構](docs/architecture/backend.md) → [測試計畫](docs/testing/test-plan.md)

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| ![首頁](docs/images/screenshot-home.jpg) | ![探索群組](docs/images/screenshot-explore.jpg) | ![群組管理](docs/images/screenshot-manage-groups.jpg) | ![訊息中心](docs/images/screenshot-messages.jpg) |

## 核心功能

- **群組生命週期狀態機**：招募、額滿、填寫帳號資訊、啟用、確認期、續訂或結束，各階段可執行的操作皆由狀態決定，確保流程不會跳過必要步驟
- **PM 幣代管機制**：申請當下即先行扣款代管，資金並非直接轉入團主帳戶，須待團主啟用服務、成員完成確認後才會撥款；退出、移除、解散或申訴等情境，亦各自對應相應的退款規則
- **信用分數系統**：依使用者行為即時增減，可作為群組申請門檻，並設有重新申請冷卻期
- **互評機制**：合作結束後團主與成員互相評價，評分回饋至信用分數，建立可參考的合作紀錄
- **申訴與裁定機制**：糾紛優先由雙方自行協調，協調未果則由管理員裁定
- **敏感資料保護**：群組敏感資料（共用帳密、成員服務帳號）依角色動態遮罩，帳密另以加密方式落地儲存
- **訊息與通知中心**：整合群組聊天室、私訊與系統通知，並依通知類型做提示強度分級
- **管理員後台**：獨立的平台管理介面

## 工程亮點

- **併發安全的名額搶佔**：最後一個名額同時被多筆申請核准是實際會發生的競態情境，核准流程以資料庫交易搭配條件式更新處理，確保額滿判斷不會因併發請求而超收
- **多情境退款規則**：取消申請、審核未通過、成員退出、被移除、群組解散、申訴裁定，每種情境的代管金額歸屬皆不相同，退款邏輯依情境拆分而非單一函式硬塞判斷
- **敏感資料的分層防護**：共用帳密採加密方式落地儲存；附件維持私有化讀取；所有回傳群組或成員資料的介面皆統一套用欄位遮罩機制，避免功能擴充時出現權限判斷不一致
- **高風險端點防護**：登入、換發權杖、申請／取消、檔案上傳等端點依風險掛上不同層級的速率限制，並處理反向代理環境下的來源判斷
- **通知與 Toast 分級**：依「是否牽動使用者正在看的清單畫面」將通知分為待刷新／即時兩類，並以類型＋群組做去重合併，避免背景輪詢的通知打斷使用者正在進行的操作
- **在線狀態自動偵測**：以分頁可視性＋視窗焦點判斷是否在線，搭配心跳與後端定期掃描，避免使用者非正常關閉分頁後狀態卡在「在線」不放
- **自動化測試與 CI**：前端 95 個、後端 179 個單元／整合測試，涵蓋核心頁面互動與完整群組生命週期（含真實併發衝突情境），皆整合進 GitHub Actions，push/PR 自動執行 lint、測試與建置

## 技術架構

- **前端**：React 19、Vite、React Router v7、Zustand、Tailwind CSS v4
- **後端**：Node.js、Express、Prisma、MySQL、Redis
- **基礎架構**：Cloudflare（Workers／Pages／R2）、Render

## 快速開始

環境需求：Node.js 22+、MySQL 8+、Redis 7+

```bash
# 前端
npm install
cp .env.example .env
npm run dev

# 後端
cd server
npm install
cp .env.example .env
npm run dev
```

完整環境設定、測試方式與 Demo 資料建置說明，請參閱[開發指南](docs/development.md)。

## 文件

- **Development**：[開發指南](docs/development.md) — 環境需求、環境變數、安裝、測試
- **Product**：[產品總覽](docs/product/product-overview.md) — 產品定位、解決的問題、角色設計
- **Architecture**：[架構總覽](docs/architecture/architecture.md) — 分層結構與技術棧選型理由
- **ADR**：[Architecture Decision Records](docs/adr/README.md) — 重要技術決策為什麼這樣選
- **Flows**：[群組狀態機](docs/flows/group-state-machine.md) — 一個群組會經過哪些狀態
- **Project Notes**：[專案重點](docs/project/project-highlights.md) — 主要工程決策、問題背景與取捨
- **Testing**：[手動測試計畫](docs/testing/test-plan.md) — 測試範圍、優先級分類

完整文件索引見 [`docs/README.md`](docs/README.md)。

## 注意事項

儲值、付款與代管撥款目前皆為平台內部模擬邏輯，尚未串接正式金流；Google 登入尚未串接。信件發送流程已保留可替換介面，開發環境以後端 log 輸出內容。

## 聯絡方式

- GitHub：[@AndyChia0309](https://github.com/AndyChia0309)
- Email：ykk910309@gmail.com
