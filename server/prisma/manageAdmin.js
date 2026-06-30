import 'dotenv/config';
import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma.js'

// 管理員帳號沒有對外開放的註冊端點，只能透過這支腳本建立/重設密碼：
//   node prisma/manageAdmin.js <email> <password> [name]
// 密碼只會存在你自己的終端機輸入紀錄跟這個 process 裡，不會經過任何 API、也不會被記錄到資料庫以外的地方。

async function main() {
  const [, , email, password, name] = process.argv
  if (!email || !password) {
    console.error('用法：node prisma/manageAdmin.js <email> <password> [name]')
    process.exit(1)
  }
  if (password.length < 12) {
    console.error('密碼長度至少 12 碼')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.upsert({
    where:  { email },
    update: { passwordHash, ...(name ? { name } : {}) },
    create: { email, passwordHash, name: name ?? email.split('@')[0] },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  })

  console.log('管理員帳號已就緒：')
  console.log(admin)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
