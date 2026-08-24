# Architecture Decision Records

ADR（Architecture Decision Record）記錄專案裡有實質取捨的技術決策：為什麼選這個做法、放棄了什麼、之後在什麼情況下該重新評估。這裡挑的是「知道什麼情況不需要用更複雜的技術」這類判斷，不是為了展示會用什麼技術。

- [0001：用 Zustand 而不是 Redux／Context](0001-use-zustand-for-state.md)
- [0002：訊息與通知用 Polling 而不是 WebSocket](0002-polling-over-websocket.md)
- [0003：refreshToken 存 HttpOnly Cookie＋Redis session](0003-refresh-token-in-httponly-cookie.md)
- [0004：用 Cloudflare Worker 讓前後端同源](0004-cloudflare-worker-same-origin-proxy.md)
- [0005：用 `prisma db push` 而不是正式 migration](0005-prisma-db-push-over-migrations.md)
