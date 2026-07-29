import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Heart,
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  UserX,
} from 'lucide-react'

export const HOME_FEATURES = [
  {
    icon: Search,
    title: '探索群組',
    desc: '依服務、價格、評分篩選，找到符合你需求的合購群組。支援關鍵字搜尋，快速縮小範圍。',
    screenshots: ['/screenshots/explore-01-grid.jpg', '/screenshots/explore-02-detail.jpg'],
    badge: '探索',
    action: { type: 'navigate', path: '/explore' },
    cta: '開始探索',
  },
  {
    icon: Search,
    title: '快速搜尋',
    desc: '告訴我們你要什麼，系統自動篩出最適合的群組讓你挑。省去逐一比較的時間，幾秒內找到選項。',
    screenshots: ['/screenshots/quickmatch-01-services.jpg', '/screenshots/quickmatch-02-filters.jpg', '/screenshots/quickmatch-03-results.jpg'],
    badge: '配對',
    action: { type: 'navigate', path: '/quick-match' },
    cta: '立即配對',
  },
  {
    icon: PlusCircle,
    title: '建立群組',
    desc: '自己當團主，設好方案和規則，等有興趣的人來申請。幾個步驟就能上架，開始招募成員。',
    screenshots: ['/screenshots/create-01-service.jpg', '/screenshots/create-02-plan.jpg', '/screenshots/create-03-settings.jpg', '/screenshots/create-04-confirm.jpg'],
    badge: '建立',
    action: { type: 'navigate', path: '/create-group' },
    cta: '建立群組',
  },
  {
    icon: LayoutDashboard,
    title: '群組管理',
    desc: '審核申請、鎖定名額、啟用服務，所有群組操作集中在一頁。款項由平台自動代管撥款，不用自己對帳。',
    screenshots: ['/screenshots/manage-01-list.jpg', '/screenshots/manage-02-applications.jpg'],
    badge: '管理',
    action: { type: 'navigate', path: '/manage-groups' },
    cta: '前往管理',
  },
  {
    icon: CreditCard,
    title: '我的訂閱',
    desc: '查看所有加入的訂閱與 PM 幣扣款紀錄，申請通過即自動從餘額代管付款，不用再手動轉帳或上傳截圖。',
    screenshots: ['/screenshots/subscriptions-01-list.jpg', '/screenshots/subscriptions-02-detail.jpg'],
    badge: '訂閱',
    action: { type: 'navigate', path: '/my-subscriptions' },
    cta: '查看訂閱',
  },
]

