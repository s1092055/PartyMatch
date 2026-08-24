import dotenv from 'dotenv';
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true })

if (!process.env.DATABASE_URL?.includes('partymatch_test')) {
  throw new Error('測試資料庫設定不對：DATABASE_URL 沒有指向 partymatch_test，為了安全直接中止，避免不小心清空正式/開發資料庫')
}
