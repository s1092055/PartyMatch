// Vitest setupFiles 保證這個檔案會在每個測試檔案載入自己的 import（含 ../src/app.js）之前
// 先執行完，藉此在 PrismaClient/Redis 於 import 當下就讀取 process.env 之前，
// 把測試專用資料庫的 DATABASE_URL 等變數準備好——不能改用測試檔案內 import 才設定，
// ESM 的 import 是先於一般程式碼執行的
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true })

if (!process.env.DATABASE_URL?.includes('partymatch_test')) {
  throw new Error('測試資料庫設定不對：DATABASE_URL 沒有指向 partymatch_test，為了安全直接中止，避免不小心清空正式/開發資料庫')
}
