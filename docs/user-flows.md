# 操作流程

## 群組狀態機

```mermaid
stateDiagram-v2
  [*] --> recruiting : 團主建立群組
  recruiting --> full : 名額額滿（最後申請核准）
  full --> pending_confirmation : 團主鎖定群組
  pending_confirmation --> pending_activation : 全員填寫帳號資訊完成
  pending_activation --> confirming : 團主啟用服務（48h 確認期開始）
  confirming --> active : 成員主動確認 / 逾期未操作（自動撥款）
  confirming --> disputed : 成員向平台正式申訴
  disputed --> active : 平台客服裁定後（撥款或退款）→ 群組回 active
  active --> pending_confirmation : 團主開始新一期
  active --> ended : 團主結束群組
  recruiting --> cancelled : 團主解散群組（啟用前）
  full --> cancelled : 團主解散群組（啟用前）
  pending_confirmation --> cancelled : 團主解散群組（啟用前）
  pending_activation --> cancelled : 團主解散群組（啟用前）
```

| 狀態 | 說明 | 推進條件 |
|------|------|----------|
| `recruiting` | 公開招募中，接受申請 | 最後一個申請被核准且名額額滿 → 系統自動推進至 `full` |
| `full` | 名額額滿，等待團主鎖定群組；成員仍可退出或被移除（釋出名額，退回 `recruiting`） | 團主點「鎖定群組」 |
| `pending_confirmation` | 成員填寫訂閱帳號資訊；**付款已在核准時代管完成，本階段無付款操作**；成員名單不可再變動 | 全員填寫完成後自動推進 |
| `pending_activation` | 帳號資訊齊全，等待團主啟用服務；成員名單不可再變動 | 團主點「啟用服務」 |
| `confirming` | 服務啟用後最長 48 小時確認期；成員可主動確認、向團主反應或向平台申訴；逾期未操作則自動撥款 | 成員主動確認（即時結束）或逾期未操作（惰性求值）|
| `disputed` | 成員向平台正式申訴；代管金額凍結，客服 3 天內裁定；裁定只影響申訴的那位成員 | 平台客服手動推進 |
| `active` | 服務運作中；成員名單不可再變動 | 團主開始新一期或結束群組 |
| `cancelled` | 團主在服務啟用前解散群組；所有代管金額退還成員代幣餘額 | — |
| `ended` | 服務到期後團主正常結束群組 | — |

---

## 成員端

### 1-A 探索與申請加入

```mermaid
flowchart TD
  A[瀏覽探索頁 / 快速配對結果] --> B[打開群組詳情]
  B --> C{是否申請}
  C -->|否| A
  C -->|是| D{是否已登入}
  D -->|否| D1[前往登入或註冊]
  D -->|是| E{系統檢查代幣餘額 ≥ 席位費用}
  E -->|餘額不足| E1[提示前往帳戶儲值]
  E -->|餘額充足| F[在 subPanel 填寫申請留言並勾選同意]
  F --> G[送出申請]
  G --> H[等待團主審核]
  H -->|主動取消| H0[在群組詳情點「取消申請」並確認\n申請狀態設為 withdrawn\n可重新申請同一群組]
  H -->|被拒絕| H1[收到通知，可重新申請（建立新記錄）]
  H -->|被核准| I[收到通知\n代幣餘額扣除席位費用進入代管\n付款至此完成，後續不需任何付款操作]
```

### 1-B 等待啟用期間（`recruiting` → `full` → `pending_confirmation`）

```mermaid
flowchart TD
  A[申請核准，群組狀態 recruiting] --> B{是否退出群組}
  B -->|退出| C[點擊退出並確認]
  C --> D[代管費用退還至代幣餘額\nmember + subscription 刪除\napplication 標為 left\n名額釋出，通知團主]
  D --> E[可重新申請同一群組]
  B -->|繼續等待| F{群組名額是否額滿}
  F -->|尚未額滿| B
  F -->|額滿，群組進入 full| G{是否退出群組}
  G -->|退出| C
  G -->|繼續等待| H[等待團主鎖定群組]
  H --> I[團主鎖定後，收到群組聊天室已開啟通知]
  I --> J[群組進入 pending_confirmation，可開始填寫帳號資訊]
```

