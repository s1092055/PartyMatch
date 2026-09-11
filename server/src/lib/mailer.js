// TODO: 尚未接上真實寄信服務（例如 Resend／SendGrid）。
// 目前只會把信件內容印到後端 log，方便本機開發/測試時手動從 log 複製驗證連結。
// 之後要接真的寄信服務時，把下面 sendEmail() 內部的實作換成呼叫該服務的 API 即可，
// 呼叫端（auth.js）的介面不用改。

async function sendEmail({ to, subject, text }) {
  console.log(`[mailer] (尚未接上真實寄信服務，僅記錄 log)\n收件人: ${to}\n主旨: ${subject}\n內容:\n${text}`)
}

export async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.CLIENT_ORIGIN ?? ''}/verify-email?token=${token}`
  await sendEmail({
    to:      user.email,
    subject: '請驗證你的 PartyMatch 帳號信箱',
    text:    `你好 ${user.name}，\n\n請點擊以下連結完成信箱驗證（24 小時內有效）：\n${verifyUrl}\n\n如果這不是你本人的操作，請忽略此信。`,
  })
}

export async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${process.env.CLIENT_ORIGIN ?? ''}/reset-password?token=${token}`
  await sendEmail({
    to:      user.email,
    subject: '重設你的 PartyMatch 密碼',
    text:    `你好 ${user.name}，\n\n請點擊以下連結重設密碼（1 小時內有效）：\n${resetUrl}\n\n如果這不是你本人的操作，請忽略此信，你的密碼不會被更動。`,
  })
}

export async function sendAccountAlreadyExistsEmail(user) {
  await sendEmail({
    to:      user.email,
    subject: '有人嘗試用你的信箱在 PartyMatch 註冊帳號',
    text:    `你好 ${user.name}，\n\n剛剛有人嘗試使用你的信箱 ${user.email} 註冊 PartyMatch 帳號，但這個信箱已經有帳號了。\n\n如果是你本人忘記自己已經註冊過，可以直接前往登入頁；如果不是你本人操作，代表有人誤植或嘗試猜測你的信箱，不需要採取任何行動。`,
  })
}
