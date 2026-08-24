# PartyMatch

共享訂閱媒合平台，協助使用者與陌生人共同購買 Netflix、Spotify 等訂閱服務。平台整合找尋夥伴、申請審核、付款代管與續訂等流程，取代過往仰賴社群私訊與表單對帳的作法。

**Demo**：[前端](https://partymatch.ykk910309.workers.dev) ・ [後端 API](https://partymatch-api.onrender.com/api)

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| ![首頁](docs/images/screenshot-home.jpg) | ![探索群組](docs/images/screenshot-explore.jpg) | ![群組管理](docs/images/screenshot-manage-groups.jpg) | ![訊息中心](docs/images/screenshot-messages.jpg) |

## 核心功能

- **群組生命週期狀態機**：招募、額滿、填寫帳號資訊、啟用、服務中、續訂或結束，各階段可執行的操作皆由狀態決定，確保流程不會跳過必要步驟
- **PM 幣代管機制**：申請當下即先行扣款代管，資金並非直接轉入團主帳戶，須待團主啟用服務、成員完成確認後才會撥款；退出、移除、解散或申訴等情境，亦各自對應相應的退款規則
- **信用分數系統**：依使用者行為即時增減，可作為群組申請門檻
- **申訴與裁定機制**：糾紛優先由雙方自行協調，協調未果則由管理員裁定
- **敏感資料保護**：群組敏感資料（共用帳密、成員服務帳號）依角色動態遮罩，帳密另以加密方式儲存
- **訊息與通知中心**：整合群組聊天室、私訊與系統通知
- **管理員後台**：獨立的平台管理介面

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

產品設計、架構決策與各項功能流程說明，詳見 [`docs/`](docs/README.md)。

## 注意事項

儲值、付款與代管撥款目前皆為平台內部模擬邏輯，尚未串接正式金流；Google 登入與忘記密碼信件功能亦尚未實作。

## 聯絡方式

- GitHub：[@s1092055](https://github.com/s1092055)
- Email：ykk910309@gmail.com
