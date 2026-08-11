// 讓前端（此 Worker 靜態資源）跟後端 API 在瀏覽器眼中變成同一個 origin，
// 避免跨網域 Cookie 需要 SameSite=None（Safari ITP 等瀏覽器對這種第三方 Cookie 限制存活時間甚至直接封鎖）。
// /api/* 原樣轉發到 Render 後端，其餘路徑照舊回傳前端靜態資源（SPA fallback 由 assets 設定處理）。
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, env.API_ORIGIN)
      // 直接傳原始 Request 物件（保留 method/headers/body），Response 也原樣回傳，
      // 不手動重組 headers，才不會把後端一次設多個 Set-Cookie 的 header 誤合併成一個字串
      return fetch(new Request(target, request))
    }

    return env.ASSETS.fetch(request)
  },
}
