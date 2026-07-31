# shadcn/ui 遷移基準清單

建立時間：分支 `feature/shadcn-migration` 從 `dev` commit `2e5cee8` 切出時。
用途：階段 5、6 完成後，重新跑同一組指令比對，確認殘留數歸零。此檔案只在遷移分支上存在，合併回 `dev` 前應移除（或視情況併入正式 docs）。

## 手刻 `<button>` vs `<Button>` 元件

```
grep -rn "<button" src --include="*.jsx" | wc -l   # 158
grep -rn "<Button" src --include="*.jsx" | wc -l   # 31
```

## 使用 `.card` class 的檔案（10 個）

```
grep -rl 'className="[^"]*\bcard\b' src --include="*.jsx"
```

- src/features/account/AccountPage.jsx
- src/features/account/components/ProfileHeaderCard.jsx
- src/features/account/components/tabs/AdminTab.jsx
- src/features/account/components/tabs/PaymentMethodsTab.jsx
- src/features/explore/components/ExploreGroupCard.jsx
- src/features/home/components/ExtraFeatures.jsx
- src/features/manage-groups/components/HostedGroupCard.jsx
- src/features/match/components/MatchConditionBar.jsx
- src/features/subscriptions/SubscriptionsPage.jsx
- src/features/subscriptions/components/SubscriptionCard.jsx

## 使用 `primitives/Modal` 的檔案（17 個）

```
grep -rl "primitives/Modal" src --include="*.jsx"
```

- src/features/account/components/tabs/PaymentMethodsTab.jsx
- src/features/create/CreateGroupPage.jsx
- src/features/create/components/steps/Step1Service.jsx
- src/features/group/components/ApplyModal.jsx
- src/features/manage-groups/components/ActivateServiceModal.jsx
- src/features/manage-groups/components/HostReviewsModal.jsx
- src/features/manage-groups/components/LockGroupCredentialsModal.jsx
- src/features/manage-groups/components/RenewalModal.jsx
- src/features/manage-groups/components/ReportServiceIssueModal.jsx
- src/features/match/components/steps/Step1Services.jsx
- src/features/messages/MessagesModal.jsx
- src/features/subscriptions/components/DisputeModal.jsx
- src/features/subscriptions/components/FillServiceInfoModal.jsx
- src/features/subscriptions/components/ReviewHostModal.jsx
- src/shared/ui/CreditScoreModal.jsx
- src/shared/ui/TopupModal.jsx
- src/shared/ui/group/GroupHistoryModal.jsx

## 自刻 `createPortal`（除 Modal.jsx 外，8 個）

- src/features/home/components/DeviceShowcase.jsx
- src/shared/ui/group/GroupModalShell.jsx
- src/shared/ui/primitives/DisputeReasonDialog.jsx
- src/shared/ui/primitives/CountdownConfirmDialog.jsx
- src/shared/ui/primitives/ConfirmDialog.jsx
- src/shared/ui/primitives/ToastContainer.jsx
- src/shared/layout/components/DesktopSidebar.jsx
- src/shared/layout/FloatingMessages.jsx

## 舊 `@layer components` class（階段 6 清理對象）

`.btn-primary` `.btn-secondary` `.btn-outline` `.btn-ghost` `.btn-success` `.btn-danger` `.card` `.card-hover` `.card-lift` `.card-divider` `.panel` `.panel-soft` `.section-card` `.field` `.field-error` `.field-label` `.field-helper` `.badge` `.badge-blue/success/warning/danger/info/muted` `.icon-box` `.icon-box-blue/success/warning/danger` `.avatar` `.avatar-sm/md/lg` `.nav-item` `.nav-item-active` `.floating-action` `.overlay-backdrop` `.drawer-panel` `.search-panel` `.modal-panel` `.page-title` `.page-subtitle` `.section-title` `.section-subtitle` `.card-title` `.meta-text` `.label-text` `.link`

基準（遷移前）：全部仍在使用中，數量待階段 6 執行時逐一 grep 確認。

---

## 遷移完成後的已知例外（維持手刻實作，不強制套用 shadcn）

階段 0-7 已全數完成並合併回 `dev`。全站僅剩以下 2 處刻意維持手刻實作、不套用對應 shadcn 元件，皆已跟使用者確認過，不是遺漏：

### `src/features/explore/components/FilterSelect.jsx`

探索頁篩選列（`FilterBar.jsx`）用的下拉選單，自製 combobox，不依賴 Radix `Select`。原因：需要分組標題、鍵盤方向鍵/Home/End/Enter/Esc/Tab 完整操作、同時只能展開一個且切換時單擊立即生效等客製行為，改用 shadcn `Select` 需要大量覆蓋反而犧牲一致性。全專案只有這一個呼叫端，不存在「同類型元件風格不一致」的問題。

### `src/features/home/components/DeviceShowcase.jsx` 的 `Lightbox`

首頁截圖放大檢視用的全螢幕燈箱，自己刻 `createPortal` + Escape 監聽 + scroll lock，不透過 `Dialog`。原因（程式碼內已有註解）：`Dialog`／`DialogContent` 的內容區固定 `overflow-x-hidden` 並以視窗寬度為準把內容「縮」進去，手機上放大後會跟縮圖一樣大、失去放大意義；`Lightbox` 需要的是真正全螢幕、不限制寬度的圖片檢視器，跟 `Dialog` 本質上是不同目的的元件。

除了這兩處，元件維持單一設計規範，沒有殘留舊版 `Modal`/`CustomSelect`/`ToastContainer` 等重複實作。原本 `components/ui/`（shadcn 純元件層）與 `shared/ui/`（業務層組合元件）分成兩個資料夾，事後發現「兩個都叫 ui」在瀏覽專案時容易誤以為是重複／沒整理乾淨，已合併成單一 `src/components/ui/`（含 `primitives/` 7 個無 shadcn 對應物的專案特有元件、`group/` 群組 Modal 家族），細節見 [前端架構](../architecture/frontend-architecture.md)。
