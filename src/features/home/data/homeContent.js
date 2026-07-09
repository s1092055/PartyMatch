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
  PlusCircle,
  Search,
  ShieldAlert,
  Star,
  UserCheck,
  UserX,
} from 'lucide-react'

export const HOME_FEATURES = [
  {
    icon: Search,
    title: '探索群組',
    desc: '依服務、價格、評分篩選，找到符合你需求的合購群組。支援關鍵字搜尋，快速縮小範圍。',
    videoSrc: null,
    badge: '探索',
    action: { type: 'navigate', path: '/explore' },
    cta: '開始探索',
  },
  {
    icon: Search,
    title: '快速查找',
    desc: '告訴我們你要什麼，系統自動篩出最適合的群組讓你挑。省去逐一比較的時間，幾秒內找到選項。',
    videoSrc: null,
    badge: '配對',
    action: { type: 'navigate', path: '/quick-match' },
    cta: '立即配對',
  },
  {
    icon: PlusCircle,
    title: '建立群組',
    desc: '自己當團主，設好方案和規則，等有興趣的人來申請。幾個步驟就能上架，開始招募成員。',
    videoSrc: null,
    badge: '建立',
    action: { type: 'navigate', path: '/create-group' },
    cta: '建立群組',
  },
  {
    icon: LayoutDashboard,
    title: '群組管理',
    desc: '審核申請、確認付款、管理成員，所有群組操作集中在一頁。啟用、續訂、結束群組一手掌控。',
    videoSrc: null,
    badge: '管理',
    action: { type: 'navigate', path: '/my-groups?view=host' },
    cta: '前往管理',
  },
  {
    icon: CreditCard,
    title: '我的訂閱',
    desc: '查看所有加入的訂閱、付款狀態和繳費紀錄，可以直接完成付款或聯絡團主，再也不怕漏繳。',
    videoSrc: null,
    badge: '訂閱',
    action: { type: 'navigate', path: '/my-groups?view=member' },
    cta: '查看訂閱',
  },
]

export const HOME_EXTRA_FEATURES = [
  {
    icon: MessageSquare,
    title: '訊息中心',
    desc: '和同群組的成員直接對話，溝通付款細節或任何問題，不需要另外找聯絡方式。',
    videoSrc: null,
    action: { type: 'event', event: 'pm:open-messages' },
    color: 'text-brand',
    bg: 'bg-brand-subtle',
  },
  {
    icon: Bell,
    title: '通知中心',
    desc: '申請結果、付款提醒、成員動態即時送達，所有重要事項都不會漏掉。',
    videoSrc: null,
    action: { type: 'event', event: 'pm:open-notify' },
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Heart,
    title: '我的收藏',
    desc: '看到感興趣的群組先收起來，之後再決定要不要申請加入，隨時可以回來查看。',
    videoSrc: null,
    action: null,
    color: 'text-danger',
    bg: 'bg-danger-subtle',
  },
  {
    icon: Star,
    title: '信用分數',
    desc: '每次按時付款都能累積評分。分數愈高，團主愈願意接受你的申請。',
    videoSrc: null,
    action: null,
    color: 'text-success',
    bg: 'bg-success/10',
  },
]

export const MEMBER_STEPS = [
  {
    step: 1,
    title: '選擇訂閱服務',
    desc: '從 30 種以上的熱門服務中挑選，例如 Netflix、Spotify 或 ChatGPT。',
  },
  {
    step: 2,
    title: '瀏覽群組或快速查找',
    desc: '自己篩選合適的群組，或讓快速查找根據你的預算與條件自動推薦。',
  },
  {
    step: 3,
    title: '送出加入申請',
    desc: '找到喜歡的群組就送出申請，附上留言讓團主了解你。通過後會收到通知。',
  },
  {
    step: 4,
    title: '填寫服務帳號',
    desc: '群組啟用後，填寫你在該服務使用的電子信箱（作為訂閱帳號），這是付款的必要前置步驟。',
  },
  {
    step: 5,
    title: '完成付款並上傳截圖',
    desc: '依照群組聊天室中團主提供的收款資訊（匯款帳號等）完成付款，並在平台上傳付款截圖。',
  },
  {
    step: 6,
    title: '等待確認，開始享用',
    desc: '團主確認收款後服務正式啟用，你會收到通知。之後在「我的訂閱」可追蹤付款狀態與續訂時間。',
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
    desc: '查看申請者的信用分數與留言，決定核准或拒絕。核准後名額自動減少並通知對方。',
  },
  {
    step: 3,
    title: '名額招滿，鎖定群組',
    desc: '所有名額核准後，點擊「鎖定群組」並填寫你的收款帳號。系統自動建立群組聊天室，通知所有成員填寫服務帳號與完成付款。',
  },
  {
    step: 4,
    title: '逐筆確認收款',
    desc: '成員付款並上傳截圖後，前往「收款紀錄」逐筆確認。若有問題可回報，通知成員重新補件。',
  },
  {
    step: 5,
    title: '啟用服務',
    desc: '全員付款確認後，啟用按鈕自動出現。點擊後群組正式啟用，所有成員收到通知。到期後可開始新一期收款或結束群組。',
  },
]

export const HOST_TASKS = [
  {
    icon: UserCheck,
    title: '審核申請',
    desc: '收到新成員的加入申請後，查看對方的信用分數與資料，決定要核准或拒絕。',
  },
  {
    icon: CheckCircle2,
    title: '確認付款',
    desc: '成員完成付款後，確認你已收到款項，點擊確認即完成這筆紀錄。',
  },
  {
    icon: UserX,
    title: '管理成員',
    desc: '成員違規或長期未付款時，可以將對方移出群組並調整其信用分數。',
  },
  {
    icon: CheckCircle2,
    title: '鎖定群組',
    desc: '名額招滿後點擊「鎖定群組」，填寫收款帳號後確認。系統自動建立群組聊天室，通知所有成員進行付款。',
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
]
