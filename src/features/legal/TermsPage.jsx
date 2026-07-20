import PageHeader from '../../shared/layout/PageHeader'

const SECTIONS = [
  {
    title: '一、服務說明',
    body: 'PartyMatch（以下稱「本平台」）是一個訂閱共享媒合平台，協助用戶尋找願意共享訂閱服務帳號的夥伴，並透過平台內部虛擬貨幣「PM 幣」代管群組席位費用、於確認期後撥款予團主。本平台不提供訂閱服務本身，亦不代為管理用戶的第三方服務帳號。',
  },
  {
    title: '二、使用資格',
    body: '使用本平台須年滿 18 歲，並具備完整的民事行為能力。未滿 18 歲者須取得法定代理人同意方可使用。使用本平台即表示您同意遵守本服務條款及相關法規。',
  },
  {
    title: '三、用戶責任',
    body: '用戶在加入任何共享群組前，須自行確認該訂閱服務的使用條款是否允許帳號共享。本平台不對因違反第三方服務條款所衍生的任何後果負責。用戶應確保提供的個人資訊真實、正確，並妥善保管帳號密碼。',
  },
  {
    title: '四、PM 幣代管與交易安全',
    body: '用戶申請加入群組經團主核准後，系統將自動從用戶的 PM 幣餘額扣除席位費用並轉入平台代管；服務啟用並經過確認期無爭議後，代管款項將撥入團主的 PM 幣餘額。PM 幣儲值與提領規則另見平台公告。本平台僅就代管款項的收付提供技術服務，對用戶間因訂閱服務本身品質、帳號共享方式所生之糾紛不承擔責任，用戶應謹慎選擇信任的共享夥伴。',
  },
  {
    title: '五、智慧財產權',
    body: '本平台所有內容（包括但不限於文字、圖片、設計、程式碼）均受著作權法保護，未經授權不得複製、轉載或作商業使用。用戶上傳的內容，用戶保留所有權，但授予本平台在服務範圍內使用的授權。',
  },
  {
    title: '六、服務變更與終止',
    body: '本平台保留隨時修改、暫停或終止服務的權利，並將提前通知用戶。若用戶違反本服務條款，本平台有權立即停止其使用資格，且無需事先通知。',
  },
  {
    title: '七、準據法',
    body: '本服務條款依中華民國法律解釋與執行。因本服務條款所生之爭議，雙方同意以台灣台北地方法院為第一審管轄法院。',
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="服務條款" className="mb-8" />
      <p className="mb-6 text-sm leading-relaxed text-ink-3">
        請仔細閱讀以下服務條款。使用本平台即表示您同意受本條款約束。
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
