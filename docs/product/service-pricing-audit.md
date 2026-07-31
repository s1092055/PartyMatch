# 服務定價查證紀錄

本文件記錄 PartyMatch 目錄中每個服務、每個方案目前使用的價格，以及查證時參考的官方來源網址，供之後複查或調整金額時使用。查證日期：2026-07-28。

> 部分官網頁面為動態載入或會擋掉自動化查詢（回傳 403 / 404），這類項目仍列出正確的官方網址，但標註「⚠️ 官網無法直接擷取內容，數字為多方交叉確認」，建議直接用瀏覽器登入該頁面再次核對。

> **年繳總價的計算原則**：`serviceCatalog.js` 內每個年繳方案優先顯示官方公告的真實年繳總價（`yearlyPrice` 欄位），而不是用月費 ×12 反推估算。已確認官方台幣年繳總價的方案（Disney+、HBO Max、Microsoft 365、Nintendo Switch Online）都已補上 `yearlyPrice`；美金計價的方案（Discord Nitro、Midjourney）改用 `yearlyPriceUsd` + 即時匯率換算（見 `src/common/utils/exchangeRate.js`），畫面上顯示的台幣金額會隨匯率浮動，不是寫死的固定數字，之後美金牌價本身變動才需要改資料。其餘美金計價但方案層級/金額仍有疑慮的項目（ChatGPT、Cursor、Canva、Notion、ExpressVPN）維持用 `monthlyPrice × 12` 概算，並在程式碼內以 `// TODO` 註解標記，需要人工核對後才能改成正式欄位。

