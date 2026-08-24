# PartyMatch

## 專案介紹

PartyMatch 是一個共享訂閱媒合平台，讓使用者可以探索或建立 Netflix、Spotify、YouTube Premium、Disney+ 等共享訂閱群組，從找夥伴、申請審核、付款代管到續訂都在同一個平台完成。

完整的產品定位、解決的問題與功能說明見下方[技術文件](#技術文件)。

### 核心功能

- **狀態機驅動的群組生命週期**：招募中 → 額滿 → 填寫資訊 → 啟用 → 服務中 → 續訂／結束，每個階段的可執行動作與 UI 都由狀態機決定
- **PM幣代管系統**：申請當下就先扣款代管，團主啟用服務後才撥款，退出/移除/解散/申訴都有對應的退款規則
- **信用分數系統**：成員確認服務、團主啟用服務、被移除出群組都會即時增減分數並留下紀錄；逾期未完成帳號資訊填寫的成員會被系統自動移出並退款，同時扣分、24 小時內無法重新申請同一群組，避免惡意拖延流程；群組也可設定申請門檻分數
- **28 種訂閱服務、6 種真實共享機制**：依服務動態顯示要填寫的帳號資訊欄位（Apple/Google 家庭群組、Email 邀請、Email 邀請+地址、邀請碼、共用帳密）
- **申訴與裁定機制**：成員與團主之間的糾紛可送出申訴，雙方能自行協調解決；協調不成才由管理員身分裁定退款或維持原狀
- **訊息與通知系統**：群組聊天室、私訊、系統通知整合在同一個訊息中心，用 polling 取代即時連線降低架構複雜度；聊天室與帳號資訊留言區皆支援圖片附件；所有業務通知一律由後端在對應動作的同一個請求內建立，不依賴前端事後補寫，避免使用者提早關閉分頁導致通知遺失；訊息與通知列表皆支援搜尋、多條件篩選（顯示範圍/身分/群組狀態/排序、只顯示未讀）
- **管理員後台**：`isAdmin` 帳號登入後直接進入獨立的 `/admin` Dashboard（不共用一般使用者的探索/建立群組 nav），可查看平台概覽數據（使用者/群組/代管金額/待裁定申訴等統計）、裁定申訴、發送全平台系統公告、依 email 查詢使用者並單發系統訊息
- **敏感資料保護**：群組敏感欄位（團主提供的共用帳密、成員填寫的服務帳號資訊）依角色（團主/成員/非參與者）動態遮罩，不會回傳給無關使用者；共用帳密在資料庫內另以 AES-256-GCM 加密儲存，避免資料庫外洩直接洩漏明文帳密；申訴/回報問題/聊天室附件改為私有儲存，資料庫只存物件識別碼，讀取時才即時簽發短效網址，避免網址外流變成永久可公開存取的連結；登入、註冊、附件上傳等端點皆加上流量限制，防止暴力破解密碼或濫用儲存空間

---

## 線上 Demo

- 前端：https://partymatch.ykk910309.workers.dev
- 後端 API：https://partymatch-api.onrender.com/api

---

## 畫面展示

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| ![首頁](docs/images/screenshot-home.jpg) | ![探索群組](docs/images/screenshot-explore.jpg) | ![群組管理](docs/images/screenshot-manage-groups.jpg) | ![訊息中心](docs/images/screenshot-messages.jpg) |

---

## 技術內容

| 類別 | 技術 |
|------|------|
| Frontend | React 19、Vite、React Router v7、Zustand |
| UI | Tailwind CSS v4（token 定義於 `index.css`）、shadcn/ui、Radix UI、class-variance-authority、lucide-react |
| 深色模式 | 預設跟隨系統 `prefers-color-scheme`，登入後點側邊欄/導覽選單使用者選單裡的「偏好設定」手動切換並記住選擇（`localStorage`），只翻轉中性色階與淺底 chip 色以確保可讀性，見[前端架構](docs/architecture/frontend-architecture.md) |
| Backend | Node.js、Express |
| 資料庫 | MySQL + Prisma ORM |
| 快取 | Redis |
| 認證 | JWT（accessToken 存 `localStorage`，refreshToken 存 HttpOnly Cookie）；正式環境前後端透過 Cloudflare Worker 反向代理變成同一個 origin，Cookie 不需處理跨網域相容性問題 |
| 圖片上傳 | Cloudflare R2（後端代理上傳，前端不需另外設定 API Key） |
| 匯率查詢 | 美金計價的訂閱方案改用即時匯率換算台幣顯示金額（非寫死換算），詳見[服務定價查證紀錄](docs/product/service-pricing-audit.md) |
| Architecture | Feature-based、Store + API 雙層分離、事件驅動跨元件通訊 |

---

## 技術文件

完整技術文件在 [`docs/`](docs/README.md)，依 Product／Flows／Architecture 分類。建議先看這幾篇：

1. **先懂產品在做什麼** → [產品總覽](docs/product/product-overview.md)
2. **再懂整體是怎麼組出來的** → [架構總覽](docs/architecture/architecture.md)
3. **想知道某個功能實際怎麼運作** → [使用者流程總覽](docs/flows/user-flows.md)

---

## 注意事項

儲值、付款、代管撥款等流程皆為模擬邏輯，未串接正式金流。正式環境所需的 API key、JWT secret、資料庫連線資訊與第三方服務設定皆未包含於此 repository。

目前刻意未實作的部分：Google 登入、忘記密碼寄信、帳號中心的「通知偏好」「安全驗證」皆尚未串接後端，畫面上不會露出這些入口（而非顯示 disabled 按鈕或開發中佔位），避免半成品入口影響展示觀感。

---

## 聯絡我

- GitHub: [@s1092055](https://github.com/s1092055)
- Email: ykk910309@gmail.com
