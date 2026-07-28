# Portfolio 演變記錄

## project-highlights.md：多裝置登入 session 從單一 refresh token 遷移到 per-session key

舊版沒有 `sessionId`，所有裝置共用同一把 refresh token，任何一台登出或 refresh 都會讓其他裝置一起失效。遷移到 `refresh:{userId}:{sessionId}` 的 per-session key 後，沒有 `sessionId` 的舊格式 token 仍相容查詢，refresh 一次會自動升級成新格式；舊格式相容邏輯不用特別清，refresh token 本身 7 天過期，舊 key 會自然消失（遷移後歷經一個過期週期，舊格式 token 目前已不存在，相容判斷邏輯保留但已不會再被觸發）。