| 服務 | 方案 | 目前價格（TWD） | 官方查價網址 |
|---|---|---|---|
| Spotify | 家庭方案 | 月 298 | https://www.spotify.com/tw/family/ |
| Spotify | Duo | 月 228 | https://www.spotify.com/tw/premium/ |
| YouTube Premium | 家庭方案 | 月 479 | https://www.youtube.com/premium ⚠️ |
| Netflix | 標準 | 月 380 | https://help.netflix.com/en/node/24926 |
| Netflix | 高級（4K） | 月 460 | https://help.netflix.com/en/node/24926 |
| Disney+ | 標準 | 月 285 / 年 2790 | https://www.disneyplus.com/zh-hant-tw ⚠️ |
| Disney+ | 高級 | 月 335 / 年 3280 | https://www.disneyplus.com/zh-hant-tw ⚠️ |
| Google One | 100 GB | 月 65 / 年 655 | https://one.google.com/about/plans?hl=zh_TW |
| Google One | AI Plus（400GB） | 月 165 / 年 1980 | https://one.google.com/intl/zh-TW_tw/about/google-ai-plans/ ⚠️ 2026/6 剛調價，`one.google.com/about/plans` 官網頁面尚未同步更新（仍顯示舊的 2TB／330 元），建議之後定期複查 |
| Google One | AI Pro（5TB） | 月 650 / 年 6552 | https://one.google.com/about/plans?hl=zh_TW |
| ChatGPT | Team | 月 1600 / 年 15360 | https://openai.com/business/chatgpt-pricing/ |
| Apple TV+ | 家庭共享 | 月 250 / 年 2490 | https://tv.apple.com/tw |
| HBO Max | 標準方案 | 月 220 / 年 2190 | https://www.hbomax.com/tw |
| HBO Max | 高級方案 | 月 299 / 年 2990 | https://www.hbomax.com/tw |
| Discord Nitro | 個人方案（帳號共享） | 月 320 / 年 $99.99 USD（即時匯率換算） | https://discord.com/nitro |
| friDay影音 | 影劇暢看方案 | 月 199 | https://video.friday.tw/packages |
| Crunchyroll | Mega Fan | 月 390 | https://www.crunchyroll.com/zh-tw ⚠️ 查無穩定官方台幣定價，數字為美元估算 |
| Crunchyroll | Ultimate Fan | 月 520 | https://www.crunchyroll.com/zh-tw ⚠️ 同上 |
| Claude | Pro | 月 649 | https://claude.com/pricing |
| Midjourney | Standard | 月 975 / 年 $288 USD（即時匯率換算） | https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans |
| Midjourney | Pro | 月 1950 / 年 $576 USD（即時匯率換算） | https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans |
| Cursor | Business | 月 5120 / 年 49152 | https://cursor.com/pricing |
| Duolingo | Super Family | 月換算 199 / 年 2390 | https://www.duolingo.com/family ⚠️ 台灣在地定價由第三方交叉確認 |
| MasterClass | 家庭方案（2人） | 月換算 480 / 年 5760 | https://www.masterclass.com/plans ⚠️ 官網無法直接擷取內容 |
| MasterClass | 家庭方案（6人） | 月換算 640 / 年 7680 | https://www.masterclass.com/plans ⚠️ 同上 |
| Apple Music | 家庭方案（6人） | 月 295（2026/7 由 265 調漲） | https://www.apple.com/tw/apple-music/ ⚠️ 查無官方年繳方案 |
| KKBOX | 3人家庭方案 | 月 229 | https://help.kkbox.com/tw/zh-tw/news/1279 |
| KKBOX | 6人家庭方案 | 月 260 | https://help.kkbox.com/tw/zh-tw/news/1279 |
| Microsoft 365 | 家庭版（6人） | 月 419 / 年 4190 | https://www.microsoft.com/zh-tw/microsoft-365/buy/compare-all-microsoft-365-products |
| Adobe Creative Cloud | 全應用程式 | 月 3150 / 年 27720 | https://www.adobe.com/tw/creativecloud/plans.html ⚠️ |
| Canva Pro | 團隊版 | 月 1600 / 年 16000 | https://www.canva.com/pricing/ ⚠️ 官方採美元／依席次計費，非固定台幣總價，數字僅供參考 |
| Notion | Business | 月 1920 | https://www.notion.so/pricing ⚠️ 官方採美元／依席次計費（$20/人/月），數字為換算估計 |
| iCloud+ | 200GB | 月 90 / 年 1080 | https://www.apple.com/tw/icloud/ |
| iCloud+ | 2TB | 月 300 / 年 3600 | https://www.apple.com/tw/icloud/ |
| Dropbox | Family | 月 650 | https://www.dropbox.com/family ⚠️ 無台幣官網頁面，美元換算 |
| Nintendo Switch Online | 家庭方案（無擴充包） | 年 1179 | https://www.nintendo.com/tw/switch/online/ ⚠️ |
| Nintendo Switch Online | 家庭方案（含擴充包） | 年 2399 | https://www.nintendo.com/tw/switch/online/ ⚠️ |
| NordVPN | Standard | 月 375 | https://nordvpn.com/pricing/ ⚠️ 官網查詢回傳 403，未能逐一核實 |
| NordVPN | Plus | 月 487 | https://nordvpn.com/pricing/ ⚠️ 同上 |
| NordVPN | Complete | 月 650 | https://nordvpn.com/pricing/ ⚠️ 同上 |
| ExpressVPN | 月繳 | 月 390 | https://www.expressvpn.com/pricing ⚠️ 官方已改為 Basic/Advanced/Pro 三層方案，此為舊結構待更新 |
| ExpressVPN | 年繳 | 月換算 260 | https://www.expressvpn.com/pricing ⚠️ 同上 |
| Apple One | 個人方案 | 月 390 | https://www.apple.com/tw/apple-one/ |
| Apple One | 家庭方案 | 月 490 | https://www.apple.com/tw/apple-one/ |

## 建議之後優先人工複查的項目

以上列表中標註 ⚠️ 的項目，官網頁面因動態載入或防爬蟲機制無法自動擷取內容，數字為多篇第三方報導交叉確認或匯率換算估計，並非直接讀取官網頁面文字得出。建議之後有空時逐一手動登入以下頁面核對：

- Disney+（https://www.disneyplus.com/zh-hant-tw）
- Crunchyroll（https://www.crunchyroll.com/zh-tw）
- MasterClass（https://www.masterclass.com/plans）
- Adobe Creative Cloud（https://www.adobe.com/tw/creativecloud/plans.html）
- Canva Pro（https://www.canva.com/pricing/，官方為美元依席次計費，需重新確認目錄計價邏輯是否合適）
- NordVPN（https://nordvpn.com/pricing/）
- ExpressVPN（https://www.expressvpn.com/pricing，官方已改為三層方案結構，需重新設計此服務的目錄方案）
- Nintendo Switch Online（https://www.nintendo.com/tw/switch/online/）
