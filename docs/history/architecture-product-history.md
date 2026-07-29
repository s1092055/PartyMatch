# Architecture / Product 演變記錄

## frontend-architecture.md：主導覽切換點從 `md:` 改成 `lg:`

`AppNav.jsx` 桌機版 sidebar／手機版 header+dock 的切換原本用 `md:`（768px），跟 `@theme` 裡其他版面排列（grid 欄數、篩選列橫排）共用同一個斷點。但桌機 sidebar 靠 `:hover`／`:focus-within` 展開才看得到文字標籤，iPad（直向 768px+、橫向 1024px+）雖然寬度落在 `md` 區間，卻是觸控裝置沒有真正的 hover，結果側邊欄卡在收合狀態、使用者只看得到圖示看不到任何文字——是實際使用 iPad Pro 13" Safari 時發現的問題。修正為裝置類型切換一律改用 `lg:`（1280px），iPad 統一改用手機版的點擊式 header/dock（本來就不依賴 hover）；純內容排版（grid 欄數等）不受影響，仍可以繼續用 `md:`。同一批修正也把 Modal／版面高度計算裡裸的 `vh` 單位全部換成 `dvh`（`GroupModalShell.jsx`、`Modal.jsx`、`TopupModal.jsx`、`CreditScoreModal.jsx`、`HostReviewsModal.jsx`、`MessagesModal.jsx`、`AccountPage.jsx`、`AuthLayout.jsx`、`ManageGroupsPage.jsx`、`SubscriptionsPage.jsx`）——iOS Safari 的 `vh` 是抓工具列收合後的最大可視高度去計算，分頁列/網址列展開時會跟實際可視範圍對不上，讓固定高度的 Modal 在 iPad Safari 上顯得過高、貼著畫面邊緣，`dvh` 會隨目前實際可視高度即時更新。

## frontend-architecture.md：按鈕互動回饋從「點擊縮小」改成「hover 上浮」

全站按鈕原本零星有 `active:scale-[0.96]`（點擊縮小）效果，但沒有統一套用；後來改成移除點擊縮小，改為 hover 時輕微上浮（`hover:-translate-y-0.5`），並統一套用到全站真正的動作按鈕（送出/確認/取消/導覽連結等），小型純圖示工具鈕（Modal 關閉、輪播翻頁箭頭）維持原樣不加位移，避免密集排列的小圖示鈕一起跳動。共用的 `Button.jsx` primitive 也一併加上這個效果，讓套用它的元件自動繼承。

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