### 1-C 填寫訂閱帳號資訊（`pending_confirmation`）

```mermaid
flowchart TD
  A[在我的訂閱開啟群組] --> B[填寫訂閱帳號資訊（email 等）]
  B --> C{全員是否都已填寫}
  C -->|尚未全員| B
  C -->|完成| D[系統自動推進至 pending_activation\n等待團主啟用服務]
```

### 1-D 確認期（`confirming`）

```mermaid
flowchart TD
  A[收到服務已啟用通知，48h 確認期開始] --> B{48h 內操作}
  B -->|主動確認服務正常| C[確認期立即結束\n代管金額即時撥款給團主\n收到確認完成通知]
  B -->|向團主反應問題| D[透過群組聊天室溝通\n狀態維持 confirming，倒數繼續]
  B -->|向平台正式申訴| E[進入爭議申訴流程 → 見 1-E]
  B -->|逾期未操作| F[代管金額自動撥款給團主\n收到確認期已結束通知]
  C --> G[訂閱移至已啟用]
  F --> G
```

### 1-E 爭議申訴（`disputed`）

```mermaid
flowchart TD
  A[在確認期內點擊向平台申訴] --> B[填寫申訴原因並上傳截圖佐證]
  B --> C[群組進入 disputed，代管金額凍結\ndisputeDeadline = 申訴提出時間 + 3 天]
  C --> D[等待平台客服在 3 天內裁定]
  D -->|成員獲勝| E[代幣退還至成員餘額\n成員離開群組\n群組回 active（其餘成員不受影響）]
  D -->|團主獲勝| F[代管金額撥款給團主\n群組回 active]
  E --> G[收到裁定結果通知（附說明）]
  F --> G
```

---

## 團主端

### 2-A 建立群組

```mermaid
flowchart TD
  A[點擊建立群組] --> B[選擇服務與方案]
  B --> C[設定名額、規則、加入條件]
  C --> D[確認建立 → 群組狀態 recruiting]
```

### 2-B 審核申請（`recruiting`）

```mermaid
flowchart TD
  A[收到新申請通知] --> B[查看申請者資料]
  B --> C{核准或拒絕}
  C -->|拒絕| D[通知申請者；申請者可重新申請]
  C -->|核准| E[系統自動扣除申請者代幣進入代管\n建立 member + subscription，名額 -1]
  E --> F{需要移除已核准成員}
  F -->|是（recruiting / full 期間）| G[在成員名單點移除並確認]
  G --> H[代管費用退還成員\nmember + subscription 刪除\napplication 標為 removed\n名額釋出，通知被移除成員]
  F -->|否| I{名額是否額滿}
  I -->|否| A
  I -->|是| J[系統自動推進至 full]
```

### 2-C 鎖定群組（`full` → `pending_confirmation`）

```mermaid
flowchart TD
  A[GroupViewModal 出現鎖定群組按鈕] --> B[點擊鎖定群組]
  B --> C[系統設定各成員訂閱的下次扣款日\n建立群組聊天室\n推進至 pending_confirmation\n通知所有成員填寫帳號資訊]
  C --> D[等待全員填寫訂閱帳號資訊]
  D --> E[全員完成 → 系統自動推進至 pending_activation\n啟用服務按鈕出現]
```

### 2-D 啟用服務（`pending_activation` → `confirming`）

```mermaid
flowchart TD
  A[點擊啟用服務] --> C[群組進入 confirming\nconfirmDeadline = 啟用時間 + 48h\n通知所有成員服務已啟用]
  C --> D{48h 確認期結果}
  D -->|無申訴（主動確認或逾期）| E[代管金額撥款至團主代幣餘額\n群組回 active]
  D -->|有成員向平台申訴| F[群組進入 disputed，等待客服裁定]
  F -->|客服裁定：團主獲勝| E
  F -->|客服裁定：成員獲勝| G[退款給該成員，成員離開\n群組回 active（其餘成員不受影響）]
```

