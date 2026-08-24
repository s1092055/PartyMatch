# ADR-0001：用 Zustand 而不是 Redux 或純 Context 管理跨頁面狀態

**狀態**：已採用
**日期**：2025-11（專案初期建立共用基礎設施時）

## 背景

PartyMatch 有 10 個資料領域（使用者、服務、群組、申請、成員、訂閱、收藏、通知、對話、評價）需要在不同頁面、不同元件之間共享，且大多是「呼叫 API → 把回應存起來 → 多處讀取」的伺服器快取模式，不是複雜的本地互動狀態機。

## 決策

前端狀態全部用 Zustand 管理，不用 Redux，也不用純 React Context。

## 理由

- **對比 Redux**：Redux 的 action/reducer/dispatch 三層樣板碼是為了讓「狀態怎麼變化」可追蹤、可時間旅行除錯而設計的，這在複雜互動狀態機（例如編輯器 undo/redo）很有價值；但這裡的 store 大多是單純的「call API → set state」，額外樣板碼換不到對應的除錯價值。Zustand 的 `set()` 直接改 state，一個 store 檔案就能看完「有哪些欄位、怎麼變化」。
- **對比純 Context**：Context 適合作用範圍明確、變化不頻繁的狀態（主題、語系），但這裡的 store 資料是跨頁面共享、且頻繁被多個不相關元件同時讀取（例如 `groupStore` 同時被探索頁、我的訂閱、群組管理頁、通知點擊導向都要用到）。Context 沒有內建的訂閱粒度控制，任何一個值變化，所有 consume 這個 Context 的元件都會重新渲染；Zustand 的 `useXxxStore(s => s.field)` 讓元件只訂閱自己真正用到的欄位。

## 取捨

- 沒有 Redux DevTools 那種完整的時間旅行除錯能力
- 團隊擴大後，Zustand 對「誰可以改哪個 state」沒有 Redux 那麼強的架構約束，需要靠團隊慣例維持一致性

## 未來

如果之後真的出現需要跨多個 store 協調的複雜非同步流程（例如多步驟 optimistic update 需要嚴格可回溯），會重新評估是否需要更結構化的狀態管理方案。
