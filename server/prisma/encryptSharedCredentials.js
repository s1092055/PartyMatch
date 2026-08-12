/**
 * 一次性遷移：把資料庫內既有的明文 Group.sharedCredentials 改成 AES-256-GCM 密文。
 * 冪等：已經是密文的資料會解密成功就跳過，只處理解密失敗（代表還是明文）的資料。
 * 執行：cd server && npm run db:encrypt-credentials（正式環境見 db:encrypt-credentials:prod）
 */
import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import { encryptCredential, decryptCredential } from '../src/lib/credentialEncryption.js'

async function main() {
  const groups = await prisma.group.findMany({
    where:  { sharedCredentials: { not: null } },
    select: { id: true, sharedCredentials: true },
  })

  let migrated = 0
  let alreadyEncrypted = 0

  for (const group of groups) {
    try {
      decryptCredential(group.sharedCredentials)
      alreadyEncrypted += 1
    } catch {
      await prisma.group.update({
        where: { id: group.id },
        data:  { sharedCredentials: encryptCredential(group.sharedCredentials) },
      })
      migrated += 1
    }
  }

  console.log(`共 ${groups.length} 筆有帳密資料，${migrated} 筆已加密、${alreadyEncrypted} 筆本來就是密文（跳過）`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
