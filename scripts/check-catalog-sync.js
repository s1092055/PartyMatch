/**
 * 比對前端 src/common/data/serviceCatalog.js 與後端 server/prisma/seed.js 的服務/方案目錄，
 * 檢查 serviceId 與方案名稱（resolvePlanPricing() 用方案名稱比對）是否兩邊都存在、
 * maxMembers 是否一致。
 *
 * 背景：後端 POST /groups 用 resolvePlanPricing() 依 serviceId+planName 從
 * server/prisma/seed.js 的 Service.plans（權威資料）決定方案的完整人數；前端可以在
 * `[2, 方案人數]` 之間自訂 maxMembers（見 CLAUDE.md「建立群組價格一律 server-side derive」），
 * 但這個範圍上限就是 Service.plans 的 maxMembers，兩邊目錄的 maxMembers 對不上時，前端算出來
 * 的選擇器上限（`maxSeats`）就會跟後端實際接受的範圍不一致。
 *
 * 不比對價格：部分服務（Discord、Midjourney 等）官方為美金計價，前端用即時匯率換算顯示金額，
 * 沒有固定的台幣數字可以比對，比對價格會產生大量假警報。
 *
 * 執行：node scripts/check-catalog-sync.js
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const { SERVICES: FRONTEND_SERVICES } = await import(path.join(root, 'src/common/data/serviceCatalog.js'))

// server/prisma/seed.js 一 import 就會執行 main() 寫入資料庫，不能直接 import，
// 改成讀檔案文字、擷取 SERVICES 陣列字面量後用 Function 求值（純資料，無風險）
const seedSource = readFileSync(path.join(root, 'server/prisma/seed.js'), 'utf8')
const match = seedSource.match(/export const SERVICES = (\[[\s\S]*?\n\])\n/)
if (!match) {
  console.error('找不到 server/prisma/seed.js 的 SERVICES 陣列，比對腳本可能需要跟著調整')
  process.exit(1)
}
const BACKEND_SERVICES = new Function(`return ${match[1]}`)()

let mismatchCount = 0

for (const feService of FRONTEND_SERVICES) {
  const beService = BACKEND_SERVICES.find(s => s.id === feService.id)
  if (!beService) {
    console.log(`[serviceId 缺漏] 前端有 '${feService.id}'，後端 seed.js 沒有對應的服務`)
    mismatchCount++
    continue
  }

  for (const fePlan of feService.plans) {
    const bePlan = beService.plans.find(p => p.name === fePlan.name)
    if (!bePlan) {
      console.log(`[方案缺漏] ${feService.id}：前端有方案「${fePlan.name}」，後端 seed.js 沒有對應方案`)
      mismatchCount++
      continue
    }
    if (fePlan.maxSeats !== bePlan.maxMembers) {
      console.log(`[maxMembers 不一致] ${feService.id} / ${fePlan.name}：前端 maxSeats=${fePlan.maxSeats}，後端 maxMembers=${bePlan.maxMembers}`)
      mismatchCount++
    }
  }
}

for (const beService of BACKEND_SERVICES) {
  const feService = FRONTEND_SERVICES.find(s => s.id === beService.id)
  if (!feService) {
    console.log(`[serviceId 多餘] 後端 seed.js 有 '${beService.id}'，前端 serviceCatalog.js 沒有對應的服務`)
    mismatchCount++
  }
}

if (mismatchCount === 0) {
  console.log('前後端服務目錄一致，沒有發現落差。')
  process.exit(0)
} else {
  console.error(`\n共發現 ${mismatchCount} 處落差，請對照修正後再建立群組／重跑 demo 資料。`)
  process.exit(1)
}
