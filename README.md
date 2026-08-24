# PartyMatch

共享訂閱媒合平台，讓使用者安心跟陌生人合購 Netflix、Spotify 等訂閱服務——找夥伴、審核、付款代管、續訂都在同一個平台完成，不用再靠社團私訊跟 Google 表單對帳。

**Demo**：[前端](https://partymatch.ykk910309.workers.dev) ・ [後端 API](https://partymatch-api.onrender.com/api)

| 首頁 | 探索群組 | 群組管理 | 訊息中心 |
|------|----------|----------|----------|
| ![首頁](docs/images/screenshot-home.jpg) | ![探索群組](docs/images/screenshot-explore.jpg) | ![群組管理](docs/images/screenshot-manage-groups.jpg) | ![訊息中心](docs/images/screenshot-messages.jpg) |

## 核心功能

群組有完整的**狀態機**：招募 → 額滿 → 填寫帳號資訊 → 啟用 → 服務中 → 續訂／結束，每個階段能做什麼都由狀態決定，不會跳步驟。

錢的部分用 **PM 幣代管**處理：申請當下就先扣款代管，不是直接進團主口袋，等團主啟用服務、成員確認後才撥款；退出、移除、解散、申訴都各自對應退款規則。

其他重點：

- **信用分數**依行為即時增減，可作群組申請門檻
- **申訴機制**，糾紛先自行協調，協調不成由管理員裁定
- 群組敏感資料（共用帳密、成員服務帳號）依角色動態遮罩，帳密另外加密落地儲存
- 訊息中心整合群組聊天室、私訊、系統通知
- 獨立的管理員後台

## 技術棧

- **Frontend** React 19、Vite、React Router v7、Zustand、Tailwind CSS v4
- **Backend** Node.js、Express、Prisma、MySQL、Redis
- **Infra** Cloudflare（Workers／Pages／R2）、Render

## 文件

產品設計、架構決策、各功能流程說明都在 [`docs/`](docs/README.md)。

## 注意事項

儲值、付款、代管撥款皆為平台內模擬邏輯，未接正式金流；Google 登入、忘記密碼寄信尚未實作。

## 聯絡我

- GitHub: [@s1092055](https://github.com/s1092055)
- Email: ykk910309@gmail.com
