# 資料庫 Schema 與狀態流程

資料庫使用 **MySQL 8**，以 **Prisma ORM** 管理 schema。

## 核心領域 ERD

只畫交易流程真正會用到的 7 張表；`Notification`／`Favorite`／`Conversation`／`Message`／`Review`／`CredentialComment`／`CreditScoreLog` 等次要表未列入（各自只跟 `User`／`Group` 有一對多關聯，不影響核心交易邏輯）。

```mermaid
erDiagram
  USER ||--o{ GROUP : hosts
  USER ||--o{ APPLICATION : submits
  USER ||--o{ MEMBER : "is member as"
  USER ||--o{ SUBSCRIPTION : has
  USER ||--o{ TOKEN_TRANSACTION : owns
  SERVICE ||--o{ GROUP : "offered as"
  GROUP ||--o{ APPLICATION : receives
  GROUP ||--o{ MEMBER : contains
  GROUP ||--o{ SUBSCRIPTION : has
  GROUP ||--o{ TOKEN_TRANSACTION : "relates to"

  USER {
    string id PK
    string email UK
    string name
    int creditScore
    int tokenBalance
    boolean isAdmin
  }
  SERVICE {
    string id PK
    string name
    string category
    json plans
  }
  GROUP {
    string id PK
    string hostId FK
    string serviceId FK
    string planId
    enum status
    int maxMembers
    int currentMembers
    decimal monthlyFee
    int escrowTokens
    string sharedCredentials "AES-256-GCM 加密"
  }
  APPLICATION {
    string id PK
    string groupId FK
    string userId FK
    enum status
    int escrowAmount
  }
  MEMBER {
    string id PK
    string groupId FK
    string userId FK
    json serviceInfo
    datetime confirmedAt
  }
  SUBSCRIPTION {
    string id PK
    string groupId FK
    string userId FK
    enum status
    datetime nextBillingDate
  }
  TOKEN_TRANSACTION {
    string id PK
    string userId FK
    string relatedGroupId FK
    enum type
    int amount
  }
```

`Group.status` 即群組狀態機（見下方「群組狀態機」）；`escrowTokens` 是目前代管在群組裡、尚未撥款的 PM 幣總額，跟 `TokenTransaction` 的逐筆流水互為對帳依據。

## 主要資料模型

- **User**：帳號、個人資料、信用分數、平台PM幣餘額、隱私與線上狀態設定
- **Service**：訂閱服務目錄與方案
- **Group**：群組主資料，含狀態機、名額、代管金額等欄位
- **Application**：加入群組的申請紀錄
- **Member**：群組成員與其服務帳號資訊
- **Subscription**：成員的訂閱狀態與扣款週期
- **TokenTransaction**：PM幣交易審計日誌
- **Notification**：個人通知與系統公告
- **Favorite**：收藏群組
- **Conversation / Message**：群組聊天室、私訊與系統訊息
- **Review**：團主整體評價
- **CredentialComment**：帳號資訊分頁的留言

## 隱私設計

使用者可關閉「顯示大頭照」，後端在把使用者資料回傳給「別人」看時會遮罩對應欄位，本人查看自己的資料不受影響。

## 群組狀態機

`recruiting`（招募中）→ `full`（滿額）→ `pending_confirmation`（填寫帳號資訊）→ `pending_activation`（待啟用）→ `confirming`（確認期）→ `active`（服務中）。`recruiting`／`full` 可轉往 `cancelled`；`confirming` 可轉往 `disputed`（申訴，可由團主與成員自行協調解決，或由平台管理員裁定，兩者皆回到 `active`／`confirming`）；`active` 可轉往續訂或 `ended`。

## PM幣與代管機制

平台使用內部PM幣（1:1 對應台幣）作為交易媒介，所有金流在平台內部流轉，不涉及外部金流。申請加入群組時即代管扣款，團主接受申請不重複扣款；拒絕/取消/移除則退款。服務啟用後進入確認期，成員確認或期限到期後撥款給團主；成員如有爭議可申訴，由平台裁定。續訂會重新走一輪代管與確認流程。目前儲值為模擬模式，尚未串接真實金流。

## 已知限制

- Google OAuth、忘記密碼寄信尚未實作（前端入口已預留但功能未開放）
- PM幣儲值為模擬模式
- 確認期自動撥款採惰性求值，非排程任務
- 訊息中心採用短週期 polling，非即時推送
- 有一個獨立於一般導覽之外的管理員後台，提供平台總覽統計、系統公告/私訊發送、申訴裁定
