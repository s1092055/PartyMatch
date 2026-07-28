# Testing 演變記錄

## host-flow-test-cases.md：鎖定群組後團主端分頁改版

TC-207（鎖定群組）UI 上原本「申請管理」分頁改為「收款管理」+「續訂管理」（僅 `active` 顯示）+「群組訊息」。

## member-flow-test-cases.md：會員視角分頁改版

分類分頁原本把 `full`/`pending_confirmation`/`pending_activation`/`confirming`/`disputed` 全部混在同一個「處理中」分頁裡，後來改為 `FILTER_TABS` 讓每個分頁對應單一狀態。

## member-flow-test-cases.md：狀態 badge 文案演變

`active` 狀態 badge 原顯示「啟用中」，後改為「服務中」；`pending_confirmation` 狀態 badge 文案歷經「待填帳號」→「填寫資訊中」→現在的「成員填寫中」。
