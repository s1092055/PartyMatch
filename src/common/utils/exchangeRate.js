import { useEffect, useState } from 'react'

const CACHE_KEY = 'pm_usd_twd_rate';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FALLBACK_RATE = 31.5;

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && typeof cached.rate === 'number') {
      return cached.rate
    }
  } catch {}
  return null
}

export function getCachedUsdToTwdRate() {
  return readCache() ?? FALLBACK_RATE
}

let inFlight = null;

export async function fetchUsdToTwdRate() {
  const cached = readCache()
  if (cached) return cached
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json()
      const rate = data?.rates?.TWD
      if (typeof rate === 'number' && rate > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }))
        return rate
      }
    } catch {}
    return FALLBACK_RATE
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

export function useUsdToTwdRate() {
  const [rate, setRate] = useState(getCachedUsdToTwdRate)

  useEffect(() => {
    let cancelled = false
    fetchUsdToTwdRate().then(r => { if (!cancelled) setRate(r) })
    return () => { cancelled = true }
  }, [])

  return rate
}
