# Architecture / Product 演變記錄

## backend-architecture.md：`applications.js` PATCH /:id 狀態轉換與退款的耦合 bug

早期版本曾經把狀態寫入（`status`/`activeKey`）也綁進「僅 `status: 'pending'` 才算數」的條件式 `updateMany` 裡，導致跟團主移除已接受成員（該申請當下狀態是 `approved` 不是 `pending`）撞在一起時，狀態被誤判成不用處理而卡住。已修正為狀態轉換與退款是兩個各自獨立判斷的步驟：狀態轉換不論退款與否都無條件寫入，退款則另外用條件式 `updateMany` 決定要不要呼叫 `refundEscrow`。

## page-map.md：信用分數入口位置

「查看信用分數與計分規則」功能的入口原本在側邊欄，後來搬到帳號中心（`AccountPage.jsx` Hero 區塊）。

## service-info-requirements.md：填寫服務帳號表單的欄位設計調查動機

`MemberGroupView` 的「填寫服務帳號」表單原本不分服務種類，一律只收一個 `email` 欄位（`server/src/routes/members.js` 的 `PATCH /members/:id`，寫入 `Member.serviceInfo`）。但實際上平台目錄裡 28 種服務的真實共享機制差異很大，有些只要 email 就能讓團主邀請加入，有些需要額外資訊（地址、邀請碼），有些官方根本沒有多人邀請功能、只能共用帳號密碼。為此進行了一次逐服務調查（查證日期：2026-07-21），記錄每個服務真實的共享機制與應該收集的欄位，並依調查結果把表單改成依服務動態顯示欄位。

## service-info-requirements.md：欄位設定實作的前後對比

- `src/shared/utils/serviceInfoFields.js` 的 `hasFilledServiceInfo(serviceInfo, sharingMethod)` 取代了原本寫死的 `!!serviceInfo?.email` 判斷。
- `MemberGroupView.jsx` 的「填寫服務帳號」表單改成讀 `sharingMethodConfig.fields` 動態渲染欄位（KKBOX 會多一個地址欄位、friDay影音欄位換成邀請碼、組 F 服務則是一個確認勾選框），不再寫死單一 email input。
- 所有原本檢查 `.serviceInfo?.email` 的地方（`MessageBubble.jsx`、`ActivateServiceModal.jsx`、`ReportServiceIssueModal.jsx`、`GroupDetailModal.jsx`）都已改用 `hasFilledServiceInfo`/`getServiceInfoSummary`，不會再對非 email 欄位的服務誤判「尚未填寫」。
