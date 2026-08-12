# 頁面地圖

主要路由（除 `/`、`/quick-match`、`/create-group` 外皆掛在共用 `AppLayout` 之下，共用 sidebar／底部 Dock 導覽）：

| 路由 | 用途 |
|------|------|
| `/` | 行銷首頁，含「探索群組」CTA、功能介紹、FAQ |
| `/login`／`/register`／`/forgot-password` | 登入、註冊、忘記密碼 |
| `/explore` | 探索所有群組：分類篩選、關鍵字搜尋、排序 |
| `/groups/:groupId` | 導向探索頁並開啟指定群組詳情，供分享連結 |
| `/disclaimer`／`/terms`／`/privacy` | 法律文件頁 |
| `/my-subscriptions` | 「我的訂閱」，成員視角管理已加入群組 |
| `/manage-groups` | 「群組管理」，團主視角管理自己建立的群組 |
| `/favorites` | 已收藏群組列表 |
| `/account` | 帳號中心：個人資料、PM 幣、隱私與偏好設定 |
| `/quick-match` | 免登入快速配對流程：輸入條件 → 查看推薦群組 |
| `/create-group` | 4 步驟建立群組表單 |
| `/admin` | 管理員後台（獨立 layout，需管理員權限）：平台概覽數據、系統訊息、申訴裁定 |

此外，群組詳情、群組管理、聊天室、儲值、通知等功能以全域 Modal／面板形式疊加在既有頁面上，沒有獨立網址。
