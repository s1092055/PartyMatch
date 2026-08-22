# ADR-0005：用 `prisma db push` 而不是正式 migration 檔案

**狀態**：已採用
**日期**：2025-11（專案初期建立資料庫層時）

## 背景

Prisma 提供兩種讓 `schema.prisma` 的異動同步到資料庫的方式：`prisma migrate`（產生一份份可追溯、可在多環境重放的 migration SQL 檔案）與 `prisma db push`（直接依現在的 schema 定義把資料庫結構改成一致，不留下歷史紀錄）。

## 決策

本專案不使用 migration 檔案，schema 異動一律用 `npx prisma db push` 直接同步。

## 理由

- 這是單人開發的 MVP 專案，schema 在功能開發過程中頻繁調整，migration 檔案的價值（多人協作時避免 schema 衝突、正式環境可控的漸進式升級、可回溯的變更歷史）在目前階段還不需要
- 開發環境資料庫可以隨時 `db:clear` + 重新 seed，不需要保留新舊 schema 之間的漸進遷移路徑
- 省去每次改 schema 都要額外產生、檢查、commit migration 檔案的步驟，開發迭代速度更快

## 取捨

- 沒有可回溯的 schema 變更歷史，出問題時無法用 migration 檔案重建「資料庫在某個時間點的結構長什麼樣子」
- 正式環境資料庫的結構完全依賴「跑一次 `db push`」，沒有像 migration 那樣的漸進式、可控的升級流程；如果正式環境已經有真實使用者資料，`db push` 在某些破壞性 schema 變更（例如砍欄位、改型別）下有資料遺失風險
- 多人協作時，不同開發者各自的 schema 異動沒有明確的先後順序記錄，容易互相覆蓋

## 未來

一旦正式環境累積了真實使用者資料、或有多人同時開發 schema，會改用 `prisma migrate` 建立正式的 migration 流程，並補上第一份 baseline migration。
