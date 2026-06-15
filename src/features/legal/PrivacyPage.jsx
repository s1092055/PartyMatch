import PageHeader from '../../shared/layout/PageHeader'

const SECTIONS = [
  {
    title: '一、資料收集範圍',
    body: '本平台僅收集提供服務所需的最低限度個人資料，包括：電子郵件地址（用於帳號驗證及通知）、顯示名稱（用於群組媒合）、使用行為記錄（用於改善平台功能）。本平台不收集政府核發的身分證件資料。',
  },
  {
    title: '二、資料使用目的',
    body: '所收集的個人資料僅用於下列目的：帳號建立與身分驗證；媒合功能的提供與配對；系統通知（包括申請審核結果、付款狀態提醒）；平台安全性維護與詐騙防範。本平台不將個人資料用於廣告投放或行銷目的。',
  },
  {
    title: '三、資料揭露對象',
    body: '本平台不出售、租借或提供個人資料予任何第三方廣告商。在以下情況下，本平台可能分享必要資訊：依法律規定或政府機關要求；為保護本平台、用戶或公眾的安全；在取得您明確同意的前提下。',
  },
  {
    title: '四、資料儲存與安全',
    body: '個人資料儲存於 Firebase 雲端服務，受到業界標準的加密保護。本平台採取合理的技術措施防止資料外洩，但無法保證絕對安全。如發生資料安全事件，本平台將依法規要求通知受影響的用戶。',
  },
  {
    title: '五、用戶權利',
    body: '您對自己的個人資料擁有以下權利：查閱權（查看本平台保存的您的資料）；更正權（要求更正不正確的資料）；刪除權（要求刪除帳號及相關資料）；可攜權（以結構化格式取得您的資料）。如需行使上述權利，請透過帳號設定或聯絡我們。',
  },
  {
    title: '六、Cookie 使用',
    body: '本平台使用必要的 Cookie 以維持登入狀態與偏好設定。這些 Cookie 不用於跨網站追蹤或廣告目的。您可在瀏覽器設定中管理 Cookie，但停用必要 Cookie 可能影響部分功能的正常運作。',
  },
  {
    title: '七、隱私政策更新',
    body: '本平台保留更新隱私政策的權利。重大變更將透過電子郵件或平台通知告知用戶，並至少提前 7 天通知。繼續使用本平台即表示您同意更新後的隱私政策。',
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="隱私政策" className="mb-8" />
      <p className="mb-6 text-sm leading-relaxed text-ink-3">
        本平台重視您的隱私。本政策說明我們如何收集、使用及保護您的個人資料。
      </p>
      <div className="space-y-5">
        {SECTIONS.map(s => (
          <div key={s.title} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-2 font-extrabold text-ink">{s.title}</h2>
            <p className="text-sm leading-relaxed text-ink-3">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-ink-4">最後更新：2026 年 5 月</p>
    </div>
  )
}