### 2-E 解散群組（啟用前）

```mermaid
flowchart TD
  A[群組狀態為 recruiting / full / pending_confirmation / pending_activation] --> B[點擊解散群組並確認]
  B --> C[所有代管金額退還各成員代幣餘額\n群組狀態 cancelled\n通知所有成員]
```

### 2-F 到期後（`active`）

```mermaid
flowchart TD
  A[服務到期] --> B{選擇}
  B -->|開始新一期| C[群組回到 pending_confirmation\n通知成員重新填寫帳號資訊]
  B -->|結束群組| D[群組狀態 ended]
```

---

## 平台端：爭議裁定

```mermaid
flowchart TD
  A[收到成員申訴\ndisputeDeadline = 申訴提出時間 + 3 天] --> B[審查申訴內容與佐證截圖]
  B --> C[在 disputeDeadline 前作出裁定並附上說明]
  C -->|成員獲勝（服務未正常啟用）| D[退款給申訴成員\n成員離開群組\n群組回 active]
  C -->|團主獲勝（服務已正常啟用）| E[代管金額撥款給團主\n群組回 active]
  D --> F[通知雙方裁定結果]
  E --> F
```

---

## 代幣與帳戶管理

```mermaid
flowchart TD
  A[進入帳號中心] --> B[點擊儲值]
  B --> C[選擇儲值金額]
  C --> D[模擬確認 → 餘額增加\n寫入 token_transaction: topup]
  D --> E[顯示最新餘額]
```

| 時機 | 代幣異動 | 類型 |
|------|----------|------|
| 儲值 | `user.tokenBalance` += 金額 | `topup` |
| 申請核准 | `user.tokenBalance` -= 席位費用；`group.escrowTokens` += 費用 | `escrow` |
| 確認期結束（無爭議） | `group.escrowTokens` → `host.tokenBalance` | `release` |
| 成員退出 / 被移除 | `group.escrowTokens` → `user.tokenBalance`（退還） | `refund` |
| 團主解散群組（`cancelled`） | 所有成員 `group.escrowTokens` → 各 `user.tokenBalance`（退還） | `refund` |
| 爭議申訴：成員獲勝 | `group.escrowTokens` → `user.tokenBalance`（退還） | `refund` |
| 爭議申訴：團主獲勝 | `group.escrowTokens` → `host.tokenBalance` | `release` |

- 申請時只做餘額**檢查**，不預扣；核准後才扣除並進入代管。
- 所有代幣異動均記錄至 `token_transactions`，提供完整審計軌跡。
- 現階段儲值為模擬模式（點擊即儲值），正式金流為未來擴充項目。

---

## 訊息與通知

```mermaid
flowchart TD
  A{使用者狀態} -->|訪客| B[通知中心只顯示系統公告]
  A -->|會員| C[通知中心顯示個人通知與未讀數]
  C --> D[代幣帳務、申請、系統三個分頁]
  A -->|會員| E[訊息中心可開啟]
  A -->|訪客| F[訊息中心鎖定並提示登入]
  E --> G{對話類型}
  G -->|群組| H[團主鎖定群組時建立 conversation]
  G -->|私訊| I[聯絡團主時建立或取得 DM]
  H --> J[成員收到群組聊天室已開啟通知]
  I --> K[REST polling 每 5 秒同步 messages]
  H --> K
  K --> L[未讀數回寫 unreadCounts]
```

1. 訪客可打開通知中心，但只看到系統公告；個人通知需登入。
2. 通知依類型分為代幣帳務、申請、系統三頁，可標記已讀。
3. 群組聊天室在團主點「鎖定群組」後建立；成員收到通知。
4. 訊息透過 REST API polling（每 5 秒）同步；成員加入或退出時寫入系統訊息。
