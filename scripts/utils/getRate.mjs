/**
 * USD → TWD exchange rate utility for seed scripts.
 *
 * Uses the free ExchangeRate-API open endpoint (no key required).
 * Rate is cached in-process to avoid duplicate requests within the same run.
 *
 * Usage:
 *   import { getUsdToTwd, twd } from './utils/getRate.mjs'
 *
 *   const rate = await getUsdToTwd()
 *   const price = twd(5.92, rate)   // NT$186
 */

const API_URL = 'https://open.er-api.com/v6/latest/USD'
const FALLBACK_RATE = 31.5   // used if network is unavailable

let _cached = null

export async function getUsdToTwd() {
  if (_cached) return _cached

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.result !== 'success') throw new Error(data['error-type'] ?? 'unknown error')
    _cached = data.rates.TWD
    return _cached
  } catch (err) {
    console.warn(`無法取得即時匯率（${err.message}），使用備用匯率 ${FALLBACK_RATE}`)
    _cached = FALLBACK_RATE
    return _cached
  }
}

/**
 * Convert USD to TWD, rounded to the nearest integer.
 * For monthly prices from annual plans, pass the annual total and set perYear=true.
 *
 * @param {number} usd       Amount in USD
 * @param {number} rate      USD/TWD rate from getUsdToTwd()
 * @param {object} [opts]
 * @param {boolean} [opts.perYear]  If true, divide by 12 before converting (annual plan → monthly)
 * @param {number}  [opts.seats]    If provided, divide by seats (group total → per seat)
 */
export function twd(usd, rate, { perYear = false, seats = 1 } = {}) {
  const monthly = perYear ? usd / 12 : usd
  return Math.round((monthly / seats) * rate)
}