export const HOME_EXTRA_FEATURES = [
  {
    icon: MessageSquare,
    title: '訊息中心',
    desc: '和同群組的成員直接對話，溝通付款細節或任何問題，不需要另外找聯絡方式。',
    screenshots: ['/screenshots/messages-02-list.jpg', '/screenshots/messages-01-chat.jpg'],
    color: 'text-brand',
    bg: 'bg-brand-subtle',
  },
  {
    icon: Bell,
    title: '通知中心',
    desc: '申請結果、付款提醒、成員動態即時送達，所有重要事項都不會漏掉。',
    screenshots: ['/screenshots/notifications-01-panel.jpg'],
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Heart,
    title: '我的收藏',
    desc: '看到感興趣的群組先收起來，之後再決定要不要申請加入，隨時可以回來查看。',
    screenshots: ['/screenshots/favorites-01-list.jpg'],
    color: 'text-danger',
    bg: 'bg-danger-subtle',
  },
  {
    icon: Star,
    title: '信用分數',
    desc: '準時完成流程、不隨意退出群組都能累積評分。分數愈高，團主愈願意接受你的申請。',
    screenshots: ['/screenshots/credit-01-modal.jpg'],
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: ShieldCheck,
    title: 'PM 幣代管保障',
    desc: '申請通過即用 PM 幣（1:1 對應 TWD）自動代管款項，服務啟用後有 48 小時確認期，有爭議可向平台申訴，代管金額全程凍結，安全又透明。',
    screenshots: ['/screenshots/tokens-01-topup.jpg', '/screenshots/tokens-02-history.jpg'],
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
]

export const MEMBER_STEPS = [
  {
    step: 1,
    title: '選擇訂閱服務',
    desc: '從 28 種熱門服務中挑選，例如 Netflix、Spotify 或 ChatGPT。',
  },
  {
    step: 2,
    title: '瀏覽群組或快速搜尋',
    desc: '自己篩選合適的群組，或讓快速搜尋根據你的預算與條件自動推薦。',
  },
  {
    step: 3,
    title: '送出加入申請',
    desc: '找到喜歡的群組就送出申請，附上留言讓團主了解你。通過後會收到通知。',
  },
  {
    step: 4,
    title: '申請被接受，PM 幣自動代管',
    desc: '團主接受申請的當下，你的席位費用會直接從 PM 幣餘額轉入平台代管，不需要另外轉帳或匯款。',
  },
  {
    step: 5,
    title: '填寫服務帳號',
    desc: '團主鎖定群組後，填寫你在該服務使用的訂閱帳號資訊，團主啟用服務後即可開始使用。',
  },
  {
    step: 6,
    title: '確認服務正常，開始享用',
    desc: '服務啟用後有 48 小時確認期，確認沒問題可提前結束等待、代管款項立即撥給團主；遇到問題也可在期限內向平台申訴，之後在「我的訂閱」可追蹤扣款與續訂時間。',
  },
]

export const HOST_STEPS = [
  {
    step: 1,
    title: '建立群組',
    desc: '選擇服務與方案，設定名額、加入規則與費用，4 個步驟完成上架，開始接受申請。',
  },
  {
    step: 2,
    title: '審核申請',
    desc: '查看申請者的信用分數與留言，決定接受或拒絕。接受後名額自動減少並通知對方。',
  },
  {
    step: 3,
    title: '名額招滿，鎖定群組',
    desc: '所有名額接受後，點擊「鎖定群組」。全員的席位費用已在接受時代管完成，系統自動建立群組聊天室，通知所有成員填寫服務帳號。',
  },
  {
    step: 4,
    title: '啟用服務',
    desc: '全員填寫服務帳號後，啟用按鈕自動出現。點擊後群組進入 48 小時確認期，期間成員可確認服務正常或提出問題，之後代管款項會自動撥給你。',
  },
  {
    step: 5,
    title: '續訂或結束',
    desc: '每個計費週期結束時，選擇繼續招募下一輪，或結束這個群組。若有成員申訴，平台客服會在 3 天內裁定並凍結該筆代管金額。',
  },
]

export const HOST_TASKS = [
  {
    icon: UserCheck,
    title: '審核申請',
    desc: '收到新成員的加入申請後，查看對方的信用分數與資料，決定要接受或拒絕。',
  },
  {
    icon: PlayCircle,
    title: '啟用服務',
    desc: '成員填寫服務帳號後，點擊啟用服務。之後進入 48 小時確認期，沒有爭議代管款項會自動撥給你。',
  },
  {
    icon: UserX,
    title: '管理成員',
    desc: '成員違規或長期未付款時，可以將對方移出群組並調整其信用分數。',
  },
  {
    icon: CheckCircle2,
    title: '鎖定群組',
    desc: '名額招滿後點擊「鎖定群組」，全員的席位費用其實已在你接受申請當下自動代管完成。系統會建立群組聊天室，通知所有成員填寫服務帳號；若服務沒有官方多人邀請機制，你會先被要求提供帳號密碼。',
  },
  {
    icon: Clock,
    title: '續訂或結束',
    desc: '每個計費週期結束時，選擇繼續招募下一輪，或結束這個群組。',
  },
]

export const HOST_NOTICES = [
  {
    icon: Clock,
    text: '請在 48 小時內回覆申請，讓等待的成員有個底。',
  },
  {
    icon: ShieldAlert,
    text: '鎖定群組前確認名額已滿，鎖定後無法退回招募狀態。',
  },
  {
    icon: AlertCircle,
    text: '信用分數調整會直接影響對方，移除成員前請謹慎考慮。',
  },
  {
    icon: FileText,
    text: '群組規則請在建立時寫清楚，避免事後與成員產生糾紛。',
  },
  {
    icon: ShieldCheck,
    text: '啟用服務後有 48 小時確認期，成員申訴會凍結代管款項並由平台客服在 3 天內裁定。',
  },
]
