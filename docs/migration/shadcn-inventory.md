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
