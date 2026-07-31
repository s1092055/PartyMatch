import { useEffect, useState } from 'react'

// 美金計價方案（Discord、Midjourney 等）用即時匯率換算台幣顯示金額，
// 之後美金牌價本身變動才需要改資料，匯率波動不用手動維護
const CACHE_KEY = 'pm_usd_twd_rate'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 小時內重複開啟不重打 API
const FALLBACK_RATE = 31.5 // 僅在 API 無法連線時使用的備用匯率

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && typeof cached.rate === 'number') {
      return cached.rate
    }
  } catch {
    // 忽略解析失敗，視為無快取
  }
  return null
}

export function getCachedUsdToTwdRate() {
  return readCache() ?? FALLBACK_RATE
}

// 同一個 TTL 週期內，Step2Plan／Step2Plans 等多處元件可能幾乎同時掛載並各自呼叫這支函式；
// 用模組層級的 inFlight promise 讓後到的呼叫直接等同一個請求，避免打好幾次一樣的 API
let inFlight = null

export async function fetchUsdToTwdRate() {
  const cached = readCache()
  if (cached) return cached
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      // frankfurter.app 沒有開放瀏覽器端 CORS，改用有回傳 Access-Control-Allow-Origin: * 的 open.er-api.com
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      const data = await res.json()
      const rate = data?.rates?.TWD
      if (typeof rate === 'number' && rate > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }))
        return rate
      }
    } catch {
      // 網路異常或 API 失效時 fallback 到備用匯率
    }
    return FALLBACK_RATE
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

// 先同步回傳快取／備用匯率避免畫面閃動，取得即時匯率後再更新一次
export function useUsdToTwdRate() {
  const [rate, setRate] = useState(getCachedUsdToTwdRate)

  useEffect(() => {
    let cancelled = false
    fetchUsdToTwdRate().then(r => { if (!cancelled) setRate(r) })
    return () => { cancelled = true }
  }, [])

  return rate
}
