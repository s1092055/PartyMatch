import 'dotenv/config';
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
